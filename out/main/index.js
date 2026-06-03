"use strict";
const electron = require("electron");
const path = require("path");
const events = require("events");
const child_process = require("child_process");
const uiohookNapi = require("uiohook-napi");
const Store = require("electron-store");
let ps = null;
let ready = false;
let starting = false;
const SCRIPT = `
$ErrorActionPreference = 'Continue'
try {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class MI {
  [DllImport("user32.dll")]
  public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);
}
"@
} catch {
  [Console]::Error.WriteLine('BOOTSTRAP_FAILED: ' + $_)
  exit 1
}
function L { [MI]::mouse_event(0x0002,0,0,0,[UIntPtr]::Zero); [MI]::mouse_event(0x0004,0,0,0,[UIntPtr]::Zero) }
function R { [MI]::mouse_event(0x0008,0,0,0,[UIntPtr]::Zero); [MI]::mouse_event(0x0010,0,0,0,[UIntPtr]::Zero) }
function M { [MI]::mouse_event(0x0020,0,0,0,[UIntPtr]::Zero); [MI]::mouse_event(0x0040,0,0,0,[UIntPtr]::Zero) }
function K([string]$k) { [System.Windows.Forms.SendKeys]::SendWait($k) }
[Console]::Out.WriteLine('READY')
while (($line = [Console]::In.ReadLine()) -ne $null) {
  try { Invoke-Expression $line } catch { [Console]::Error.WriteLine('CMD_ERR: ' + $_) }
}
`;
function encode(script) {
  return Buffer.from(script, "utf16le").toString("base64");
}
function ensure() {
  if (ps && !ps.killed) return true;
  if (starting) return false;
  starting = true;
  try {
    ps = child_process.spawn(
      "powershell.exe",
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand", encode(SCRIPT)],
      { windowsHide: true }
    );
    ps.stdout.setEncoding("utf8");
    ps.stdout.on("data", (chunk) => {
      if (chunk.includes("READY")) {
        ready = true;
        console.log("[inputSender] PowerShell host ready");
      }
    });
    ps.stderr.setEncoding("utf8");
    ps.stderr.on("data", (chunk) => {
      console.error("[inputSender:stderr]", chunk.trim());
    });
    ps.on("exit", (code) => {
      console.warn("[inputSender] PS exited code=", code);
      ps = null;
      ready = false;
    });
  } catch (err) {
    console.error("[inputSender] spawn failed:", err);
    ps = null;
  } finally {
    starting = false;
  }
  return ps !== null;
}
function write(cmd) {
  if (!ensure() || !ps) return;
  try {
    ps.stdin.write(cmd + "\n");
  } catch (err) {
    console.error("[inputSender] write failed:", err);
    ps = null;
    ready = false;
  }
}
const SENDKEYS_ESCAPE = /[+^%~(){}[\]]/g;
function escapeSendKeys(s) {
  return s.replace(SENDKEYS_ESCAPE, (c) => `{${c}}`);
}
function keyToSendKeys(raw) {
  const k = raw.trim();
  if (!k) return "";
  const named = {
    Space: " ",
    Enter: "{ENTER}",
    Tab: "{TAB}",
    Backspace: "{BACKSPACE}",
    Delete: "{DELETE}",
    Escape: "{ESC}",
    Esc: "{ESC}",
    ArrowUp: "{UP}",
    ArrowDown: "{DOWN}",
    ArrowLeft: "{LEFT}",
    ArrowRight: "{RIGHT}",
    Home: "{HOME}",
    End: "{END}",
    PageUp: "{PGUP}",
    PageDown: "{PGDN}",
    Insert: "{INSERT}"
  };
  if (named[k]) return named[k];
  if (/^F([1-9]|1[0-2])$/.test(k)) return `{${k}}`;
  if (k.length === 1) return escapeSendKeys(k);
  return escapeSendKeys(k);
}
const inputSender = {
  prewarm() {
    ensure();
  },
  isReady() {
    return ready;
  },
  sendMouseClick(button, type) {
    const cmd = button === "left" ? "L" : button === "right" ? "R" : "M";
    if (type === "double") write(`${cmd}; ${cmd}`);
    else write(cmd);
  },
  sendKey(rawKey) {
    const k = keyToSendKeys(rawKey);
    if (!k) return;
    const safe = k.replace(/'/g, "''");
    write(`K '${safe}'`);
  },
  tick(target, mouseButton, clickType, key) {
    if (target === "mouse") this.sendMouseClick(mouseButton, clickType);
    else this.sendKey(key);
  },
  shutdown() {
    if (ps) {
      try {
        ps.stdin.end();
        ps.kill();
      } catch {
      }
      ps = null;
      ready = false;
    }
  }
};
const KEY_CODE_TO_LABEL = Object.entries(uiohookNapi.UiohookKey).reduce(
  (acc, [label, code]) => {
    if (typeof code === "number") acc[code] = label;
    return acc;
  },
  {}
);
function mouseButtonName(button) {
  switch (button) {
    case 1:
      return "left";
    case 2:
      return "right";
    case 3:
      return "middle";
    case 4:
      return "side1";
    case 5:
      return "side2";
    default:
      return "left";
  }
}
function eventToBind(e) {
  if (e.keycode !== void 0) {
    const label = KEY_CODE_TO_LABEL[e.keycode] ?? `Key#${e.keycode}`;
    return { kind: "keyboard", code: label, label };
  }
  if (e.button !== void 0) {
    return { kind: "mouse", button: mouseButtonName(e.button) };
  }
  return null;
}
function bindMatchesKey(bind, e) {
  if (bind.kind === "keyboard" && e.keycode !== void 0) {
    const code = uiohookNapi.UiohookKey[bind.code];
    return code === e.keycode;
  }
  if (bind.kind === "mouse" && e.button !== void 0) {
    return mouseButtonName(e.button) === bind.button;
  }
  return false;
}
class InputListener {
  started = false;
  startBind = null;
  holdBind = null;
  mode = "toggle";
  onToggle = null;
  onHoldStart = null;
  onHoldEnd = null;
  onPanic = null;
  captureCb = null;
  startBindDown = false;
  holdBindDown = false;
  // FIFO timestamp queues of mouse events expected from our own synthetic clicks
  // (per button). Engine pushes a timestamp before sending a click; listener
  // pops the oldest entry when a matching event arrives. Entries older than
  // SYNTHETIC_TTL_MS are auto-pruned so a missed event doesn't permanently
  // block real release detection.
  syntheticDownQ = {};
  syntheticUpQ = {};
  static SYNTHETIC_TTL_MS = 1500;
  markSyntheticMouse(button) {
    const now = Date.now();
    (this.syntheticDownQ[button] ??= []).push(now);
    (this.syntheticUpQ[button] ??= []).push(now);
  }
  resetSynthetic() {
    this.syntheticDownQ = {};
    this.syntheticUpQ = {};
  }
  prune(queue, now) {
    while (queue.length && now - queue[0] > InputListener.SYNTHETIC_TTL_MS) queue.shift();
  }
  consumeSynthetic(map, e) {
    if (e.button === void 0) return false;
    const name = mouseButtonName(e.button);
    const q = map[name];
    if (!q) return false;
    const now = Date.now();
    this.prune(q, now);
    if (q.length === 0) return false;
    q.shift();
    return true;
  }
  start() {
    if (this.started) return;
    this.started = true;
    uiohookNapi.uIOhook.on("keydown", (e) => this.handleDown(e));
    uiohookNapi.uIOhook.on("keyup", (e) => this.handleUp(e));
    uiohookNapi.uIOhook.on("mousedown", (e) => this.handleDown(e));
    uiohookNapi.uIOhook.on("mouseup", (e) => this.handleUp(e));
    try {
      uiohookNapi.uIOhook.start();
    } catch (err) {
      console.error("[inputListener] uIOhook.start failed:", err);
    }
  }
  stop() {
    if (!this.started) return;
    try {
      uiohookNapi.uIOhook.stop();
    } catch {
    }
    this.started = false;
  }
  configure(opts) {
    this.mode = opts.mode;
    this.startBind = opts.startBind;
    this.holdBind = opts.holdBind;
    this.startBindDown = false;
    this.holdBindDown = false;
    this.resetSynthetic();
  }
  setCallbacks(cb) {
    this.onToggle = cb.onToggle;
    this.onHoldStart = cb.onHoldStart;
    this.onHoldEnd = cb.onHoldEnd;
    this.onPanic = cb.onPanic;
  }
  captureNext(cb) {
    this.captureCb = cb;
  }
  cancelCapture() {
    this.captureCb = null;
  }
  handleDown(e) {
    if (this.captureCb) {
      const bind = eventToBind(e);
      if (bind) {
        const cb = this.captureCb;
        this.captureCb = null;
        cb(bind);
      }
      return;
    }
    if (e.keycode === uiohookNapi.UiohookKey.Escape) {
      this.onPanic?.();
      return;
    }
    if (this.consumeSynthetic(this.syntheticDownQ, e)) return;
    const effectiveHoldBind = this.holdBind;
    if (this.mode === "toggle") {
      if (this.startBind && bindMatchesKey(this.startBind, e) && !this.startBindDown) {
        this.startBindDown = true;
        this.onToggle?.();
      }
    } else {
      if (effectiveHoldBind && bindMatchesKey(effectiveHoldBind, e) && !this.holdBindDown) {
        this.holdBindDown = true;
        this.onHoldStart?.();
      }
    }
  }
  handleUp(e) {
    if (this.consumeSynthetic(this.syntheticUpQ, e)) return;
    if (this.startBind && bindMatchesKey(this.startBind, e)) {
      this.startBindDown = false;
    }
    if (this.holdBind && bindMatchesKey(this.holdBind, e)) {
      if (this.mode === "hold" && this.holdBindDown) {
        this.holdBindDown = false;
        this.onHoldEnd?.();
      } else {
        this.holdBindDown = false;
      }
    }
  }
}
const inputListener = new InputListener();
const DEFAULT_SETTINGS = {
  mode: "toggle",
  target: "mouse",
  mouseButton: "left",
  clickType: "single",
  keyToSend: "F",
  intervalMs: 67,
  startBind: { kind: "keyboard", code: "F6", label: "F6" },
  holdBind: { kind: "keyboard", code: "F6", label: "F6" }
};
const DEFAULT_STATE = {
  active: false,
  totalClicks: 0,
  measuredCps: 0,
  startedAt: null,
  capturing: null
};
const store = new Store({
  defaults: { settings: DEFAULT_SETTINGS },
  name: "auto-clicker-settings"
});
const settingsStore = {
  get() {
    return { ...DEFAULT_SETTINGS, ...store.get("settings") };
  },
  set(s) {
    store.set("settings", s);
  }
};
class ClickerEngine extends events.EventEmitter {
  state = { ...DEFAULT_STATE };
  settings = settingsStore.get();
  timer = null;
  statsTimer = null;
  clicksWindow = [];
  init() {
    inputListener.setCallbacks({
      onToggle: () => this.toggle(),
      // Hold-mode press: if engine is already running, treat as a stop signal
      // (tap-to-stop fallback in case release isn't detected for any reason).
      onHoldStart: () => {
        if (this.state.active) this.stop();
        else this.start();
      },
      onHoldEnd: () => this.stop(),
      onPanic: () => this.stop()
    });
    inputListener.configure(this.settings);
    inputListener.start();
    inputSender.prewarm();
  }
  shutdown() {
    this.stop();
    inputListener.stop();
    inputSender.shutdown();
  }
  getSettings() {
    return this.settings;
  }
  saveSettings(s) {
    const wasActive = this.state.active;
    if (wasActive) this.stop();
    this.settings = s;
    settingsStore.set(s);
    inputListener.configure(s);
    if (wasActive) this.start();
  }
  getState() {
    return this.state;
  }
  start() {
    if (this.state.active) return;
    this.state = {
      active: true,
      totalClicks: 0,
      measuredCps: 0,
      startedAt: Date.now(),
      capturing: this.state.capturing
    };
    this.clicksWindow = [];
    this.scheduleNext();
    this.statsTimer = setInterval(() => this.emitState(), 120);
    this.emitState();
  }
  stop() {
    if (!this.state.active && !this.timer) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.statsTimer) clearInterval(this.statsTimer);
    this.statsTimer = null;
    this.state = { ...this.state, active: false, startedAt: null };
    inputListener.resetSynthetic();
    this.emitState();
  }
  toggle() {
    if (this.state.active) this.stop();
    else this.start();
  }
  captureBind(slot) {
    this.state = { ...this.state, capturing: slot };
    this.emitState();
    return new Promise((resolve) => {
      inputListener.captureNext((bind) => {
        if (slot === "start") this.settings = { ...this.settings, startBind: bind };
        else this.settings = { ...this.settings, holdBind: bind };
        settingsStore.set(this.settings);
        inputListener.configure(this.settings);
        this.state = { ...this.state, capturing: null };
        this.emitState();
        resolve(bind);
      });
    });
  }
  cancelCapture() {
    inputListener.cancelCapture();
    this.state = { ...this.state, capturing: null };
    this.emitState();
  }
  scheduleNext() {
    const intervalMs = Math.max(5, Math.min(5e3, Math.round(this.settings.intervalMs)));
    this.timer = setTimeout(() => this.tick(), intervalMs);
  }
  tick() {
    if (!this.state.active) return;
    if (this.settings.target === "mouse") {
      inputListener.markSyntheticMouse(this.settings.mouseButton);
      if (this.settings.clickType === "double") {
        inputListener.markSyntheticMouse(this.settings.mouseButton);
      }
    }
    inputSender.tick(
      this.settings.target,
      this.settings.mouseButton,
      this.settings.clickType,
      this.settings.keyToSend
    );
    const now = Date.now();
    this.state.totalClicks += 1;
    this.clicksWindow.push(now);
    const cutoff = now - 1e3;
    while (this.clicksWindow.length && this.clicksWindow[0] < cutoff) {
      this.clicksWindow.shift();
    }
    this.state.measuredCps = this.clicksWindow.length;
    this.scheduleNext();
  }
  emitState() {
    this.emit("state", this.state);
  }
}
const engine = new ClickerEngine();
let win = null;
function createWindow() {
  win = new electron.BrowserWindow({
    width: 460,
    height: 680,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    hasShadow: false,
    roundedCorners: true,
    thickFrame: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.on("ready-to-show", () => win?.show());
  win.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
function registerIpc() {
  electron.ipcMain.handle("settings:get", () => engine.getSettings());
  electron.ipcMain.handle("settings:save", (_e, s) => engine.saveSettings(s));
  electron.ipcMain.handle("clicker:start", () => engine.start());
  electron.ipcMain.handle("clicker:stop", () => engine.stop());
  electron.ipcMain.handle("clicker:toggle", () => engine.toggle());
  electron.ipcMain.handle("bind:capture", (_e, slot) => engine.captureBind(slot));
  electron.ipcMain.handle("bind:cancel", () => engine.cancelCapture());
  electron.ipcMain.handle("window:minimize", () => win?.minimize());
  electron.ipcMain.handle("window:close", () => win?.close());
  electron.ipcMain.handle("window:toggle-pin", () => {
    if (!win) return false;
    const next = !win.isAlwaysOnTop();
    win.setAlwaysOnTop(next);
    return next;
  });
  engine.on("state", (state) => {
    win?.webContents.send("state:change", state);
  });
}
electron.app.whenReady().then(() => {
  registerIpc();
  engine.init();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  engine.shutdown();
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("before-quit", () => {
  engine.shutdown();
});

import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import type { MouseButton, ClickType, Target } from '../shared/types'

/**
 * Windows input sender via a persistent PowerShell host process.
 *
 * All Win32 SendInput plumbing lives in a C# helper compiled at startup via
 * Add-Type. PowerShell only calls static methods (no struct-array mutation in
 * PS, which is unreliable for value types).
 *
 * Sends events at scan-code level for keyboard, and as separate down/up
 * SendInput calls with a sub-frame hold for mouse — the layout most games
 * (incl. GTA 5, Minecraft, Roblox) accept as real input.
 */

let ps: ChildProcessWithoutNullStreams | null = null
let ready = false
let starting = false

const SCRIPT = String.raw`
$ErrorActionPreference = 'Continue'
try {
  Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;

[StructLayout(LayoutKind.Sequential)]
public struct MOUSEINPUT {
  public int dx;
  public int dy;
  public uint mouseData;
  public uint dwFlags;
  public uint time;
  public IntPtr dwExtraInfo;
}

[StructLayout(LayoutKind.Sequential)]
public struct KEYBDINPUT {
  public ushort wVk;
  public ushort wScan;
  public uint dwFlags;
  public uint time;
  public IntPtr dwExtraInfo;
}

[StructLayout(LayoutKind.Sequential)]
public struct HARDWAREINPUT {
  public uint uMsg;
  public ushort wParamL;
  public ushort wParamH;
}

[StructLayout(LayoutKind.Explicit)]
public struct INPUTUNION {
  [FieldOffset(0)] public MOUSEINPUT mi;
  [FieldOffset(0)] public KEYBDINPUT ki;
  [FieldOffset(0)] public HARDWAREINPUT hi;
}

[StructLayout(LayoutKind.Sequential)]
public struct INPUT {
  public uint type;
  public INPUTUNION u;
}

public static class Native {
  public const uint INPUT_MOUSE = 0;
  public const uint INPUT_KEYBOARD = 1;

  public const uint MOUSEEVENTF_LEFTDOWN   = 0x0002;
  public const uint MOUSEEVENTF_LEFTUP     = 0x0004;
  public const uint MOUSEEVENTF_RIGHTDOWN  = 0x0008;
  public const uint MOUSEEVENTF_RIGHTUP    = 0x0010;
  public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
  public const uint MOUSEEVENTF_MIDDLEUP   = 0x0040;

  public const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
  public const uint KEYEVENTF_KEYUP       = 0x0002;
  public const uint KEYEVENTF_SCANCODE    = 0x0008;

  [DllImport("user32.dll", SetLastError = true)]
  public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

  [DllImport("user32.dll")]
  public static extern IntPtr GetMessageExtraInfo();

  [DllImport("user32.dll")]
  public static extern uint MapVirtualKey(uint uCode, uint uMapType);

  [DllImport("winmm.dll")]
  public static extern uint timeBeginPeriod(uint uPeriod);

  public static readonly int InputSize = Marshal.SizeOf(typeof(INPUT));
  public static int HoldMs = 15;

  // Sub-millisecond accurate spin-wait. Start-Sleep / Thread.Sleep are only
  // ~15ms accurate on Windows even after timeBeginPeriod(1).
  public static void SpinSleep(int ms) {
    if (ms <= 0) return;
    var sw = Stopwatch.StartNew();
    long target = ((long)ms * Stopwatch.Frequency) / 1000L;
    while (sw.ElapsedTicks < target) {
      Thread.SpinWait(50);
    }
  }

  // Extended-key VK numbers that need the KEYEVENTF_EXTENDEDKEY flag.
  private static bool IsExtendedKey(ushort vk) {
    switch (vk) {
      case 0x21: case 0x22: case 0x23: case 0x24:           // PgUp PgDn End Home
      case 0x25: case 0x26: case 0x27: case 0x28:           // Arrows
      case 0x2D: case 0x2E:                                 // Ins Del
      case 0x90:                                            // NumLock
      case 0x6F:                                            // NumpadDivide
      case 0xA3: case 0xA5:                                 // RControl RAlt
        return true;
      default: return false;
    }
  }

  public static void MouseClick(uint downFlag, uint upFlag) {
    INPUT[] inputs = new INPUT[1];
    IntPtr extra = GetMessageExtraInfo();

    inputs[0].type = INPUT_MOUSE;
    inputs[0].u.mi.dwFlags = downFlag;
    inputs[0].u.mi.dwExtraInfo = extra;
    SendInput(1, inputs, InputSize);

    SpinSleep(HoldMs);

    inputs[0].u.mi.dwFlags = upFlag;
    inputs[0].u.mi.dwExtraInfo = extra;
    SendInput(1, inputs, InputSize);
  }

  public static void KeyTap(ushort vk) {
    uint scan = MapVirtualKey(vk, 0) & 0xFF;
    bool useScan = scan != 0;
    bool extended = IsExtendedKey(vk);

    INPUT[] inputs = new INPUT[1];
    IntPtr extra = GetMessageExtraInfo();

    inputs[0].type = INPUT_KEYBOARD;
    if (useScan) {
      inputs[0].u.ki.wVk = 0;
      inputs[0].u.ki.wScan = (ushort)scan;
      inputs[0].u.ki.dwFlags = KEYEVENTF_SCANCODE | (extended ? KEYEVENTF_EXTENDEDKEY : 0);
    } else {
      inputs[0].u.ki.wVk = vk;
      inputs[0].u.ki.wScan = 0;
      inputs[0].u.ki.dwFlags = extended ? KEYEVENTF_EXTENDEDKEY : 0;
    }
    inputs[0].u.ki.dwExtraInfo = extra;
    SendInput(1, inputs, InputSize);

    SpinSleep(HoldMs);

    if (useScan) {
      inputs[0].u.ki.dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP | (extended ? KEYEVENTF_EXTENDEDKEY : 0);
    } else {
      inputs[0].u.ki.dwFlags = KEYEVENTF_KEYUP | (extended ? KEYEVENTF_EXTENDEDKEY : 0);
    }
    inputs[0].u.ki.dwExtraInfo = extra;
    SendInput(1, inputs, InputSize);
  }
}
"@
  [Native]::timeBeginPeriod(1) | Out-Null
} catch {
  [Console]::Error.WriteLine('BOOTSTRAP_FAILED: ' + $_)
  exit 1
}

function L { [Native]::MouseClick([Native]::MOUSEEVENTF_LEFTDOWN,   [Native]::MOUSEEVENTF_LEFTUP) }
function R { [Native]::MouseClick([Native]::MOUSEEVENTF_RIGHTDOWN,  [Native]::MOUSEEVENTF_RIGHTUP) }
function M { [Native]::MouseClick([Native]::MOUSEEVENTF_MIDDLEDOWN, [Native]::MOUSEEVENTF_MIDDLEUP) }
function K([uint16]$vk) { [Native]::KeyTap($vk) }
function H([int]$ms) { [Native]::HoldMs = $ms }

[Console]::Out.WriteLine('READY')
while (($line = [Console]::In.ReadLine()) -ne $null) {
  try { Invoke-Expression $line } catch { [Console]::Error.WriteLine('CMD_ERR: ' + $_) }
}
`

function encode(script: string): string {
  return Buffer.from(script, 'utf16le').toString('base64')
}

function ensure(): boolean {
  if (ps && !ps.killed) return true
  if (starting) return false
  starting = true
  try {
    ps = spawn(
      'powershell.exe',
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encode(SCRIPT)],
      { windowsHide: true }
    )
    ps.stdout.setEncoding('utf8')
    ps.stdout.on('data', (chunk: string) => {
      if (chunk.includes('READY')) {
        ready = true
        console.log('[inputSender] PowerShell host ready (SendInput via C# helper)')
      }
    })
    ps.stderr.setEncoding('utf8')
    ps.stderr.on('data', (chunk: string) => {
      console.error('[inputSender:stderr]', chunk.trim())
    })
    ps.on('exit', (code) => {
      console.warn('[inputSender] PS exited code=', code)
      ps = null
      ready = false
    })
  } catch (err) {
    console.error('[inputSender] spawn failed:', err)
    ps = null
  } finally {
    starting = false
  }
  return ps !== null
}

function write(cmd: string) {
  if (!ensure() || !ps) return
  try {
    ps.stdin.write(cmd + '\n')
  } catch (err) {
    console.error('[inputSender] write failed:', err)
    ps = null
    ready = false
  }
}

// Map a friendly key string to Windows Virtual-Key code.
const VK_NAMED: Record<string, number> = {
  Space: 0x20,
  Enter: 0x0d,
  Tab: 0x09,
  Backspace: 0x08,
  Delete: 0x2e,
  Escape: 0x1b,
  Esc: 0x1b,
  ArrowUp: 0x26,
  ArrowDown: 0x28,
  ArrowLeft: 0x25,
  ArrowRight: 0x27,
  Home: 0x24,
  End: 0x23,
  PageUp: 0x21,
  PageDown: 0x22,
  Insert: 0x2d,
  CapsLock: 0x14,
  Shift: 0x10,
  Ctrl: 0x11,
  Control: 0x11,
  Alt: 0x12
}

function keyToVk(raw: string): number | null {
  const k = raw.trim()
  if (!k) return null
  if (VK_NAMED[k] !== undefined) return VK_NAMED[k]
  const fMatch = k.match(/^F(\d{1,2})$/)
  if (fMatch) {
    const n = parseInt(fMatch[1], 10)
    if (n >= 1 && n <= 24) return 0x6f + n
  }
  if (k.length === 1) {
    const c = k.toUpperCase().charCodeAt(0)
    if ((c >= 0x41 && c <= 0x5a) || (c >= 0x30 && c <= 0x39)) return c
  }
  return null
}

export const inputSender = {
  prewarm() {
    ensure()
  },

  isReady() {
    return ready
  },

  setHoldMs(ms: number) {
    const clamped = Math.max(1, Math.min(50, Math.round(ms)))
    write(`H ${clamped}`)
  },

  sendMouseClick(button: MouseButton, type: ClickType) {
    const cmd = button === 'left' ? 'L' : button === 'right' ? 'R' : 'M'
    if (type === 'double') write(`${cmd}; ${cmd}`)
    else write(cmd)
  },

  sendKey(rawKey: string) {
    const vk = keyToVk(rawKey)
    if (vk === null) return
    write(`K ${vk}`)
  },

  tick(target: Target, mouseButton: MouseButton, clickType: ClickType, key: string) {
    if (target === 'mouse') this.sendMouseClick(mouseButton, clickType)
    else this.sendKey(key)
  },

  shutdown() {
    if (ps) {
      try {
        ps.stdin.end()
        ps.kill()
      } catch {
        // noop
      }
      ps = null
      ready = false
    }
  }
}

"use strict";
const electron = require("electron");
const api = {
  getSettings: () => electron.ipcRenderer.invoke("settings:get"),
  saveSettings: (s) => electron.ipcRenderer.invoke("settings:save", s),
  start: () => electron.ipcRenderer.invoke("clicker:start"),
  stop: () => electron.ipcRenderer.invoke("clicker:stop"),
  toggle: () => electron.ipcRenderer.invoke("clicker:toggle"),
  captureBind: (slot) => electron.ipcRenderer.invoke("bind:capture", slot),
  cancelCapture: () => electron.ipcRenderer.invoke("bind:cancel"),
  minimizeWindow: () => electron.ipcRenderer.invoke("window:minimize"),
  closeWindow: () => electron.ipcRenderer.invoke("window:close"),
  togglePin: () => electron.ipcRenderer.invoke("window:toggle-pin"),
  onStateChange: (cb) => {
    const handler = (_, state) => cb(state);
    electron.ipcRenderer.on("state:change", handler);
    return () => electron.ipcRenderer.removeListener("state:change", handler);
  }
};
electron.contextBridge.exposeInMainWorld("api", api);

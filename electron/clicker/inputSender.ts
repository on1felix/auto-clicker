import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import type { MouseButton, ClickType, Target } from '../shared/types'

/**
 * Windows input sender via a persistent PowerShell host process.
 *
 * The PowerShell script is launched via -EncodedCommand and contains a
 * read-eval loop that reads commands from stdin one line at a time and
 * executes them. Each click = one line written to stdin (~sub-millisecond
 * overhead). No native modules, no Visual Studio.
 */

let ps: ChildProcessWithoutNullStreams | null = null
let ready = false
let starting = false

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
`

function encode(script: string): string {
  // PowerShell -EncodedCommand expects UTF-16 LE base64.
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
        console.log('[inputSender] PowerShell host ready')
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

const SENDKEYS_ESCAPE = /[+^%~(){}[\]]/g

function escapeSendKeys(s: string): string {
  return s.replace(SENDKEYS_ESCAPE, (c) => `{${c}}`)
}

function keyToSendKeys(raw: string): string {
  const k = raw.trim()
  if (!k) return ''
  const named: Record<string, string> = {
    Space: ' ',
    Enter: '{ENTER}',
    Tab: '{TAB}',
    Backspace: '{BACKSPACE}',
    Delete: '{DELETE}',
    Escape: '{ESC}',
    Esc: '{ESC}',
    ArrowUp: '{UP}',
    ArrowDown: '{DOWN}',
    ArrowLeft: '{LEFT}',
    ArrowRight: '{RIGHT}',
    Home: '{HOME}',
    End: '{END}',
    PageUp: '{PGUP}',
    PageDown: '{PGDN}',
    Insert: '{INSERT}'
  }
  if (named[k]) return named[k]
  if (/^F([1-9]|1[0-2])$/.test(k)) return `{${k}}`
  if (k.length === 1) return escapeSendKeys(k)
  return escapeSendKeys(k)
}

export const inputSender = {
  prewarm() {
    ensure()
  },

  isReady() {
    return ready
  },

  sendMouseClick(button: MouseButton, type: ClickType) {
    const cmd = button === 'left' ? 'L' : button === 'right' ? 'R' : 'M'
    if (type === 'double') write(`${cmd}; ${cmd}`)
    else write(cmd)
  },

  sendKey(rawKey: string) {
    const k = keyToSendKeys(rawKey)
    if (!k) return
    const safe = k.replace(/'/g, "''")
    write(`K '${safe}'`)
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

# Auto Clicker Installer

Custom WPF installer in the same glass aesthetic as the app. Downloads the latest release zip from GitHub and unpacks it to the folder you choose.

## Prerequisites

- **.NET 8 SDK** (build only): https://dotnet.microsoft.com/download/dotnet/8.0
- **.NET 8 Desktop Runtime** (runtime, end-user): bundled prompt if missing on user machine — same link
- A built release zip uploaded to GitHub Releases (see below)

## How to publish a new release

1. In `C:\cc`:
   ```bash
   npm run dist:zip
   ```
   This produces `C:\cc\release\AutoClicker-1.0.0-win-x64.zip`.

2. Create a GitHub release:
   - Tag: `v1.0.0`
   - Upload the zip as an asset.
   - Copy the **direct download URL** of the asset (right-click → Copy link).
     It looks like:
     `https://github.com/USERNAME/auto-clicker/releases/download/v1.0.0/AutoClicker-1.0.0-win-x64.zip`

3. In `C:\cc-installer\InstallerConfig.cs` paste that URL into `DownloadUrl`.

4. Build the installer:
   ```bash
   build.bat
   ```
   Output: `publish/AutoClickerSetup.exe` (~3–5 MB).

5. Upload `AutoClickerSetup.exe` to the same GitHub release for users to download.

## What the installer does

- Frameless glass UI with animated mesh background, accent gradients, hover/press animations
- 4 screens: Welcome → Choose folder → Download (with live progress) → Done
- Downloads zip from GitHub with real-time progress (% / bytes/s)
- Extracts to user-chosen folder (default: `%LOCALAPPDATA%\Programs\AutoClicker`)
- Optional Start Menu / Desktop shortcuts
- Registers an Add/Remove Programs entry under HKCU (no admin required)
- No admin rights needed (installs per-user)

## Folder structure

```
C:\cc-installer\
├── AutoClickerInstaller.csproj
├── App.xaml / .xaml.cs
├── MainWindow.xaml / .xaml.cs
├── InstallerConfig.cs          ← edit DownloadUrl here
├── Themes/Glass.xaml
├── app.manifest
├── build.bat
└── publish/AutoClickerSetup.exe (after build)
```

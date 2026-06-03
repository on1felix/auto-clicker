# Release Workflow

## 1. Build the app

```bash
npm install
npm run dist:zip
```

This generates `release/AutoClicker-<version>-win-x64.zip` in the project root.

## 2. Publish to GitHub

```bash
git init
git remote add origin https://github.com/<USERNAME>/auto-clicker.git
git add .
git commit -m "v1.0.0"
git branch -M main
git push -u origin main
```

Then on GitHub:

1. Create a new release with tag `v1.0.0`.
2. Upload `release/AutoClicker-1.0.0-win-x64.zip` as an asset.
3. Right-click the uploaded asset → **Copy link address**.

## 3. Update the installer with the asset URL

Open `C:\cc-installer\InstallerConfig.cs` and paste the copied URL into `DownloadUrl`.

## 4. Build the installer

```bash
cd C:\cc-installer
build.bat
```

Output: `C:\cc-installer\publish\AutoClickerSetup.exe` (~3–5 MB).

## 5. Attach the installer to the same release

Upload `AutoClickerSetup.exe` to the same GitHub release as a second asset.

End users now download a single small `.exe` and the installer pulls the actual app from GitHub.

## Version bump

For each new version:

1. Update `version` in `package.json`.
2. Update `Version` and `DownloadUrl` in `InstallerConfig.cs`.
3. Repeat steps 1–5.

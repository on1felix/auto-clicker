namespace AutoClickerInstaller;

public static class InstallerConfig
{
    // ▼▼▼ EDIT THESE TWO LINES AFTER UPLOADING THE RELEASE ▼▼▼
    // The direct URL to the zip asset on the GitHub release.
    // Example: https://github.com/USERNAME/auto-clicker/releases/download/v1.0.0/AutoClicker-1.0.0-win-x64.zip
    public const string DownloadUrl =
        "https://github.com/on1felix/auto-clicker/releases/download/auto-clicker/AutoClicker-1.0.0-portable.exe";
    // ▲▲▲ EDIT THIS LINE AFTER UPLOADING THE NEW PORTABLE EXE ▲▲▲

    public const string AppName = "Auto Clicker";
    public const string AppExeName = "Auto Clicker.exe";
    public const string AppRegistryKey = @"Software\AutoClicker";
    public const string AppUninstallKey =
        @"Software\Microsoft\Windows\CurrentVersion\Uninstall\AutoClicker";
    public const string Publisher = "Danii";
    public const string Version = "1.0.0";
}

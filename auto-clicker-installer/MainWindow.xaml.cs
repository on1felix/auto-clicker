using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media.Animation;
using Microsoft.Win32;

namespace AutoClickerInstaller;

public partial class MainWindow : Window
{
    private enum Step { Welcome, Path, Downloading, Done, Error }
    private Step _step = Step.Welcome;
    private bool _busy;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += (_, _) =>
        {
            ((Storyboard)Resources["FloatA"]).Begin();
            ((Storyboard)Resources["FloatB"]).Begin();
            ((Storyboard)Resources["FloatC"]).Begin();
        };

        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        PathBox.Text = Path.Combine(programFiles, "Programs", "AutoClicker");
    }

    private void TitleBar_MouseDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ChangedButton == MouseButton.Left) DragMove();
    }

    private void Minimize_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;
    private void Close_Click(object sender, RoutedEventArgs e) => Close();

    private void Browse_Click(object sender, RoutedEventArgs e)
    {
        var dlg = new OpenFolderDialog
        {
            Title = "Choose install folder",
            InitialDirectory = PathBox.Text
        };
        if (dlg.ShowDialog() == true)
        {
            PathBox.Text = Path.Combine(dlg.FolderName, "AutoClicker");
        }
    }

    private void Back_Click(object sender, RoutedEventArgs e)
    {
        if (_busy) return;
        switch (_step)
        {
            case Step.Path: GoTo(Step.Welcome); break;
            case Step.Done:
            case Step.Error: GoTo(Step.Welcome); break;
        }
    }

    private async void Primary_Click(object sender, RoutedEventArgs e)
    {
        if (_busy) return;
        switch (_step)
        {
            case Step.Welcome: GoTo(Step.Path); break;
            case Step.Path:
                if (string.IsNullOrWhiteSpace(PathBox.Text))
                {
                    ShowError("Please pick an install folder.");
                    return;
                }
                GoTo(Step.Downloading);
                await DoInstall();
                break;
            case Step.Done:
                if (LaunchCheck.IsChecked == true)
                {
                    var exe = Path.Combine(PathBox.Text, InstallerConfig.AppExeName);
                    if (File.Exists(exe))
                    {
                        try { Process.Start(new ProcessStartInfo(exe) { UseShellExecute = true }); }
                        catch { }
                    }
                }
                Close();
                break;
            case Step.Error:
                GoTo(Step.Welcome);
                break;
        }
    }

    private void GoTo(Step s)
    {
        _step = s;
        ScreenWelcome.Visibility = Visibility.Collapsed;
        ScreenPath.Visibility = Visibility.Collapsed;
        ScreenDownload.Visibility = Visibility.Collapsed;
        ScreenDone.Visibility = Visibility.Collapsed;
        ScreenError.Visibility = Visibility.Collapsed;

        Grid? active = s switch
        {
            Step.Welcome => ScreenWelcome,
            Step.Path => ScreenPath,
            Step.Downloading => ScreenDownload,
            Step.Done => ScreenDone,
            Step.Error => ScreenError,
            _ => null
        };
        if (active != null)
        {
            active.Visibility = Visibility.Visible;
            var sb = (Storyboard)Resources["ScreenIn"];
            Storyboard.SetTarget(sb, active);
            sb.Begin();
        }

        BackBtn.Visibility = (s == Step.Path || s == Step.Error) ? Visibility.Visible : Visibility.Collapsed;
        PrimaryBtn.Content = s switch
        {
            Step.Welcome => "Continue",
            Step.Path => "Install",
            Step.Downloading => "Installing…",
            Step.Done => "Finish",
            Step.Error => "Start over",
            _ => "Continue"
        };
        PrimaryBtn.IsEnabled = s != Step.Downloading;
    }

    private async Task DoInstall()
    {
        _busy = true;
        try
        {
            var targetDir = PathBox.Text.Trim();
            Directory.CreateDirectory(targetDir);

            var finalExePath = Path.Combine(targetDir, InstallerConfig.AppExeName);
            var tempExePath = finalExePath + ".part";

            SetStatus("Downloading…", "Fetching the application from GitHub.");
            await DownloadWithProgressAsync(InstallerConfig.DownloadUrl, tempExePath);

            // Replace the existing file atomically.
            if (File.Exists(finalExePath))
            {
                try { File.Delete(finalExePath); } catch { }
            }
            File.Move(tempExePath, finalExePath);

            SetStatus("Finishing up…", "Registering shortcuts.");
            await Task.Run(() => CreateShortcutsAndRegistry(targetDir));

            GoTo(Step.Done);
        }
        catch (Exception ex)
        {
            ShowError(ex.Message);
        }
        finally
        {
            _busy = false;
        }
    }

    private async Task DownloadWithProgressAsync(string url, string destPath)
    {
        using var http = new HttpClient();
        http.Timeout = TimeSpan.FromMinutes(10);
        using var response = await http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();

        var total = response.Content.Headers.ContentLength ?? 0L;
        await using var srcStream = await response.Content.ReadAsStreamAsync();
        await using var fs = new FileStream(destPath, FileMode.Create, FileAccess.Write, FileShare.None);

        var buffer = new byte[81920];
        long readSoFar = 0;
        var sw = Stopwatch.StartNew();
        long lastReportBytes = 0;
        var lastReport = sw.ElapsedMilliseconds;

        while (true)
        {
            var read = await srcStream.ReadAsync(buffer);
            if (read == 0) break;
            await fs.WriteAsync(buffer.AsMemory(0, read));
            readSoFar += read;

            var now = sw.ElapsedMilliseconds;
            if (now - lastReport > 80 || readSoFar == total)
            {
                double pct = total > 0 ? (readSoFar * 100.0 / total) : 0;
                double bytesPerSec = (readSoFar - lastReportBytes) / Math.Max(0.001, (now - lastReport) / 1000.0);
                lastReportBytes = readSoFar;
                lastReport = now;
                Dispatcher.Invoke(() =>
                {
                    if (total > 0)
                    {
                        ProgressBar.IsIndeterminate = false;
                        ProgressBar.Value = pct;
                        ProgressLabel.Text = $"{pct:0.#}%";
                    }
                    else
                    {
                        ProgressBar.IsIndeterminate = true;
                        ProgressLabel.Text = FormatBytes(readSoFar);
                    }
                    SpeedLabel.Text = $"{FormatBytes((long)bytesPerSec)}/s";
                    LogLine.Text = total > 0
                        ? $"{FormatBytes(readSoFar)} / {FormatBytes(total)}"
                        : FormatBytes(readSoFar);
                });
            }
        }

        Dispatcher.Invoke(() =>
        {
            ProgressBar.Value = 100;
            ProgressLabel.Text = "100%";
            SpeedLabel.Text = "";
            LogLine.Text = "Download complete.";
        });
    }

    private void CreateShortcutsAndRegistry(string installDir)
    {
        var exePath = Path.Combine(installDir, InstallerConfig.AppExeName);

        // Start Menu shortcut
        bool createStart = false;
        bool createDesktop = false;
        Dispatcher.Invoke(() =>
        {
            createStart = ShortcutCheck.IsChecked == true;
            createDesktop = DesktopShortcutCheck.IsChecked == true;
        });

        if (createStart)
        {
            var startMenu = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.StartMenu),
                "Programs",
                InstallerConfig.AppName + ".lnk");
            CreateShortcut(startMenu, exePath, installDir);
        }
        if (createDesktop)
        {
            var desktop = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                InstallerConfig.AppName + ".lnk");
            CreateShortcut(desktop, exePath, installDir);
        }

        // Uninstall registry entry (HKCU, no admin needed)
        var uninstallExePath = Path.Combine(installDir, "Uninstall.exe");
        try
        {
            File.Copy(Process.GetCurrentProcess().MainModule!.FileName!, uninstallExePath, overwrite: true);
        }
        catch { }

        using var key = Registry.CurrentUser.CreateSubKey(InstallerConfig.AppUninstallKey);
        if (key != null)
        {
            key.SetValue("DisplayName", InstallerConfig.AppName);
            key.SetValue("DisplayVersion", InstallerConfig.Version);
            key.SetValue("Publisher", InstallerConfig.Publisher);
            key.SetValue("InstallLocation", installDir);
            key.SetValue("UninstallString", $"\"{uninstallExePath}\" /uninstall");
            key.SetValue("NoModify", 1, RegistryValueKind.DWord);
            key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
        }
    }

    private static void CreateShortcut(string lnkPath, string targetPath, string workingDir)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(lnkPath)!);
        // Use COM via dynamic to avoid extra dependencies
        var t = Type.GetTypeFromCLSID(new Guid("72C24DD5-D70A-438B-8A42-98424B88AFB8"));
        if (t == null) return;
        dynamic shell = Activator.CreateInstance(t)!;
        var lnk = shell.CreateShortcut(lnkPath);
        lnk.TargetPath = targetPath;
        lnk.WorkingDirectory = workingDir;
        lnk.IconLocation = targetPath + ",0";
        lnk.Save();
    }

    private void SetStatus(string title, string subtitle)
    {
        Dispatcher.Invoke(() =>
        {
            StatusTitle.Text = title;
            StatusSubtitle.Text = subtitle;
        });
    }

    private void ShowError(string msg)
    {
        ErrorText.Text = msg;
        GoTo(Step.Error);
    }

    private static string FormatBytes(long bytes)
    {
        string[] units = ["B", "KB", "MB", "GB"];
        double size = bytes;
        int unit = 0;
        while (size >= 1024 && unit < units.Length - 1)
        {
            size /= 1024;
            unit++;
        }
        return $"{size:0.#} {units[unit]}";
    }
}

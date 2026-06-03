@echo off
title Build AutoClickerSetup.exe
cd /d "%~dp0"

echo Building installer (this needs .NET 8 SDK)…
dotnet publish -c Release -r win-x64 -p:PublishSingleFile=true -p:SelfContained=false -o publish
if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
)

echo.
echo Done. Output: %~dp0publish\AutoClickerSetup.exe
echo Size:
for %%I in (publish\AutoClickerSetup.exe) do echo   %%~zI bytes
echo.
pause

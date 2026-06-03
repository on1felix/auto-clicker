@echo off
title Auto Clicker
cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo Install failed. Press any key to exit.
        pause >nul
        exit /b 1
    )
)

echo Starting Auto Clicker...
call npm run dev

if errorlevel 1 (
    echo.
    echo App exited with an error. Press any key to close.
    pause >nul
)

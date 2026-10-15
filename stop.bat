@echo off
title Stopping NEBULA Services
color 0C

echo.
echo ===============================================================================
echo     Stopping NEBULA Backend & Frontend Services
echo ===============================================================================
echo.

echo [*] Terminating processes on Port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] Stopped backend process (PID %%a)
)

echo [*] Terminating processes on Port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] Stopped frontend process (PID %%a)
)

echo.
echo [OK] All NEBULA services have been stopped.
ping 127.0.0.1 -n 3 >nul
exit /b 0

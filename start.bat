@echo off
setlocal enabledelayedexpansion
title NEBULA — Autonomous Space Anomaly Investigator
color 0B

echo.
echo ===============================================================================
echo     *  *  *  NEBULA — Autonomous Space Anomaly Investigator  *  *  *
echo          AWS Strands Decider 2B Agent Experience Hackathon 2026
echo ===============================================================================
echo.

:: Ensure current working directory is script directory
cd /d "%~dp0"

echo [1/4] Checking Python Virtual Environment...
if not exist "backend\.venv\Scripts\python.exe" (
    echo [*] Virtual environment not found. Creating backend\.venv...
    python -m venv backend\.venv
    call backend\.venv\Scripts\activate.bat
    echo [*] Installing backend dependencies...
    pip install -r backend\requirements.txt
) else (
    echo [OK] Python virtual environment verified at backend\.venv
)

echo.
echo [2/4] Checking Frontend Dependencies...
if not exist "frontend\node_modules" (
    echo [*] Node modules not found. Installing frontend dependencies...
    cd frontend
    call npm install
    cd /d "%~dp0"
) else (
    echo [OK] Frontend node_modules verified
)

echo.
echo [3/4] Launching NEBULA Backend (FastAPI on Port 8000)...
:: Check if port 8000 is already active
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if errorlevel 1 (
    start "NEBULA Backend API [Port 8000]" cmd /k "cd /d ""%~dp0backend"" && ""%~dp0backend\.venv\Scripts\python.exe"" -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    echo [OK] Backend server launched in background window
) else (
    echo [OK] Backend server is already running on http://127.0.0.1:8000
)

echo.
echo [4/4] Launching NEBULA Frontend (Next.js on Port 3000)...
:: Check if port 3000 is already active
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if errorlevel 1 (
    start "NEBULA Frontend UI [Port 3000]" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
    echo [OK] Frontend dev server launched in background window
) else (
    echo [OK] Frontend dev server is already running on http://localhost:3000
)

echo.
echo Initializing connection...
ping 127.0.0.1 -n 4 >nul

echo.
echo ===============================================================================
echo   SUCCESS: NEBULA is live! Opening browser...
echo.
echo   Observatory Dashboard:  http://localhost:3000
echo   Backend REST API:       http://localhost:8000
echo   Interactive Swagger:    http://localhost:8000/docs
echo   Health Status:          http://localhost:8000/api/health
echo ===============================================================================
echo.

:: Automatically open default browser to dashboard
start http://localhost:3000

echo (You can close this window at any time. To stop all services, run stop.bat)
ping 127.0.0.1 -n 3 >nul
exit /b 0

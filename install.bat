@echo off
REM ============================================================
REM  Museum of Russian Fairy Tales - INSTALL (run once)
REM  Double-click this file. It installs everything needed.
REM  (Messages are in English on purpose - Windows .bat files
REM   are not reliable with Cyrillic text.)
REM ============================================================
setlocal EnableExtensions
cd /d "%~dp0"
title Install - Skazka Museum

echo.
echo ============================================================
echo   Installing the Skazka Museum website
echo ============================================================
echo.

REM --- 1. Check Node.js ---------------------------------------
where node >nul 2>nul
if %errorlevel%==0 goto NODE_OK

echo [1/4] Node.js not found. Trying to install automatically...
where winget >nul 2>nul
if %errorlevel%==0 (
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  echo.
  echo Node.js installed. Please CLOSE this window and run install.bat again.
  echo ^(Windows needs a restart of this window to see the new program.^)
  echo.
  pause
  exit /b 0
) else (
  echo.
  echo Could not install automatically.
  echo The Node.js download page will open now. Install the "LTS" version,
  echo then run install.bat again.
  echo.
  start https://nodejs.org/en/download
  pause
  exit /b 1
)

:NODE_OK
for /f "delims=" %%v in ('node -v') do echo [1/4] Node.js found: %%v

REM --- 2. Install dependencies --------------------------------
echo.
echo [2/4] Installing components ^(this can take a few minutes^)...
call npm install
if errorlevel 1 goto FAIL

REM --- 3. Settings file .env ----------------------------------
echo.
if exist ".env" goto ENV_DONE
echo [3/4] Creating settings file .env with a unique security key...
powershell -NoProfile -Command "$s = -join (1..64 | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) }); (Get-Content -Raw '.env.example').Replace('change-me-to-a-long-random-string', $s) | Set-Content -NoNewline -Encoding ascii '.env'"
if errorlevel 1 goto FAIL
goto ENV_AFTER
:ENV_DONE
echo [3/4] .env already exists - keeping it.
:ENV_AFTER

REM --- 4. Create database + starting data ---------------------
echo.
echo [4/4] Creating the database and starting data...
call npm run setup
if errorlevel 1 goto FAIL

echo.
echo ============================================================
echo   DONE!  Installation complete.
echo ------------------------------------------------------------
echo   To run the site, double-click:  start.bat
echo.
echo   Website:      http://localhost:3100
echo   Admin login:  http://localhost:3100/login
echo   Login:        admin@skazkamuseum.ru
echo   Password:     muzei-admin-2026
echo   ^(change the password in the "Users" section after login^)
echo ============================================================
echo.
pause
exit /b 0

:FAIL
echo.
echo ------------------------------------------------------------
echo   Something went wrong. Take a photo of this screen
echo   and send it to Pavel.
echo ------------------------------------------------------------
echo.
pause
exit /b 1

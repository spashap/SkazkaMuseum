@echo off
REM ============================================================
REM  Museum of Russian Fairy Tales - INSTALL (run once)
REM  Run AFTER pull.bat has downloaded the code.
REM  Installs the website components, settings and database.
REM  (Messages are in English on purpose - Windows .bat files
REM   are not reliable with Cyrillic text.)
REM ============================================================
setlocal EnableExtensions
cd /d "%~dp0"
title Install - Skazka Museum

echo.
echo ============================================================
echo   Installing the Skazka Museum website  (one-time setup)
echo ============================================================
echo.

REM --- 0/3 Prerequisites (pull.bat installs these) -------------
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Please run pull.bat first - it installs
  echo everything needed and downloads the website code.
  pause
  exit /b 1
)
if not exist "package.json" (
  echo Website code not found in this folder.
  echo Please run pull.bat first - it downloads the code from GitHub.
  pause
  exit /b 1
)

REM --- 1/3 Install components ----------------------------------
echo [1/3] Installing components ^(this can take a few minutes^)...
call npm install
if errorlevel 1 goto FAIL

REM --- 2/3 Settings file .env ----------------------------------
echo.
if exist ".env" (
  echo [2/3] Settings file .env found - keeping it.
) else (
  echo [2/3] No .env found. Creating one with a unique security key...
  echo        ^(If Pavel gave you a .env file, put it in this folder instead.^)
  powershell -NoProfile -Command "$s = -join (1..64 | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) }); (Get-Content -Raw '.env.example').Replace('change-me-to-a-long-random-string', $s) | Set-Content -NoNewline -Encoding ascii '.env'"
  if errorlevel 1 goto FAIL
)

REM --- 3/3 Create database + starting data ---------------------
echo.
echo [3/3] Creating the database and starting data...
call npm run setup
if errorlevel 1 goto FAIL

echo.
echo ============================================================
echo   DONE!  Installation complete.
echo ------------------------------------------------------------
echo   Daily workflow:
echo     1. pull.bat   - get the latest version from GitHub
echo     2. start.bat  - run the site at http://localhost:3100
echo     3. work, then push.bat - send your changes to GitHub
echo.
echo   Admin login:  http://localhost:3100/login
echo   Login:        admin@skazkamuseum.ru  ^(password is in .env^)
echo.
echo   AI assistant: open this folder in a terminal and type: claude
echo   ^(first run will ask you to log in to your Claude account^)
echo ============================================================
echo.
pause
exit /b 0

:FAIL
echo.
echo ------------------------------------------------------------
echo   Something went wrong. Take a photo of this screen
echo   and send it to Pavel. Or ask the AI assistant: open a
echo   terminal in this folder, type: claude
echo   and describe the problem.
echo ------------------------------------------------------------
echo.
pause
exit /b 1

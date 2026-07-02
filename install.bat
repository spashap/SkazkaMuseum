@echo off
REM ============================================================
REM  Museum of Russian Fairy Tales - INSTALL (run once)
REM  Put this file (with pull.bat, push.bat and .env) into an
REM  empty folder, e.g. C:\projects\Muzei-skazki, and double-click.
REM  It installs: Git, Node.js, the website code from GitHub,
REM  all components, the database, and the Claude Code assistant.
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

REM --- 1/6 Git -------------------------------------------------
where git >nul 2>nul
if %errorlevel%==0 goto GIT_OK
echo [1/6] Git not found. Trying to install automatically...
where winget >nul 2>nul
if %errorlevel%==0 (
  winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
  echo.
  echo Git installed. Please CLOSE this window and run install.bat again.
  echo ^(Windows needs a restart of this window to see the new program.^)
  echo.
  pause
  exit /b 0
) else (
  echo Could not install automatically.
  echo The Git download page will open now. Install it, then run install.bat again.
  start https://git-scm.com/download/win
  pause
  exit /b 1
)
:GIT_OK
for /f "delims=" %%g in ('git --version') do echo [1/6] %%g

REM --- 2/6 Node.js ---------------------------------------------
where node >nul 2>nul
if %errorlevel%==0 goto NODE_OK
echo [2/6] Node.js not found. Trying to install automatically...
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
  echo Could not install automatically.
  echo The Node.js download page will open now. Install the "LTS" version,
  echo then run install.bat again.
  start https://nodejs.org/en/download
  pause
  exit /b 1
)
:NODE_OK
for /f "delims=" %%v in ('node -v') do echo [2/6] Node.js found: %%v

REM --- 3/6 Get the website code from GitHub --------------------
echo.
if exist ".git" (
  echo [3/6] Code already connected to GitHub - skipping download.
  goto CODE_OK
)
echo [3/6] Downloading the website code from GitHub...
git init -b main >nul
git remote add origin https://github.com/spashap/SkazkaMuseum
git fetch origin
if errorlevel 1 goto FAIL
git reset --hard origin/main
if errorlevel 1 goto FAIL
:CODE_OK

REM --- 4/6 Install components ----------------------------------
echo.
echo [4/6] Installing components ^(this can take a few minutes^)...
call npm install
if errorlevel 1 goto FAIL

REM --- 5/6 Settings file .env + database -----------------------
echo.
if exist ".env" (
  echo [5/6] Settings file .env found - keeping it.
) else (
  echo [5/6] No .env found. Creating one with a unique security key...
  echo        ^(If Pavel gave you a .env file, put it in this folder instead.^)
  powershell -NoProfile -Command "$s = -join (1..64 | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) }); (Get-Content -Raw '.env.example').Replace('change-me-to-a-long-random-string', $s) | Set-Content -NoNewline -Encoding ascii '.env'"
  if errorlevel 1 goto FAIL
)
echo        Creating the database and starting data...
call npm run setup
if errorlevel 1 goto FAIL

REM --- 6/6 Claude Code (AI assistant) --------------------------
echo.
where claude >nul 2>nul
if %errorlevel%==0 (
  echo [6/6] Claude Code already installed.
) else (
  echo [6/6] Installing Claude Code ^(AI assistant^)...
  call npm install -g @anthropic-ai/claude-code
  if errorlevel 1 (
    echo Claude Code install failed - you can retry later with:
    echo    npm install -g @anthropic-ai/claude-code
  )
)

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
echo   and send it to Pavel.
echo ------------------------------------------------------------
echo.
pause
exit /b 1

@echo off
REM ============================================================
REM  Museum of Russian Fairy Tales - PULL latest version
REM  This is also the FIRST file to run on a new computer:
REM  it installs Git, Node.js and Claude Code if missing, then
REM  downloads the newest website code from GitHub.
REM  Safe for your data: .env, the database and uploaded images
REM  are NOT tracked by Git, so they are always kept.
REM ============================================================
setlocal EnableExtensions
cd /d "%~dp0"
title Pull - Skazka Museum

echo.
echo ============================================================
echo   Getting the latest version from GitHub
echo ============================================================
echo.

REM --- 1/4 Git -------------------------------------------------
where git >nul 2>nul
if %errorlevel%==0 goto GIT_OK
echo [1/4] Git not found. Trying to install automatically...
where winget >nul 2>nul
if %errorlevel%==0 (
  winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
  echo.
  echo Git installed. Please CLOSE this window and run pull.bat again.
  echo ^(Windows needs a restart of this window to see the new program.^)
  echo.
  pause
  exit /b 0
) else (
  echo Could not install automatically.
  echo The Git download page will open now. Install it, then run pull.bat again.
  start https://git-scm.com/download/win
  pause
  exit /b 1
)
:GIT_OK
for /f "delims=" %%g in ('git --version') do echo [1/4] %%g

REM --- 2/4 Node.js ---------------------------------------------
where node >nul 2>nul
if %errorlevel%==0 goto NODE_OK
echo [2/4] Node.js not found. Trying to install automatically...
where winget >nul 2>nul
if %errorlevel%==0 (
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  echo.
  echo Node.js installed. Please CLOSE this window and run pull.bat again.
  echo ^(Windows needs a restart of this window to see the new program.^)
  echo.
  pause
  exit /b 0
) else (
  echo Could not install automatically.
  echo The Node.js download page will open now. Install the "LTS" version,
  echo then run pull.bat again.
  start https://nodejs.org/en/download
  pause
  exit /b 1
)
:NODE_OK
for /f "delims=" %%v in ('node -v') do echo [2/4] Node.js found: %%v

REM --- 3/4 Claude Code (AI assistant) --------------------------
where claude >nul 2>nul
if %errorlevel%==0 (
  echo [3/4] Claude Code found.
  goto CLAUDE_OK
)
echo [3/4] Installing Claude Code ^(AI assistant^)...
call npm install -g @anthropic-ai/claude-code
if errorlevel 1 (
  echo Claude Code install failed - not critical, you can retry later with:
  echo    npm install -g @anthropic-ai/claude-code
)
:CLAUDE_OK

REM --- 4/4 Download the code -----------------------------------
echo.
if exist ".git" goto HAVE_REPO
echo [4/4] First download of the website code...
git init -b main >nul
git remote add origin https://github.com/spashap/SkazkaMuseum
git fetch origin
if errorlevel 1 goto FAIL
git reset --hard origin/main
if errorlevel 1 goto FAIL
goto CODE_DONE

:HAVE_REPO
echo [4/4] Checking for updates...
git fetch origin
if errorlevel 1 goto FAIL

REM protect unpushed local changes
set CHANGES=0
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if "%CHANGES%"=="0" goto CLEAN
echo.
echo   WARNING: you have local changes that were NOT pushed yet!
echo   If you continue, these changes will be DELETED.
echo.
echo   Better: close this window and run push.bat first.
echo.
set /p ANSWER=  Type DELETE to throw away local changes, or press Enter to cancel:
if /i not "%ANSWER%"=="DELETE" (
  echo.
  echo   Cancelled. Nothing was changed.
  pause
  exit /b 0
)
:CLEAN
git reset --hard origin/main
if errorlevel 1 goto FAIL
:CODE_DONE

REM --- update project components (only after install.bat ran) ---
if not exist "node_modules" goto FIRST_TIME

echo.
echo   Updating components...
call npm install
if errorlevel 1 goto FAIL
echo.
echo   Applying database updates...
call npx prisma generate
if errorlevel 1 goto FAIL
call npx prisma db push --skip-generate
if errorlevel 1 goto FAIL

set SITEVER=unknown
if exist "VERSION" set /p SITEVER=<VERSION
echo.
echo ============================================================
echo   DONE!  You now have the latest version: %SITEVER%
echo   To run the site, double-click:  start.bat
echo ============================================================
echo.
pause
exit /b 0

:FIRST_TIME
echo.
echo ============================================================
echo   Code downloaded!  Next step (one time): run  install.bat
echo ------------------------------------------------------------
echo   Tip: the AI assistant is already available. If you have
echo   any problem, open a terminal in this folder and type:
echo      claude
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

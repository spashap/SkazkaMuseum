@echo off
REM ============================================================
REM  Museum of Russian Fairy Tales - GET LATEST VERSION
REM  Double-click to pull the newest code from GitHub and rebuild.
REM
REM  Safe for your data: your settings (.env), your database, and
REM  your uploaded images are NOT tracked by Git, so they are kept.
REM  Only the program code is updated.
REM  (English messages on purpose - .bat files are unreliable with Cyrillic.)
REM ============================================================
setlocal EnableExtensions
cd /d "%~dp0"
title Update - Skazka Museum
set REPO=https://github.com/spashap/SkazkaMuseum

echo.
echo ============================================================
echo   Getting the latest version from GitHub
echo ============================================================
echo.

REM --- 1. Check Git ------------------------------------------
where git >nul 2>nul
if %errorlevel%==0 goto GIT_OK

echo [1/4] Git not found. Trying to install automatically...
where winget >nul 2>nul
if %errorlevel%==0 (
  winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
  echo.
  echo Git installed. Please CLOSE this window and run PullFromGit.bat again.
  echo ^(Windows needs a restart of this window to see the new program.^)
  echo.
  pause
  exit /b 0
) else (
  echo.
  echo Could not install automatically.
  echo The Git download page will open now. Install it, then run this file again.
  echo.
  start https://git-scm.com/download/win
  pause
  exit /b 1
)

:GIT_OK
for /f "delims=" %%g in ('git --version') do echo [1/4] %%g

REM --- 2. Make sure this folder is connected to the repo ------
echo.
echo [2/4] Downloading latest code...
if exist ".git" goto HAVE_REPO
git init >nul
git remote add origin %REPO%
:HAVE_REPO

git fetch origin
if errorlevel 1 goto FAIL

REM Hard reset to the GitHub version. This updates ONLY tracked source files.
REM Your .env, database, and uploaded images are ignored by Git and stay untouched.
git reset --hard origin/main
if errorlevel 1 goto FAIL

REM --- 3. Update components ----------------------------------
echo.
echo [3/4] Updating components...
call npm install
if errorlevel 1 goto FAIL

REM --- 4. Apply any database/schema updates ------------------
echo.
echo [4/4] Applying database updates...
call npx prisma generate
if errorlevel 1 goto FAIL
call npx prisma db push --skip-generate
if errorlevel 1 goto FAIL

echo.
echo ============================================================
echo   DONE!  You now have the latest version.
echo   To run the site, double-click:  start.bat
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

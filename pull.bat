@echo off
REM ============================================================
REM  Museum of Russian Fairy Tales - PULL latest version
REM  Double-click to get the newest code from GitHub.
REM  Safe for your data: .env, the database and uploaded images
REM  are NOT tracked by Git, so they are always kept.
REM  If you have local changes that were not pushed, it will ask
REM  before deleting them.
REM ============================================================
setlocal EnableExtensions
cd /d "%~dp0"
title Pull - Skazka Museum

echo.
echo ============================================================
echo   Getting the latest version from GitHub
echo ============================================================
echo.

git fetch origin
if errorlevel 1 goto FAIL

REM --- protect unpushed local changes --------------------------
set CHANGES=0
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if "%CHANGES%"=="0" goto CLEAN

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

:FAIL
echo.
echo ------------------------------------------------------------
echo   Something went wrong. Take a photo of this screen
echo   and send it to Pavel.
echo ------------------------------------------------------------
echo.
pause
exit /b 1

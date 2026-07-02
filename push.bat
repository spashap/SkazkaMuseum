@echo off
REM ============================================================
REM  Museum of Russian Fairy Tales - PUSH your changes to GitHub
REM  Double-click after you finished working. It will:
REM    1. raise the site version (V01.001 -> V01.002 -> ...)
REM    2. save your changes with a description
REM    3. send everything to GitHub
REM  The version is shown in the footer of every page.
REM ============================================================
setlocal EnableExtensions
cd /d "%~dp0"
title Push - Skazka Museum

echo.
echo ============================================================
echo   Sending your changes to GitHub
echo ============================================================
echo.

REM --- GitHub access + git identity from .env --------------------
set GITHUB_TOKEN=
set GIT_USER_NAME=
set GIT_USER_EMAIL=
if exist ".env" for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
  if "%%a"=="GITHUB_TOKEN" set "GITHUB_TOKEN=%%~b"
  if "%%a"=="GIT_USER_NAME" set "GIT_USER_NAME=%%~b"
  if "%%a"=="GIT_USER_EMAIL" set "GIT_USER_EMAIL=%%~b"
)
if not "%GITHUB_TOKEN%"=="" git remote set-url origin https://%GITHUB_TOKEN%@github.com/spashap/SkazkaMuseum

REM first commit on a fresh PC needs a git identity
set HASNAME=
for /f "delims=" %%n in ('git config user.name 2^>nul') do set HASNAME=%%n
if defined HASNAME goto ID_OK
if "%GIT_USER_NAME%"=="" set GIT_USER_NAME=Skazka CEO
if "%GIT_USER_EMAIL%"=="" set GIT_USER_EMAIL=ceo@skazkamuseum.ru
git config user.name "%GIT_USER_NAME%"
git config user.email "%GIT_USER_EMAIL%"
:ID_OK

REM --- anything to push? ---------------------------------------
set CHANGES=0
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if not "%CHANGES%"=="0" goto HAVE_CHANGES
echo   No local changes found - nothing to push.
echo.
pause
exit /b 0
:HAVE_CHANGES

REM --- bump version: V01.001 -> V01.002 (minor +1) --------------
if not exist "VERSION" (echo V01.000)>VERSION
set /p CURVER=<VERSION
for /f "tokens=1,2 delims=." %%a in ("%CURVER%") do (
  set MAJ=%%a
  set MIN=%%b
)
REM octal-safe increment of the 3-digit minor part
set /a NEXT=1%MIN%+1
set MIN=%NEXT:~1%
set NEWVER=%MAJ%.%MIN%
(echo %NEWVER%)>VERSION
echo   New site version: %NEWVER%
echo.

REM --- describe and save ----------------------------------------
set MSG=site update
set /p MSG=  Describe your changes in a few words (or press Enter):
git add -A
git commit -m "%NEWVER%: %MSG%"
if errorlevel 1 goto FAIL

REM --- merge remote changes, then push ---------------------------
git pull --rebase origin main
if errorlevel 1 (
  git rebase --abort >nul 2>nul
  echo.
  echo   Your changes conflict with changes on GitHub.
  echo   Your work is saved locally. Ask Claude Code for help:
  echo   open a terminal here, type: claude
  echo   and say: "help me finish pushing my changes to GitHub"
  pause
  exit /b 1
)
git push origin main
if errorlevel 1 goto FAIL

echo.
echo ============================================================
echo   DONE!  Version %NEWVER% is on GitHub.
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

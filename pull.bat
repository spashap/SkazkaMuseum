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
REM Re-run from a TEMP copy: the git commands below may overwrite THIS file
REM while it is executing (cmd reads .bat files by byte offset -> corruption).
if /i "%~1"=="--from-temp" goto FROMTEMP
copy /y "%~f0" "%TEMP%\skazka-pull.bat" >nul 2>nul
if not exist "%TEMP%\skazka-pull.bat" goto NOTEMP
"%TEMP%\skazka-pull.bat" --from-temp "%~dp0"
REM Still here = the TEMP copy exists but could not start. Fall through.
:NOTEMP
echo.
echo   NOTE: could not run via the TEMP folder - running directly.
echo   (Only matters if this update changes pull.bat itself.)
echo.
cd /d "%~dp0"
goto START
:FROMTEMP
cd /d "%~2"
:START
title Pull - Skazka Museum

echo.
echo ============================================================
echo   Getting the latest version from GitHub
echo ============================================================
echo.

REM --- GitHub access: use GITHUB_TOKEN from .env when present ---
REM NOTE: the "%GITHUB_TOKEN: =%" line below must only run when the
REM variable is defined - on an undefined variable cmd keeps that text
REM literally (with its space) and the whole line fails to parse.
set GITHUB_TOKEN=
if exist ".env" goto HAVE_ENV
echo   NOTE: no .env file found in this folder.
echo   It must be next to pull.bat and named exactly  .env
echo   ^(not "env" and not ".env.txt" - ask Pavel to re-send it^).
echo   Trying to continue without it...
echo.
goto TOKEN_DONE
:HAVE_ENV
for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
  if "%%a"=="GITHUB_TOKEN" set "GITHUB_TOKEN=%%~b"
)
if defined GITHUB_TOKEN goto CHECK_TOKEN
echo   NOTE: .env found, but GITHUB_TOKEN could not be read from it.
echo   If the download below fails, ask Pavel to re-send the .env file.
echo.
goto TOKEN_DONE
:CHECK_TOKEN
REM ignore placeholder/invalid tokens (spaces would break the git URL)
if not "%GITHUB_TOKEN: =%"=="%GITHUB_TOKEN%" (
  echo   NOTE: GITHUB_TOKEN in .env looks invalid - ignoring it.
  set GITHUB_TOKEN=
)
:TOKEN_DONE
set REPO_URL=https://github.com/spashap/SkazkaMuseum
if not "%GITHUB_TOKEN%"=="" set REPO_URL=https://%GITHUB_TOKEN%@github.com/spashap/SkazkaMuseum

REM --- 1/4 Git -------------------------------------------------
REM Installers update PATH for NEW windows only, and sometimes not at
REM all - so also probe the standard install folders directly.
call :FIND_GIT
if defined GIT_FOUND goto GIT_OK
echo [1/4] Git not found. Trying to install automatically...
where winget >nul 2>nul
if errorlevel 1 (
  echo Could not install automatically.
  echo The Git download page will open now. Install it, then run pull.bat again.
  start https://git-scm.com/download/win
  pause
  exit /b 1
)
winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
call :FIND_GIT
if defined GIT_FOUND goto GIT_OK
echo.
echo Git seems installed, but it cannot be found in the usual places.
echo Please RESTART the computer and run pull.bat again.
echo If this message repeats after a restart, send a photo to Pavel.
echo.
pause
exit /b 0
:GIT_OK
for /f "delims=" %%g in ('git --version') do echo [1/4] %%g

REM --- 2/4 Node.js ---------------------------------------------
call :FIND_NODE
if defined NODE_FOUND goto NODE_OK
echo [2/4] Node.js not found. Trying to install automatically...
where winget >nul 2>nul
if errorlevel 1 (
  echo Could not install automatically.
  echo The Node.js download page will open now. Install the "LTS" version,
  echo then run pull.bat again.
  start https://nodejs.org/en/download
  pause
  exit /b 1
)
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
call :FIND_NODE
if defined NODE_FOUND goto NODE_OK
echo.
echo Node.js seems installed, but it cannot be found in the usual places.
echo Please RESTART the computer and run pull.bat again.
echo If this message repeats after a restart, send a photo to Pavel.
echo.
pause
exit /b 0
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
git remote add origin %REPO_URL%
git fetch origin
if errorlevel 1 goto FAIL
git reset --hard origin/main
if errorlevel 1 goto FAIL
goto CODE_DONE

:HAVE_REPO
echo [4/4] Checking for updates...
git remote set-url origin %REPO_URL%
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

REM ===== helpers ===============================================
REM Look for git: first on PATH, then in the standard install
REM folders (machine-wide and per-user); add to PATH when found.
:FIND_GIT
set GIT_FOUND=
where git >nul 2>nul
if not errorlevel 1 goto FOUND_GIT
if exist "%ProgramFiles%\Git\cmd\git.exe" set "PATH=%ProgramFiles%\Git\cmd;%PATH%"
if exist "%LocalAppData%\Programs\Git\cmd\git.exe" set "PATH=%LocalAppData%\Programs\Git\cmd;%PATH%"
where git >nul 2>nul
if errorlevel 1 goto :eof
:FOUND_GIT
set GIT_FOUND=1
goto :eof

REM Same for node/npm (+ the npm global folder, where claude lives).
:FIND_NODE
set NODE_FOUND=
if exist "%AppData%\npm" set "PATH=%AppData%\npm;%PATH%"
where node >nul 2>nul
if not errorlevel 1 goto FOUND_NODE
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\nodejs\node.exe" set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto :eof
:FOUND_NODE
set NODE_FOUND=1
goto :eof

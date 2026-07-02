@echo off
REM Push local changes to GitHub. Run from the project folder.
REM Usage:  .\release.bat "commit message"
setlocal
set MSG=%~1
if "%MSG%"=="" set MSG=update

echo == staging changes ==
git add -A
git commit -m "%MSG%"
if errorlevel 1 echo (nothing to commit, continuing)

echo == pushing to GitHub ==
git push origin main
if errorlevel 1 (
  echo.
  echo ERROR - push failed. See output above.
  exit /b 1
)
echo.
echo == pushed. Now run: deploy-remote.bat ==

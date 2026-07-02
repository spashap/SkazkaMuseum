@echo off
REM Museum of Russian Fairy Tales - start the dev server.
REM Close this window to stop the site.
cd /d "%~dp0"
title Skazka Museum - site is running (do not close this window)

echo.
echo Starting the site...
echo When it is ready, open this link in your browser:
echo.
echo     http://localhost:3100
echo.
echo To STOP the site, close this window.
echo.

call npm run dev

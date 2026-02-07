@echo off
echo Cleaning cache...
if exist .react-router rmdir /s /q .react-router
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist build rmdir /s /q build
echo Cache cleaned!
echo.
echo Starting dev server...
npm run dev

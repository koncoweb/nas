@echo off
echo ========================================
echo Setup TailAdmin Template Integration
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git first: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Step 1: Creating template directory...
if not exist "template" mkdir template
cd template

echo.
echo Step 2: Cloning TailAdmin template...
if exist "free-nextjs-admin-dashboard" (
    echo Template already exists. Updating...
    cd free-nextjs-admin-dashboard
    git pull
    cd ..
) else (
    git clone https://github.com/TailAdmin/free-nextjs-admin-dashboard.git
)

echo.
echo Step 3: Installing template dependencies...
cd free-nextjs-admin-dashboard
call npm install --legacy-peer-deps

echo.
echo ========================================
echo Template setup completed!
echo ========================================
echo.
echo Template location: template/free-nextjs-admin-dashboard
echo.
echo Next steps:
echo 1. Review template structure
echo 2. Run: cd template/free-nextjs-admin-dashboard
echo 3. Run: npm run dev (to preview template)
echo 4. Then run: setup-nas-new.bat (to create new NAS project)
echo.
pause

@echo off
echo ========================================
echo Setup NAS New Project with TailAdmin
echo ========================================
echo.

REM Check if template exists
if not exist "template\free-nextjs-admin-dashboard" (
    echo ERROR: Template not found!
    echo Please run setup-template.bat first
    pause
    exit /b 1
)

echo Step 1: Creating nas-new directory...
if exist "nas-new" (
    echo WARNING: nas-new directory already exists!
    echo Do you want to delete and recreate? (Y/N)
    set /p confirm=
    if /i "%confirm%"=="Y" (
        rmdir /s /q nas-new
    ) else (
        echo Cancelled.
        pause
        exit /b 0
    )
)

echo.
echo Step 2: Copying template to nas-new...
xcopy /E /I /H /Y "template\free-nextjs-admin-dashboard" "nas-new"

echo.
echo Step 3: Copying NAS configurations...
if exist "nas\.env.local" copy /Y "nas\.env.local" "nas-new\.env.local"
if exist "nas\vercel.json" copy /Y "nas\vercel.json" "nas-new\vercel.json"

echo.
echo Step 4: Creating integration directories...
mkdir "nas-new\src\lib\nas-legacy" 2>nul
mkdir "nas-new\docs" 2>nul

echo.
echo Step 5: Copying NAS core files...
REM Copy database connection
if exist "nas\src\lib\db.ts" copy /Y "nas\src\lib\db.ts" "nas-new\src\lib\db.ts"

REM Copy auth configuration
if exist "nas\src\lib\auth.ts" copy /Y "nas\src\lib\auth.ts" "nas-new\src\lib\auth.ts"

REM Copy validations
if exist "nas\src\lib\validations.ts" copy /Y "nas\src\lib\validations.ts" "nas-new\src\lib\validations.ts"

REM Copy types
if exist "nas\src\types\index.ts" copy /Y "nas\src\types\index.ts" "nas-new\src\types\index.ts"

REM Copy middleware
if exist "nas\src\middleware.ts" copy /Y "nas\src\middleware.ts" "nas-new\src\middleware.ts"

echo.
echo Step 6: Creating documentation...
echo # NAS New - TailAdmin Integration > "nas-new\docs\README.md"
echo. >> "nas-new\docs\README.md"
echo This is the new NAS application built with TailAdmin template. >> "nas-new\docs\README.md"
echo. >> "nas-new\docs\README.md"
echo ## Original NAS Features >> "nas-new\docs\README.md"
echo - Authentication with NextAuth.js >> "nas-new\docs\README.md"
echo - Customer Management >> "nas-new\docs\README.md"
echo - Materials Catalog >> "nas-new\docs\README.md"
echo - Quotation Management >> "nas-new\docs\README.md"
echo - Project Tracking >> "nas-new\docs\README.md"
echo - Material Requests >> "nas-new\docs\README.md"
echo - Invoice Management >> "nas-new\docs\README.md"
echo - Project Reports >> "nas-new\docs\README.md"
echo - Dashboard Analytics >> "nas-new\docs\README.md"
echo. >> "nas-new\docs\README.md"
echo ## Development >> "nas-new\docs\README.md"
echo ```bash >> "nas-new\docs\README.md"
echo npm install --legacy-peer-deps >> "nas-new\docs\README.md"
echo npm run dev >> "nas-new\docs\README.md"
echo ``` >> "nas-new\docs\README.md"

echo.
echo Step 7: Updating package.json with NAS dependencies...
if exist "nas-new-package.json" (
    copy /Y "nas-new-package.json" "nas-new\package.json"
    echo Package.json updated with exact NAS versions
) else (
    echo WARNING: nas-new-package.json not found, using template package.json
)

echo.
echo ========================================
echo NAS New project created successfully!
echo ========================================
echo.
echo Project location: nas-new/
echo.
echo Next steps:
echo 1. cd nas-new
echo 2. npm install --legacy-peer-deps
echo 3. Copy .env.local from nas/ if not already copied
echo 4. npm run dev
echo 5. Start migrating components from nas/
echo.
echo See TEMPLATE_INTEGRATION_PLAN.md for detailed migration guide
echo.
pause

@echo off
REM ===========================================
REM BugTrail - Setup and Run Script
REM ===========================================
REM Run this script from the bug-tracker directory
REM Prerequisites: Node.js 18+, MongoDB running locally
REM ===========================================

echo.
echo ========================================
echo   BugTrail Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node --version

REM Install backend dependencies
echo.
echo [1/6] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Backend npm install failed
    cd ..
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed

REM Create .env from example if not exists
if not exist .env (
    echo [2/6] Creating .env file from .env.example...
    copy .env.example .env >nul
    echo [OK] .env created - PLEASE EDIT IT with your MONGO_URI and JWT_SECRET
    echo.
    echo     Default MONGO_URI: mongodb://localhost:27017/bugtracker
    echo     You MUST set a JWT_SECRET value
    echo.
) else (
    echo [2/6] .env already exists - skipping
)

cd ..

REM Install frontend dependencies
echo [3/6] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend npm install failed
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

REM Build frontend to check for errors
echo.
echo [4/6] Building frontend (checking for compilation errors)...
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Frontend build had errors - check output above
) else (
    echo [OK] Frontend builds successfully
)

cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo   1. Make sure MongoDB is running
echo.
echo   2. Edit backend\.env if needed:
echo      - Set MONGO_URI (default: mongodb://localhost:27017/bugtracker)
echo      - Set JWT_SECRET to any strong random string
echo.
echo   3. Seed the database:
echo      cd backend
echo      npm run seed
echo.
echo   4. Start the backend (Terminal 1):
echo      cd backend
echo      npm run dev
echo.
echo   5. Start the frontend (Terminal 2):
echo      cd frontend
echo      npm run dev
echo.
echo   6. Open http://localhost:5173 in your browser
echo.
echo   7. Login with: admin@bugtracker.dev / password123
echo.
echo ========================================
pause

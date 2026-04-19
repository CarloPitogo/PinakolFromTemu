@echo off
echo ==========================================
echo    STARTING PINAKOL FROM TEMU SYSTEM
echo ==========================================

:: Navigate to backend and ensure DB exists
echo Checking Database...
cd backend
php create_db.php
echo Running Migrations...
php artisan migrate --force

:: Start servers in new windows
echo Starting Laravel Backend...
start cmd /k "php artisan serve"

echo Starting Vite Frontend...
cd ..\frontend
start cmd /k "npm run dev"

echo ==========================================
echo System is starting in separate windows.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo ==========================================
pause

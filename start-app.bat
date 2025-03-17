@echo off
echo Starting Job Application Tracker...

REM Start the backend server with PowerShell
start "Backend - FastAPI" powershell -Command "& {. './backend/venv/scripts/activate.ps1'; cd backend; uvicorn app.main:app --reload}"

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak > nul

REM Start the frontend server
start "Frontend - React" cmd /k "cd frontend && npm start"

echo Both services have been started in separate windows.
echo - Backend: FastAPI running on http://localhost:8000
echo - Frontend: React running on http://localhost:3000

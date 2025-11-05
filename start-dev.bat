@echo off
echo Iniciando Sistema Financeiro - Mycashnest
echo.

echo Iniciando Backend...
start "Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo Iniciando Frontend...
start "Frontend" cmd /k "cd frontend && ng serve"

echo.
echo Sistema iniciado!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:4200
echo.
pause



@echo off
echo ========================================
echo   Sistema Financeiro - Mycashnest
echo ========================================
echo.

echo Verificando dependencias...

if not exist "backend\node_modules" (
    echo Instalando dependencias do backend...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Instalando dependencias do frontend...
    cd frontend
    npm install
    cd ..
)

echo.
echo Iniciando Backend e Frontend...
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:4200
echo.
echo Pressione Ctrl+C para parar os servicos
echo.

concurrently "cd backend && node server.js" "cd frontend && ng serve" --names "BACKEND,FRONTEND" --prefix-colors "blue,green"



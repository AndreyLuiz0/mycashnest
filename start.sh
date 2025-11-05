#!/bin/bash

echo "========================================"
echo "  Sistema Financeiro - Mycashnest"
echo "========================================"
echo

echo "Verificando dependências..."

if [ ! -d "backend/node_modules" ]; then
    echo "Instalando dependências do backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Instalando dependências do frontend..."
    cd frontend && npm install && cd ..
fi

echo
echo "Iniciando Backend e Frontend..."
echo
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:4200"
echo
echo "Pressione Ctrl+C para parar os serviços"
echo

concurrently "cd backend && node server.js" "cd frontend && ng serve" --names "BACKEND,FRONTEND" --prefix-colors "blue,green"



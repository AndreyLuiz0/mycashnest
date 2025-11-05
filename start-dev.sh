#!/bin/bash

echo "Iniciando Sistema Financeiro - Mycashnest"
echo

echo "Iniciando Backend..."
cd backend && npm start &
BACKEND_PID=$!

sleep 3

echo "Iniciando Frontend..."
cd ../frontend && ng serve &
FRONTEND_PID=$!

echo
echo "Sistema iniciado!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:4200"
echo
echo "Pressione Ctrl+C para parar os serviços"

# Aguardar interrupção
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait



#!/bin/bash
# Script de build para Render - Monorepo completo

echo "🔨 Construyendo monorepo completo..."

# Instalar dependencias del proyecto raíz
echo "📦 Instalando dependencias del proyecto raíz..."
npm install

# Construir frontend
echo "🏗️  Construyendo frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build completado"

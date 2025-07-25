#!/bin/bash

# Quick fix for Node.js compatibility issue
# Execute this on your production server

echo "🔧 Quick Node.js Fix for ReciboLegal"
echo "===================================="

cd /opt/recibolegal

echo "1. 🗑️ Cleaning old dependencies..."
rm -rf node_modules package-lock.json
if [ -d "server" ]; then
    cd server && rm -rf node_modules package-lock.json && cd ..
fi

echo "2. 📦 Installing Node.js 18..."
# Install Node.js 18 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "3. 📥 Installing dependencies with Node.js 18..."
npm install

if [ -d "server" ]; then
    cd server && npm install && cd ..
fi

echo "4. 🏗️ Building frontend..."
npm run build

echo "5. 🐳 Updating Docker containers..."
# Update Dockerfile to Node.js 18
sed -i 's/FROM node:[0-9]*/FROM node:18-alpine/g' Dockerfile

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Quick fix completed!"
echo "🌐 Check: https://recibolegal.com.br"

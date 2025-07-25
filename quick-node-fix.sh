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

# Check if Dockerfile exists and update it
if [ -f "Dockerfile" ]; then
    echo "   📝 Updating Dockerfile to use Node.js 18..."
    sed -i 's/FROM node:[0-9]*/FROM node:18-alpine/g' Dockerfile
    echo "   ✅ Dockerfile updated"
else
    echo "   ⚠️  Dockerfile not found, skipping update"
fi

# Check if docker-compose.prod.yml exists
if [ -f "docker-compose.prod.yml" ]; then
    echo "   🛑 Stopping Docker containers..."
    docker-compose -f docker-compose.prod.yml down
    
    echo "   🏗️  Rebuilding containers..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    echo "   🚀 Starting containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "   ✅ Docker containers updated successfully"
else
    echo "   ⚠️  docker-compose.prod.yml not found"
    echo "   💡 Checking for alternative Docker configurations..."
    
    # Check for other possible docker-compose files
    if [ -f "docker-compose.yml" ]; then
        echo "   📋 Found docker-compose.yml, using it instead..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        echo "   ✅ Used docker-compose.yml successfully"
    else
        echo "   ❌ No Docker Compose configuration found"
        echo "   🤔 You may need to restart your application manually"
    fi
fi

echo "✅ Quick fix completed!"
echo "🌐 Check: https://recibolegal.com.br"

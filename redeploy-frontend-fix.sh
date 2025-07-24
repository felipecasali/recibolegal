#!/bin/bash

# ReciboLegal - Frontend Fix Deployment
# This script applies the frontend serving fix and redeploys

set -e

echo "🔧 ReciboLegal - Frontend Fix Deployment"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Commit and push the fix
echo ""
echo "📦 Committing frontend fix..."
git add server/index.js
git commit -m "Fix: Add static file serving for React frontend

- Add express.static middleware to serve built React files
- Add catch-all route to serve index.html for client-side routing
- Separate API 404 handling from frontend routing
- This fixes the 'Endpoint not found' error when accessing the frontend"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "📋 Deployment Instructions for your DigitalOcean server:"
echo ""
echo "Run these commands on your server (137.184.182.167):"
echo ""
echo "cd /opt/recibolegal"
echo "git pull origin main"
echo "docker-compose -f docker-compose.no-ssl.yml down"
echo "docker-compose -f docker-compose.no-ssl.yml build --no-cache"
echo "docker-compose -f docker-compose.no-ssl.yml up -d"
echo ""
echo "Wait a few seconds, then test:"
echo "curl -s http://localhost:3001/ | head -c 100"
echo ""
echo "If you see HTML content (not JSON error), the fix worked!"
echo "Then test in browser: http://137.184.182.167:3001"

echo ""
echo "✅ Local changes committed and pushed!"
echo "🌐 Ready to deploy on server."

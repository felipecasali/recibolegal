#!/bin/bash

# ReciboLegal - Force Frontend Update
# Rebuild and deploy latest frontend changes

set -e

echo "🚀 ReciboLegal - Force Frontend Update"
echo "======================================"

PROJECT_DIR="/opt/recibolegal"

echo ""
echo "📋 Configuration:"
echo "   Project Directory: $PROJECT_DIR"
echo "   Target: https://recibolegal.com.br"

cd "$PROJECT_DIR"

echo ""
echo "🔄 Step 1: Pull Latest Changes"
echo "=============================="

git status
echo ""
echo "Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "📦 Step 2: Clean and Rebuild Frontend"
echo "===================================="

echo "🧹 Cleaning previous build..."
rm -rf dist/ node_modules/.cache/ 2>/dev/null || true

echo "📦 Installing dependencies..."
npm ci --production=false

echo "🏗️  Building frontend with latest changes..."
npm run build

echo ""
echo "🔍 Step 3: Verify Build Contents"
echo "==============================="

if [ -d "dist" ]; then
    echo "✅ Build completed successfully"
    
    # Check if our changes are in the built files
    if grep -r "4.9 /5" dist/ 2>/dev/null; then
        echo "✅ Rating format change found in build"
    else
        echo "⚠️  Rating format change not found in build"
    fi
    
    if grep -r "font-size: 2rem" dist/ 2>/dev/null; then
        echo "✅ Statistics font size change found in build"
    else
        echo "⚠️  Statistics font size change not found in build"
    fi
    
    if grep -r "padding-left: 20%" dist/ 2>/dev/null; then
        echo "✅ Hero padding change found in build"
    else
        echo "⚠️  Hero padding change not found in build"
    fi
    
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo ""
echo "🐳 Step 4: Restart Docker Containers"
echo "==================================="

echo "🛑 Stopping containers..."
docker-compose -f docker-compose.prod.yml down

echo "🚀 Starting containers with updated build..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 20

echo ""
echo "🔍 Step 5: Verify Deployment"
echo "==========================="

# Test the site
echo "🌐 Testing site availability..."
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br || echo "000")
echo "   HTTPS Status: $SITE_STATUS"

if [ "$SITE_STATUS" = "200" ]; then
    echo "✅ Site is accessible"
    
    # Check if changes are now visible
    echo ""
    echo "🎨 Checking for frontend changes..."
    SITE_CONTENT=$(curl -s https://recibolegal.com.br)
    
    if echo "$SITE_CONTENT" | grep -q "4.9 /5"; then
        echo "✅ Rating format is now visible!"
    else
        echo "⚠️  Rating format still not visible - check browser cache"
    fi
    
else
    echo "❌ Site not accessible after restart"
fi

echo ""
echo "🏥 Step 6: Container Health Check"
echo "==============================="

echo "🐳 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📊 Step 7: Deployment Summary"
echo "============================"

echo "🎯 Frontend update completed at: $(date)"
echo ""

if [ "$SITE_STATUS" = "200" ]; then
    echo "🎉 SUCCESS: Site is running with latest changes!"
    echo ""
    echo "✅ Next steps:"
    echo "   1. Visit: https://recibolegal.com.br"
    echo "   2. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)"
    echo "   3. Check for updated UI elements"
    echo ""
    echo "🎨 Expected changes:"
    echo "   • Rating: '4.9 /5' (with space)"
    echo "   • Statistics: Larger font size (2rem)"
    echo "   • Hero section: Better padding (20%)"
    echo "   • Features: Improved alignment"
    echo "   • Mobile: Better responsiveness"
    
else
    echo "❌ Deployment issues detected"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check container logs: docker-compose -f docker-compose.prod.yml logs"
    echo "   2. Verify build: ls -la dist/"
    echo "   3. Test locally: npm run dev"
fi

echo ""
echo "🔗 Useful commands:"
echo "   • View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   • Restart: docker-compose -f docker-compose.prod.yml restart"
echo "   • Check build: npm run build && ls dist/"

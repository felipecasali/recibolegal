#!/bin/bash

# ReciboLegal - Deploy Frontend Updates
# Execute this script on your production server

set -e

echo "🚀 ReciboLegal - Deploy Frontend Updates"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/recibolegal"
BACKUP_DIR="/opt/recibolegal-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo ""
echo "📋 Deploy Configuration:"
echo "   Project Directory: $PROJECT_DIR"
echo "   Backup Directory: $BACKUP_DIR"
echo "   Timestamp: $TIMESTAMP"

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Error: Project directory not found at $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

echo ""
echo "🔄 Step 1: Backup Current Version"
echo "================================="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup current dist folder if it exists
if [ -d "dist" ]; then
    echo "📦 Creating backup of current frontend..."
    cp -r dist "$BACKUP_DIR/dist_backup_$TIMESTAMP"
    echo "✅ Backup created: $BACKUP_DIR/dist_backup_$TIMESTAMP"
else
    echo "⚠️  No existing dist folder found, skipping backup"
fi

echo ""
echo "⬇️  Step 2: Pull Latest Changes"
echo "==============================="

echo "🔄 Fetching latest changes from GitHub..."
git fetch origin main

# Check if there are updates
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "✅ Already up to date with latest changes"
else
    echo "📥 New changes found, pulling updates..."
    git pull origin main
    echo "✅ Successfully pulled latest changes"
fi

echo ""
echo "🏗️  Step 3: Build Frontend"
echo "=========================="

echo "📦 Installing/updating dependencies..."
npm ci --only=production

echo "🏗️  Building React application for production..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build completed successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    
    # Restore backup if build failed
    if [ -d "$BACKUP_DIR/dist_backup_$TIMESTAMP" ]; then
        echo "🔄 Restoring backup due to build failure..."
        rm -rf dist
        cp -r "$BACKUP_DIR/dist_backup_$TIMESTAMP" dist
        echo "✅ Backup restored successfully"
    fi
    
    exit 1
fi

echo ""
echo "🐳 Step 4: Restart Docker Services"
echo "=================================="

echo "🔄 Restarting Docker containers to serve new frontend..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🏥 Step 5: Health Check"
echo "======================"

echo "🔍 Checking if application is responding..."

# Check main application
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br/api/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Application health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Application health check returned: $HEALTH_CHECK${NC}"
    echo "   This might be normal if the service is still starting up"
fi

# Check if frontend is serving
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br || echo "000")

if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is serving correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check returned: $FRONTEND_CHECK${NC}"
fi

echo ""
echo "📊 Step 6: Deployment Summary"
echo "============================="

echo "🎯 Deployment completed at: $(date)"
echo "📦 Build timestamp: $TIMESTAMP"
echo "🌐 Application URL: https://recibolegal.com.br"
echo "🔍 Health endpoint: https://recibolegal.com.br/api/health"

# Show recent commits
echo ""
echo "📝 Recent Changes:"
git log --oneline -3

echo ""
echo "🧹 Step 7: Cleanup Old Backups"
echo "==============================="

# Keep only the last 5 backups
if [ -d "$BACKUP_DIR" ]; then
    echo "🗑️  Cleaning up old backups (keeping last 5)..."
    cd "$BACKUP_DIR"
    ls -t dist_backup_* 2>/dev/null | tail -n +6 | xargs -r rm -rf
    BACKUP_COUNT=$(ls -1 dist_backup_* 2>/dev/null | wc -l)
    echo "✅ Cleanup completed. $BACKUP_COUNT backups retained"
fi

echo ""
echo -e "${GREEN}🎉 Frontend deployment completed successfully!${NC}"
echo ""
echo "🔗 Next Steps:"
echo "   • Visit https://recibolegal.com.br to test the updates"
echo "   • Check browser console for any JavaScript errors"
echo "   • Test the key user flows (sign up, plans, etc.)"
echo "   • Monitor application logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🚨 If issues occur:"
echo "   • Restore backup: cp -r $BACKUP_DIR/dist_backup_$TIMESTAMP dist"
echo "   • Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "   • Check logs: docker-compose -f docker-compose.prod.yml logs app"

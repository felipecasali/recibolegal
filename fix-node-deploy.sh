#!/bin/bash

# ReciboLegal - Fix Node.js Version and Deploy
# Resolve Node.js compatibility issues and deploy

set -e

echo "🔧 ReciboLegal - Fix Node.js Version and Deploy"
echo "==============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/recibolegal"
BACKUP_DIR="/opt/recibolegal-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo ""
echo "📋 Configuration:"
echo "   Project Directory: $PROJECT_DIR"
echo "   Timestamp: $TIMESTAMP"

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Error: Project directory not found at $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

echo ""
echo "🔍 Step 1: Diagnose Node.js Version"
echo "==================================="

# Check current Node.js version
CURRENT_NODE_VERSION=$(node --version 2>/dev/null || echo "Not found")
echo "Current Node.js version: $CURRENT_NODE_VERSION"

# Check if we have nvm
if command -v nvm >/dev/null 2>&1; then
    echo "✅ NVM is available"
    NVM_AVAILABLE=true
else
    echo "❌ NVM not found"
    NVM_AVAILABLE=false
fi

# Check if we're using Docker for Node.js
if [ -f "Dockerfile" ]; then
    NODE_IN_DOCKER=$(grep -i "FROM node" Dockerfile | head -1 || echo "")
    if [ ! -z "$NODE_IN_DOCKER" ]; then
        echo "🐳 Docker Node.js image: $NODE_IN_DOCKER"
    fi
fi

echo ""
echo "🔄 Step 2: Update Node.js Version"
echo "================================="

# Function to install Node.js 18 via NodeSource
install_node_18() {
    echo "📦 Installing Node.js 18 via NodeSource..."
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    
    # Install Node.js 18
    sudo apt-get install -y nodejs
    
    echo "✅ Node.js 18 installed successfully"
}

# Check if Node.js version is compatible
if [[ "$CURRENT_NODE_VERSION" =~ ^v([0-9]+) ]]; then
    NODE_MAJOR_VERSION=${BASH_REMATCH[1]}
    
    if [ "$NODE_MAJOR_VERSION" -lt 14 ]; then
        echo -e "${YELLOW}⚠️  Node.js version $CURRENT_NODE_VERSION is too old (requires 14+)${NC}"
        
        # Try to use NVM first
        if [ "$NVM_AVAILABLE" = true ]; then
            echo "🔄 Attempting to install Node.js 18 via NVM..."
            
            # Load NVM
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            
            # Install and use Node.js 18
            nvm install 18
            nvm use 18
            nvm alias default 18
            
            echo "✅ Node.js 18 installed via NVM"
        else
            echo "🔄 Installing Node.js 18 via package manager..."
            install_node_18
        fi
    else
        echo -e "${GREEN}✅ Node.js version $CURRENT_NODE_VERSION is compatible${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not determine Node.js version, installing Node.js 18...${NC}"
    install_node_18
fi

# Verify new Node.js version
NEW_NODE_VERSION=$(node --version)
echo "Updated Node.js version: $NEW_NODE_VERSION"

echo ""
echo "🧹 Step 3: Clean Installation"
echo "============================="

echo "🗑️  Removing old node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Also clean server directory if it exists
if [ -d "server" ]; then
    echo "🗑️  Cleaning server dependencies..."
    cd server
    rm -rf node_modules package-lock.json
    cd ..
fi

echo "✅ Cleanup completed"

echo ""
echo "📦 Step 4: Install Dependencies"
echo "==============================="

echo "📥 Installing main project dependencies..."
npm install

# Install server dependencies if server directory exists
if [ -d "server" ]; then
    echo "📥 Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

echo "✅ Dependencies installed successfully"

echo ""
echo "🏗️  Step 5: Build Frontend"
echo "=========================="

echo "🔧 Building React application for production..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build completed successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo ""
echo "🐳 Step 6: Update Docker Configuration"
echo "======================================"

# Update Dockerfile to use Node.js 18 if it exists
if [ -f "Dockerfile" ]; then
    echo "📝 Updating Dockerfile to use Node.js 18..."
    
    # Backup original Dockerfile
    cp Dockerfile "Dockerfile.backup_$TIMESTAMP"
    
    # Update Node.js version in Dockerfile
    sed -i 's/FROM node:[0-9]*/FROM node:18-alpine/g' Dockerfile
    
    echo "✅ Dockerfile updated to use Node.js 18"
fi

# Update server Dockerfile if it exists
if [ -f "server/Dockerfile" ]; then
    echo "📝 Updating server Dockerfile..."
    cp server/Dockerfile "server/Dockerfile.backup_$TIMESTAMP"
    sed -i 's/FROM node:[0-9]*/FROM node:18-alpine/g' server/Dockerfile
    echo "✅ Server Dockerfile updated"
fi

echo ""
echo "🔄 Step 7: Restart Docker Services"
echo "=================================="

echo "🛑 Stopping current containers..."
docker-compose -f docker-compose.prod.yml down

echo "🏗️  Rebuilding containers with new Node.js version..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting updated containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

echo ""
echo "🏥 Step 8: Health Check"
echo "======================"

echo "🔍 Checking if application is responding..."

# Check main application
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br/api/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Application health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Application health check returned: $HEALTH_CHECK${NC}"
    echo "   Checking Docker logs..."
    docker-compose -f docker-compose.prod.yml logs --tail=20 app
fi

# Check if frontend is serving
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br || echo "000")

if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is serving correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check returned: $FRONTEND_CHECK${NC}"
fi

echo ""
echo "📊 Step 9: Verification"
echo "======================"

# Show current versions
echo "📋 System Information:"
echo "   Node.js: $(node --version)"
echo "   NPM: $(npm --version)"
echo "   Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

# Show Docker container status
echo ""
echo "🐳 Docker Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Recent Changes:"
git log --oneline -3

echo ""
echo -e "${GREEN}🎉 Node.js compatibility fix and deployment completed!${NC}"
echo ""
echo "🔗 Next Steps:"
echo "   • Visit https://recibolegal.com.br to test the application"
echo "   • Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   • Check for any remaining errors in the browser console"
echo ""
echo "📞 If issues persist:"
echo "   • Check Node.js version: node --version"
echo "   • Verify Docker containers: docker-compose -f docker-compose.prod.yml ps"
echo "   • Review application logs: docker-compose -f docker-compose.prod.yml logs app"

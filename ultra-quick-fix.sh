#!/bin/bash

# Ultra Quick Node.js Fix - No Docker Dependencies
# For immediate Node.js compatibility fix

echo "⚡ Ultra Quick Node.js Fix"
echo "========================"

cd /opt/recibolegal

echo "📍 Current directory: $(pwd)"
echo "📂 Directory contents:"
ls -la

echo ""
echo "1. 🔍 Checking Node.js version..."
echo "   Current Node.js: $(node --version 2>/dev/null || echo 'Not found')"

echo ""
echo "2. 📦 Installing Node.js 18..."
# Install Node.js 18 via NodeSource (most reliable method)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "   New Node.js: $(node --version)"
echo "   NPM version: $(npm --version)"

echo ""
echo "3. 🗑️ Cleaning dependencies..."
rm -rf node_modules package-lock.json

# Also clean server if it exists
if [ -d "server" ]; then
    echo "   🧹 Cleaning server dependencies..."
    rm -rf server/node_modules server/package-lock.json
fi

echo ""
echo "4. 📥 Installing fresh dependencies..."
npm install

if [ -d "server" ]; then
    echo "   📥 Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

echo ""
echo "5. 🏗️ Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Build successful!"
else
    echo "   ❌ Build failed!"
    exit 1
fi

echo ""
echo "6. 🔍 Checking for application restart options..."

# Check what kind of setup we have
if [ -f "package.json" ]; then
    # Check if there's a start script
    if npm run | grep -q "start"; then
        echo "   💡 You can restart with: npm start"
    fi
fi

# Check for PM2
if command -v pm2 >/dev/null 2>&1; then
    echo "   💡 PM2 detected. You can restart with: pm2 restart all"
fi

# Check for systemd service
if systemctl list-units | grep -q recibolegal; then
    echo "   💡 Systemd service detected. You can restart with: sudo systemctl restart recibolegal"
fi

# Check for Docker
if [ -f "docker-compose.prod.yml" ]; then
    echo "   🐳 Docker Compose found. Restarting containers..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d
    echo "   ✅ Docker containers restarted"
elif [ -f "docker-compose.yml" ]; then
    echo "   🐳 Docker Compose found. Restarting containers..."
    docker-compose down
    docker-compose up -d
    echo "   ✅ Docker containers restarted"
else
    echo "   ℹ️  No Docker configuration found"
fi

echo ""
echo "7. 🏥 Testing the fix..."

# Test if we can at least run node
if node -e "console.log('Node.js is working!')" 2>/dev/null; then
    echo "   ✅ Node.js is working correctly"
else
    echo "   ❌ Node.js still has issues"
fi

# Test if the build exists
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "   ✅ Frontend build exists"
else
    echo "   ❌ Frontend build missing"
fi

echo ""
echo "🎉 Quick fix completed!"
echo ""
echo "📝 Summary:"
echo "   • Node.js updated to: $(node --version)"
echo "   • Dependencies reinstalled"
echo "   • Frontend rebuilt"
echo "   • Ready for testing"
echo ""
echo "🌐 Next steps:"
echo "   1. Test your application"
echo "   2. Check logs for any remaining errors"
echo "   3. If issues persist, run the full fix script"
echo ""
echo "🔗 Test URLs:"
echo "   • Frontend: https://recibolegal.com.br"
echo "   • API Health: https://recibolegal.com.br/api/health"

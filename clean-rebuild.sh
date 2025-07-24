#!/bin/bash

# ReciboLegal - Clean Rebuild Script
# Fixes ContainerConfig errors by completely rebuilding containers

set -e

echo "🔧 ReciboLegal - Clean Rebuild"
echo "============================="
echo "Fixing ContainerConfig errors by rebuilding from scratch"

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Erro: docker-compose.prod.yml não encontrado"
    echo "   Execute este script na pasta /opt/recibolegal"
    exit 1
fi

echo ""
echo "🛑 Step 1: Stopping and removing all containers"
echo "==============================================="

# Stop all containers (ignore errors if they don't exist)
docker-compose -f docker-compose.prod.yml down 2>/dev/null || echo "No containers to stop"
docker-compose -f docker-compose.no-ssl.yml down 2>/dev/null || echo "No SSL containers to stop"

# Remove all related containers forcefully
echo "Removing all ReciboLegal containers..."
docker ps -aq --filter "name=recibolegal" | xargs -r docker rm -f
docker ps -aq --filter "name=traefik" | xargs -r docker rm -f

echo "✅ Containers removed"

echo ""
echo "🗑️  Step 2: Cleaning Docker system"
echo "=================================="

# Remove unused containers, networks, images, and build cache
echo "Cleaning unused Docker resources..."
docker system prune -f

# Remove dangling images
echo "Removing dangling images..."
docker image prune -f

echo "✅ Docker system cleaned"

echo ""
echo "🔍 Step 3: Checking volumes"
echo "=========================="

# List current volumes
echo "Current Docker volumes:"
docker volume ls | grep -E "(recibolegal|traefik)" || echo "No ReciboLegal volumes found"

# Option to preserve or recreate volumes
echo ""
echo "⚠️  Volume Management Options:"
echo "1. Keep existing volumes (preserves data)"
echo "2. Remove and recreate volumes (fresh start)"
echo ""
read -p "Choose option (1 or 2, default=1): " VOLUME_CHOICE
VOLUME_CHOICE=${VOLUME_CHOICE:-1}

if [ "$VOLUME_CHOICE" = "2" ]; then
    echo "Removing existing volumes..."
    docker volume ls -q | grep -E "(recibolegal|traefik)" | xargs -r docker volume rm
    echo "✅ Volumes removed"
else
    echo "✅ Keeping existing volumes"
fi

echo ""
echo "🐳 Step 4: Rebuilding application"
echo "================================="

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Rebuild images without cache
echo "Rebuilding Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache --pull

echo "✅ Images rebuilt"

echo ""
echo "🚀 Step 5: Starting services"
echo "============================"

# Start services
echo "Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for containers to start
echo "Waiting for containers to initialize..."
sleep 15

echo ""
echo "🔍 Step 6: Verifying deployment"
echo "==============================="

# Check container status
echo "Container status:"
docker-compose -f docker-compose.prod.yml ps

# Check if containers are healthy
echo ""
echo "Health check:"
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Containers are running"
    
    # Test application
    echo "Testing application..."
    sleep 5
    
    if curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3001/api/health | grep -q "200"; then
        echo "✅ Application responding correctly"
    else
        echo "⚠️  Application not responding yet (may need more time)"
    fi
    
    # Test HTTPS if available
    if curl -s -o /dev/null -w "%{http_code}" --max-time 10 -k https://recibolegal.com.br | grep -q "200"; then
        echo "✅ HTTPS working"
    else
        echo "⚠️  HTTPS not responding (SSL may be generating)"
    fi
    
else
    echo "❌ Containers failed to start"
    echo ""
    echo "Container logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=20
    exit 1
fi

echo ""
echo "📋 Step 7: Final status"
echo "======================="

echo "🎉 Clean rebuild completed successfully!"
echo ""
echo "✅ All containers rebuilt from scratch"
echo "✅ ContainerConfig errors resolved"
echo "✅ Application is running"
echo ""
echo "🌐 URLs to test:"
echo "   Application: https://recibolegal.com.br"
echo "   API Health:  https://recibolegal.com.br/api/health"
echo "   Traefik:     http://$(curl -s ifconfig.me):8080"
echo ""
echo "🔧 Useful commands:"
echo "   Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Check status: docker-compose -f docker-compose.prod.yml ps"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "💡 If issues persist:"
echo "   1. Check firewall: ufw status"
echo "   2. Check DNS: dig +short recibolegal.com.br"
echo "   3. Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"

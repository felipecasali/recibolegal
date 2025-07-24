#!/bin/bash

# ReciboLegal - Backup Script
# Creates backups of important data and configurations

set -e

BACKUP_DIR="/opt/recibolegal-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="recibolegal_backup_$DATE"

echo "💾 ReciboLegal - Backup System"
echo "=============================="
echo "Date: $(date)"
echo "Backup: $BACKUP_NAME"

# Create backup directory
mkdir -p $BACKUP_DIR/$BACKUP_NAME

echo ""
echo "📦 Creating backup..."

# Backup configuration files
echo "Backing up configuration files..."
cp -r /opt/recibolegal/*.yml $BACKUP_DIR/$BACKUP_NAME/
cp -r /opt/recibolegal/*.env* $BACKUP_DIR/$BACKUP_NAME/ 2>/dev/null || true
cp -r /opt/recibolegal/server/ $BACKUP_DIR/$BACKUP_NAME/ 2>/dev/null || true

# Backup SSL certificates
echo "Backing up SSL certificates..."
if [ -d "/opt/recibolegal/ssl" ]; then
    cp -r /opt/recibolegal/ssl/ $BACKUP_DIR/$BACKUP_NAME/
fi

# Backup Docker volumes (receipts data)
echo "Backing up Docker volumes..."
docker run --rm -v recibolegal_receipts_data:/data -v $BACKUP_DIR/$BACKUP_NAME:/backup alpine tar czf /backup/receipts_data.tar.gz -C /data . 2>/dev/null || echo "⚠️  No receipts data to backup"

# Backup Traefik certificates
docker run --rm -v recibolegal_traefik_letsencrypt:/data -v $BACKUP_DIR/$BACKUP_NAME:/backup alpine tar czf /backup/traefik_certs.tar.gz -C /data . 2>/dev/null || echo "⚠️  No Traefik certs to backup"

# Create backup info file
cat > $BACKUP_DIR/$BACKUP_NAME/backup_info.txt << EOF
ReciboLegal Backup Information
==============================
Date: $(date)
Server: $(hostname -I | awk '{print $1}')
Backup Name: $BACKUP_NAME
Docker Images:
$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep -E "(recibolegal|traefik)")

Container Status at Backup Time:
$(docker-compose -f /opt/recibolegal/docker-compose.prod.yml ps)
EOF

# Compress backup
echo "Compressing backup..."
cd $BACKUP_DIR
tar czf $BACKUP_NAME.tar.gz $BACKUP_NAME/
rm -rf $BACKUP_NAME/

# Keep only last 5 backups
echo "Cleaning old backups (keeping last 5)..."
ls -t recibolegal_backup_*.tar.gz | tail -n +6 | xargs -r rm

echo ""
echo "✅ Backup completed!"
echo "📁 Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "📊 Size: $(du -h $BACKUP_DIR/$BACKUP_NAME.tar.gz | cut -f1)"
echo ""
echo "📋 Available backups:"
ls -lah $BACKUP_DIR/recibolegal_backup_*.tar.gz 2>/dev/null || echo "No backups found"

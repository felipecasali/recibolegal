#!/bin/bash

# ReciboLegal Backup Script
set -e

# Configuration
BACKUP_DIR="/opt/backups/recibolegal"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

echo "🔄 Starting ReciboLegal backup..."

# Backup application data
echo "📦 Backing up application files..."
tar -czf "$BACKUP_DIR/app-$DATE.tar.gz" -C /opt/recibolegal \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=receipts \
    .

# Backup Docker volumes
echo "💾 Backing up Docker volumes..."
docker run --rm \
    -v recibolegal_receipts_data:/data \
    -v $BACKUP_DIR:/backup \
    alpine tar -czf "/backup/receipts-$DATE.tar.gz" -C /data .

# Backup environment configuration
echo "⚙️ Backing up configuration..."
cp /opt/recibolegal/.env.production "$BACKUP_DIR/env-$DATE.backup"

# Database backup (if using external database)
# Uncomment and modify if using PostgreSQL/MySQL
# echo "🗃️ Backing up database..."
# pg_dump $DATABASE_URL > "$BACKUP_DIR/database-$DATE.sql"

# Clean up old backups
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.backup" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete

# Create backup report
echo "📊 Creating backup report..."
cat > "$BACKUP_DIR/backup-report-$DATE.txt" << EOF
ReciboLegal Backup Report
========================
Date: $(date)
Backup Directory: $BACKUP_DIR

Files backed up:
- Application: app-$DATE.tar.gz
- Receipts: receipts-$DATE.tar.gz
- Configuration: env-$DATE.backup

Backup size:
$(du -sh $BACKUP_DIR/app-$DATE.tar.gz)
$(du -sh $BACKUP_DIR/receipts-$DATE.tar.gz)
$(du -sh $BACKUP_DIR/env-$DATE.backup)

Total backup size: $(du -sh $BACKUP_DIR | cut -f1)
EOF

echo "✅ Backup completed successfully!"
echo "📁 Backup location: $BACKUP_DIR"
echo "📊 Report: $BACKUP_DIR/backup-report-$DATE.txt"

# Optional: Upload to cloud storage
# Uncomment and configure for your cloud provider
# aws s3 sync $BACKUP_DIR s3://your-backup-bucket/recibolegal/
# rclone sync $BACKUP_DIR remote:recibolegal-backups/

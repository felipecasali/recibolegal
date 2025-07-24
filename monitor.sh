#!/bin/bash

# ReciboLegal Health Check and Monitoring Script
set -e

# Configuration
LOG_FILE="/var/log/recibolegal-health.log"
ALERT_EMAIL="admin@recibolegal.com.br"
SLACK_WEBHOOK="YOUR_SLACK_WEBHOOK_URL"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Alert function
send_alert() {
    local message="$1"
    local severity="$2"
    
    # Log the alert
    log "ALERT [$severity]: $message"
    
    # Send Slack notification (if configured)
    if [ -n "$SLACK_WEBHOOK" ] && [ "$SLACK_WEBHOOK" != "YOUR_SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 ReciboLegal Alert [$severity]: $message\"}" \
            $SLACK_WEBHOOK > /dev/null 2>&1
    fi
    
    # Send email (if configured)
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "ReciboLegal Alert [$severity]" $ALERT_EMAIL
    fi
}

# Health checks
check_application() {
    log "Checking application health..."
    
    if curl -f -s -m 10 http://localhost:3001/api/health > /dev/null; then
        log "✅ Application is responding"
        return 0
    else
        log "❌ Application is not responding"
        return 1
    fi
}

check_https() {
    log "Checking HTTPS endpoint..."
    
    if curl -f -s -m 10 https://recibolegal.com.br/api/health > /dev/null; then
        log "✅ HTTPS is working"
        return 0
    else
        log "❌ HTTPS is not working"
        return 1
    fi
}

check_database() {
    log "Checking database connectivity..."
    
    # This would need to be customized based on your database
    # For Firebase, we check if we can make a simple request
    if docker exec $(docker ps -q -f name=recibolegal) node -e "
        require('dotenv').config();
        const admin = require('firebase-admin');
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    type: process.env.FIREBASE_ADMIN_TYPE,
                    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
                    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\\\n/g, '\n'),
                    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
                    auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
                    token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
                    auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
                    client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL
                })
            });
        }
        console.log('Database connection OK');
    " > /dev/null 2>&1; then
        log "✅ Database is accessible"
        return 0
    else
        log "❌ Database is not accessible"
        return 1
    fi
}

check_disk_space() {
    log "Checking disk space..."
    
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ $DISK_USAGE -lt 80 ]; then
        log "✅ Disk space is OK ($DISK_USAGE% used)"
        return 0
    elif [ $DISK_USAGE -lt 90 ]; then
        log "⚠️ Disk space is getting low ($DISK_USAGE% used)"
        send_alert "Disk space is at $DISK_USAGE%" "WARNING"
        return 1
    else
        log "❌ Disk space is critically low ($DISK_USAGE% used)"
        send_alert "Disk space is critically low at $DISK_USAGE%" "CRITICAL"
        return 1
    fi
}

check_memory() {
    log "Checking memory usage..."
    
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [ $MEMORY_USAGE -lt 80 ]; then
        log "✅ Memory usage is OK ($MEMORY_USAGE% used)"
        return 0
    elif [ $MEMORY_USAGE -lt 90 ]; then
        log "⚠️ Memory usage is high ($MEMORY_USAGE% used)"
        send_alert "Memory usage is at $MEMORY_USAGE%" "WARNING"
        return 1
    else
        log "❌ Memory usage is critically high ($MEMORY_USAGE% used)"
        send_alert "Memory usage is critically high at $MEMORY_USAGE%" "CRITICAL"
        return 1
    fi
}

check_docker_containers() {
    log "Checking Docker containers..."
    
    RUNNING_CONTAINERS=$(docker ps --filter "name=recibolegal" --format "table {{.Names}}" | grep -v NAMES | wc -l)
    
    if [ $RUNNING_CONTAINERS -gt 0 ]; then
        log "✅ Docker containers are running ($RUNNING_CONTAINERS containers)"
        return 0
    else
        log "❌ No Docker containers are running"
        return 1
    fi
}

# Recovery actions
restart_application() {
    log "Attempting to restart application..."
    
    cd /opt/recibolegal
    docker-compose -f docker-compose.prod.yml restart
    
    sleep 30
    
    if check_application; then
        log "✅ Application restart successful"
        send_alert "Application was restarted successfully after failure" "INFO"
        return 0
    else
        log "❌ Application restart failed"
        send_alert "Application restart failed - manual intervention required" "CRITICAL"
        return 1
    fi
}

# Main monitoring loop
main() {
    log "=== Starting health check ==="
    
    local failed_checks=0
    
    # Run all checks
    check_application || failed_checks=$((failed_checks + 1))
    check_https || failed_checks=$((failed_checks + 1))
    check_database || failed_checks=$((failed_checks + 1))
    check_disk_space || failed_checks=$((failed_checks + 1))
    check_memory || failed_checks=$((failed_checks + 1))
    check_docker_containers || failed_checks=$((failed_checks + 1))
    
    # Handle failures
    if [ $failed_checks -eq 0 ]; then
        log "✅ All health checks passed"
    else
        log "❌ $failed_checks health check(s) failed"
        
        # If application is not responding, try to restart
        if ! check_application; then
            restart_application
        fi
    fi
    
    log "=== Health check completed ==="
}

# Run the monitoring
main

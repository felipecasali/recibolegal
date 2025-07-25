#!/bin/bash

# ReciboLegal - Configuração Completa do Twilio para Produção
# Este script realiza a configuração completa do Twilio WhatsApp para produção

set -e

echo "🚀 ReciboLegal - Configuração Completa do Twilio"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're on the server or local machine
if [ -f "/opt/recibolegal/.env.production" ]; then
    echo -e "${BLUE}   Environment: Production Server${NC}"
    ENV_FILE="/opt/recibolegal/.env.production"
    BASE_URL="https://recibolegal.com.br"
else
    echo -e "${BLUE}   Environment: Local Development${NC}"
    ENV_FILE=".env.production"
    BASE_URL="https://recibolegal.com.br"
fi

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: .env.production file not found at $ENV_FILE${NC}"
    echo "   Please make sure the environment file exists"
    exit 1
fi

# Load configuration from .env.production
echo -e "${BLUE}📋 Loading configuration from $ENV_FILE...${NC}"
source "$ENV_FILE"

# Validate required environment variables
if [ -z "$TWILIO_ACCOUNT_SID" ] || [ -z "$TWILIO_AUTH_TOKEN" ]; then
    echo -e "${RED}❌ Error: Missing Twilio credentials in $ENV_FILE${NC}"
    echo "   Please ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set"
    exit 1
fi

WEBHOOK_URL="$BASE_URL/api/whatsapp/webhook"

echo ""
echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Account SID: ${TWILIO_ACCOUNT_SID:0:10}...${TWILIO_ACCOUNT_SID: -4}"
echo "   Webhook URL: $WEBHOOK_URL"
echo "   Environment: $NODE_ENV"

echo ""
echo -e "${YELLOW}🔍 Step 1: Validating Twilio Credentials${NC}"
echo "============================================="

# Test Twilio credentials
echo "Testing Twilio API connection..."
ACCOUNT_INFO=$(curl -s -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
    "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json")

if echo "$ACCOUNT_INFO" | grep -q "friendly_name"; then
    ACCOUNT_NAME=$(echo "$ACCOUNT_INFO" | grep -o '"friendly_name":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Twilio credentials valid${NC}"
    echo "   Account: $ACCOUNT_NAME"
else
    echo -e "${RED}❌ Invalid Twilio credentials${NC}"
    echo "   Check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN"
    exit 1
fi

echo ""
echo -e "${YELLOW}🌐 Step 2: Testing Application Health${NC}"
echo "====================================="

echo "Testing application health endpoint..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/api/health" || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Application is running and healthy${NC}"
    echo "   Response code: $HEALTH_CHECK"
else
    echo -e "${RED}❌ Application health check failed${NC}"
    echo "   Response code: $HEALTH_CHECK"
    echo "   Make sure your application is running and HTTPS is working"
    exit 1
fi

echo ""
echo -e "${YELLOW}📱 Step 3: Testing Webhook Endpoint${NC}"
echo "===================================="

echo "Testing webhook endpoint accessibility..."
WEBHOOK_TEST=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$WEBHOOK_URL" || echo "000")

if [ "$WEBHOOK_TEST" = "405" ] || [ "$WEBHOOK_TEST" = "200" ]; then
    echo -e "${GREEN}✅ Webhook endpoint accessible${NC}"
    echo "   Response code: $WEBHOOK_TEST (Expected: 200 or 405)"
else
    echo -e "${RED}❌ Webhook endpoint not accessible${NC}"
    echo "   Response code: $WEBHOOK_TEST"
    echo "   Make sure your application is running and routes are configured"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔧 Step 4: WhatsApp Configuration Status${NC}"
echo "========================================"

# Check current WhatsApp number configuration
CURRENT_NUMBER=$(grep "TWILIO_WHATSAPP_NUMBER=" "$ENV_FILE" | cut -d'=' -f2)
echo "Current WhatsApp number: $CURRENT_NUMBER"

if [[ "$CURRENT_NUMBER" == *"YOUR_WHATSAPP_BUSINESS_NUMBER"* ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  WhatsApp Business number not configured yet${NC}"
    echo ""
    echo -e "${BLUE}📋 Manual Configuration Required:${NC}"
    echo "1. Wait for Twilio WhatsApp Business API approval"
    echo "2. Get your approved WhatsApp Business number"
    echo "3. Update .env.production with your number:"
    echo ""
    echo "   TWILIO_WHATSAPP_NUMBER=whatsapp:+55119XXXXXXXX"
    echo "   TWILIO_WHATSAPP_FROM=whatsapp:+55119XXXXXXXX"
    echo ""
    echo "4. Redeploy the application"
else
    echo -e "${GREEN}✅ WhatsApp Business number configured: $CURRENT_NUMBER${NC}"
fi

echo ""
echo -e "${YELLOW}📞 Step 5: Webhook Configuration in Twilio Console${NC}"
echo "================================================="

echo -e "${BLUE}Configure the webhook in Twilio Console:${NC}"
echo ""
echo "1. Go to: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox"
echo "2. In the 'Sandbox Configuration' section:"
echo "   • When a message comes in: $WEBHOOK_URL"
echo "   • HTTP method: POST"
echo ""
echo "3. Save the configuration"

echo ""
echo -e "${YELLOW}🧪 Step 6: Testing WhatsApp Sandbox${NC}"
echo "=================================="

echo -e "${BLUE}WhatsApp Sandbox Testing:${NC}"
echo ""
echo "• Sandbox Number: +1 415 523 8886"
echo "• To get your join code:"
echo "  1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
echo "  2. Copy your unique sandbox code"
echo ""
echo "• To test:"
echo "  1. Send 'join [your-code]' to +1 415 523 8886 on WhatsApp"
echo "  2. Send 'oi' to start the receipt creation flow"
echo "  3. Check your application logs for incoming webhook calls"

echo ""
echo -e "${YELLOW}📋 Step 7: Production Checklist${NC}"
echo "==============================="

echo -e "${BLUE}Before going live with WhatsApp Business API:${NC}"
echo ""
echo "✅ Required Steps:"
echo "   □ Business verification completed with Meta/Facebook"
echo "   □ WhatsApp Business API approved by Twilio"
echo "   □ Assigned WhatsApp Business number"
echo "   □ Updated .env.production with real number"
echo "   □ Webhook URL configured in Twilio Console"
echo "   □ Message templates created (if needed for marketing)"
echo "   □ Tested in sandbox environment"
echo "   □ Tested receipt generation flow"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "   • WhatsApp Business API approval can take 1-5 business days"
echo "   • You'll need to verify your business with Facebook/Meta"
echo "   • Templates are required for marketing messages"
echo "   • Transactional messages (like receipts) don't need templates"
echo "   • Monitor your Twilio logs for any webhook failures"

echo ""
echo -e "${YELLOW}🔗 Useful Links${NC}"
echo "==============="
echo "• Twilio Console: https://console.twilio.com"
echo "• WhatsApp Sandbox: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
echo "• Business Verification: https://business.facebook.com"
echo "• Webhook Logs: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
echo "• Message Logs: https://console.twilio.com/us1/monitor/logs/sms"

echo ""
echo -e "${YELLOW}🎯 Next Steps${NC}"
echo "=============="
echo "1. Configure webhook URL in Twilio Console (Step 5)"
echo "2. Test WhatsApp sandbox integration (Step 6)"
echo "3. Complete business verification with Meta/Facebook"
echo "4. Wait for WhatsApp Business API approval"
echo "5. Update environment variables with approved number"
echo "6. Test production WhatsApp integration"
echo "7. Monitor logs and webhook responses"

echo ""
echo -e "${YELLOW}📞 Need Help?${NC}"
echo "============"
echo "• Twilio Support: https://support.twilio.com"
echo "• ReciboLegal Logs: Check your application logs for webhook events"
echo "• Health Check: $BASE_URL/api/health"
echo "• Webhook Endpoint: $WEBHOOK_URL"

echo ""
echo -e "${GREEN}🎉 Twilio WhatsApp setup completed successfully!${NC}"
echo ""

# If we're on the server, offer to check logs
if [ -f "/opt/recibolegal/.env.production" ]; then
    echo -e "${BLUE}💡 Server Commands:${NC}"
    echo "• Check application logs: docker-compose -f docker-compose.prod.yml logs -f app"
    echo "• Restart application: docker-compose -f docker-compose.prod.yml restart app"
    echo "• Check webhook calls: tail -f /opt/recibolegal/logs/app.log"
fi

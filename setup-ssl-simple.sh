#!/bin/bash

# ReciboLegal - Simple SSL Setup with Traefik
# This script switches to SSL-enabled configuration

set -e

echo "🔒 ReciboLegal - SSL Setup com Traefik"
echo "======================================"

# Configuration
DOMAIN="recibolegal.com.br"
SERVER_IP="137.184.182.167"

echo ""
echo "📋 Configuração:"
echo "   Domain: $DOMAIN"
echo "   Server IP: $SERVER_IP"

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Erro: docker-compose.prod.yml não encontrado"
    echo "   Execute este script na pasta /opt/recibolegal"
    exit 1
fi

echo ""
echo "🔍 Verificações DNS"
echo "==================="

# Check DNS resolution
echo "Verificando DNS para $DOMAIN..."
RESOLVED_IP=$(dig +short $DOMAIN | tail -n1)
if [ -z "$RESOLVED_IP" ]; then
    echo "❌ DNS Error: $DOMAIN não resolve para nenhum IP"
    echo ""
    echo "🔧 Configure seu DNS:"
    echo "   - Adicione um registro A: $DOMAIN -> $SERVER_IP"
    echo "   - Aguarde a propagação DNS (até 24 horas)"
    echo "   - Teste com: dig +short $DOMAIN"
    echo ""
    echo "⚠️  Prosseguindo mesmo assim (DNS pode estar propagando...)"
else
    if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
        echo "⚠️  DNS Warning: $DOMAIN resolve para $RESOLVED_IP, mas servidor é $SERVER_IP"
        echo "   Isso pode ser normal se o DNS ainda está propagando"
    else
        echo "✅ DNS: $DOMAIN aponta corretamente para $SERVER_IP"
    fi
fi

echo ""
echo "🚀 Configurando SSL"
echo "==================="

# Stop current containers
echo "Parando containers atuais..."
if docker-compose -f docker-compose.no-ssl.yml ps -q | grep -q .; then
    docker-compose -f docker-compose.no-ssl.yml down
    echo "✅ Containers sem SSL parados"
else
    echo "ℹ️  Nenhum container sem SSL estava rodando"
fi

# Create acme.json with correct permissions
echo "Preparando certificados SSL..."
mkdir -p ./ssl
touch ./ssl/acme.json
chmod 600 ./ssl/acme.json

# Start with SSL configuration
echo "Iniciando containers com SSL..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Aguardando inicialização..."
echo "============================="

# Wait for services to start
sleep 20

# Check if containers are running
echo "Verificando status dos containers..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Containers estão rodando"
else
    echo "❌ Erro: Containers não estão rodando"
    echo ""
    echo "🔍 Logs dos containers:"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

echo ""
echo "🔍 Testando Configuração"
echo "========================"

# Test HTTP (should be available immediately)
echo "Testando HTTP..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ HTTP funcionando"
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ HTTP redirecionando (normal para SSL)"
else
    echo "⚠️  HTTP retornou código: $HTTP_CODE"
fi

# Test HTTPS (may take a few minutes for certificate generation)
echo "Testando HTTPS (certificado pode levar alguns minutos)..."
sleep 10

HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -k https://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTPS_CODE" = "200" ]; then
    echo "✅ HTTPS funcionando!"
else
    echo "⏳ HTTPS ainda não disponível (código: $HTTPS_CODE)"
    echo "   O certificado SSL pode levar até 5 minutos para ser gerado"
fi

echo ""
echo "📋 Monitoramento"
echo "================"

echo "Para monitorar a geração do certificado SSL:"
echo "   docker-compose -f docker-compose.prod.yml logs -f traefik"
echo ""
echo "Para verificar os certificados:"
echo "   curl -I https://$DOMAIN"
echo ""
echo "Dashboard do Traefik (sem auth):"
echo "   http://$SERVER_IP:8080"

echo ""
echo "🎉 SSL Setup Iniciado!"
echo "======================"
echo ""
echo "✅ Containers rodando com configuração SSL"
echo "⏳ Certificado SSL sendo gerado (pode levar até 5 minutos)"
echo ""
echo "🌐 URLs para testar:"
echo "   📱 HTTP:  http://$DOMAIN (deve redirecionar)"
echo "   🔒 HTTPS: https://$DOMAIN (aguarde alguns minutos)"
echo ""
echo "🔧 Se HTTPS não funcionar em 5 minutos:"
echo "   1. Verifique os logs: docker-compose -f docker-compose.prod.yml logs traefik"
echo "   2. Confirme o DNS: dig +short $DOMAIN"
echo "   3. Teste o firewall: netstat -tlnp | grep :443"
echo ""

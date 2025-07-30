#!/bin/bash

# Script para verificar e monitorar SSL
echo "=== SSL Status Monitor ==="

check_ssl() {
    echo "Verificando SSL para: $1"
    
    # Teste básico de conectividade
    echo -n "Conectividade HTTPS: "
    
    # Usar gtimeout no macOS se disponível, senão usar curl sem timeout
    if command -v gtimeout >/dev/null 2>&1; then
        TIMEOUT_CMD="gtimeout 10"
    elif command -v timeout >/dev/null 2>&1; then
        TIMEOUT_CMD="timeout 10"
    else
        TIMEOUT_CMD=""
    fi
    
    if $TIMEOUT_CMD curl -s -o /dev/null -w "%{http_code}" "https://$1/api/whatsapp/webhook" 2>/dev/null | grep -q "405\|404\|200"; then
        echo "✅ OK"
    else
        echo "❌ FALHOU"
        return 1
    fi
    
    # Verificar certificado
    echo -n "Certificado SSL: "
    if command -v gtimeout >/dev/null 2>&1; then
        cert_info=$(gtimeout 10 openssl s_client -connect "$1:443" -servername "$1" </dev/null 2>/dev/null | openssl x509 -noout -text 2>/dev/null)
    else
        cert_info=$(openssl s_client -connect "$1:443" -servername "$1" </dev/null 2>/dev/null | openssl x509 -noout -text 2>/dev/null)
    fi
    
    if echo "$cert_info" | grep -q "Let's Encrypt"; then
        echo "✅ Let's Encrypt válido"
        echo "Emissor: $(echo "$cert_info" | grep "Issuer:" | head -1)"
        echo "Válido até: $(echo "$cert_info" | grep "Not After:" | head -1)"
    elif echo "$cert_info" | grep -q "TRAEFIK DEFAULT CERT"; then
        echo "❌ Certificado auto-assinado do Traefik"
        return 1
    else
        echo "⚠️  Certificado desconhecido"
        echo "$cert_info" | grep -E "(Issuer|Subject|Not After)" | head -3
    fi
    
    return 0
}

echo "Data/Hora: $(date)"
echo ""

# Verificar o domínio principal
if check_ssl "recibolegal.com.br"; then
    echo ""
    echo "✅ SSL está funcionando corretamente!"
    
    # Testar webhook do Twilio
    echo ""
    echo "Testando webhook com user-agent do Twilio:"
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: TwilioProxy/1.1" -X POST https://recibolegal.com.br/api/whatsapp/webhook 2>/dev/null)
    if [ "$response" = "405" ] || [ "$response" = "400" ]; then
        echo "✅ Webhook respondendo corretamente (HTTP $response)"
    else
        echo "⚠️  Webhook retornou HTTP $response"
    fi
else
    echo ""
    echo "❌ Problemas de SSL detectados!"
    echo ""
    echo "Verificando se estamos no servidor de produção:"
    if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
        echo "Docker disponível. Verificando logs do Traefik:"
        if [ -f "docker-compose.prod.yml" ]; then
            docker-compose -f docker-compose.prod.yml logs --tail=10 traefik 2>/dev/null | grep -E "(acme|certificate|error|ERROR|letsencrypt)" || echo "Nenhum log relevante encontrado"
        else
            echo "Arquivo docker-compose.prod.yml não encontrado"
        fi
    else
        echo "Docker não disponível (provavelmente executando localmente)"
        echo "Execute este script no servidor de produção para ver logs detalhados"
    fi
    
    echo ""
    echo "Para corrigir, execute no servidor:"
    echo "./fix-ssl.sh"
fi

echo ""
echo "=== Fim da Verificação ==="

#!/bin/bash

# Script para diagnosticar e corrigir problemas de SSL do ReciboLegal
echo "🔍 DIAGNÓSTICO SSL - ReciboLegal"
echo "================================"

echo "1. Testando conectividade básica..."
curl -I --connect-timeout 10 https://recibolegal.com.br/ || echo "❌ Falha na conexão HTTPS"

echo -e "\n2. Verificando certificado SSL..."
echo | openssl s_client -connect recibolegal.com.br:443 -servername recibolegal.com.br 2>/dev/null | openssl x509 -noout -dates -subject -issuer

echo -e "\n3. Testando conexão sem validação SSL..."
curl -I -k https://recibolegal.com.br/ | head -5

echo -e "\n4. Verificando DNS..."
nslookup recibolegal.com.br

echo -e "\n5. Testando porta 443..."
nc -zv recibolegal.com.br 443 2>&1 || echo "❌ Porta 443 não acessível"

echo -e "\n6. DIAGNÓSTICO ERR_SOCKET_NOT_CONNECTED..."
echo "� Testando diferentes protocolos e portas..."

echo "   - HTTP (porta 80):"
curl -I --connect-timeout 5 http://recibolegal.com.br/ 2>&1 | head -3

echo "   - HTTPS com IPv4 forçado:"
curl -I --connect-timeout 5 -4 https://recibolegal.com.br/ 2>&1 | head -3

echo "   - HTTPS com timeout maior:"
curl -I --connect-timeout 30 https://recibolegal.com.br/ 2>&1 | head -3

echo "   - Testando com wget:"
wget --spider --timeout=10 https://recibolegal.com.br/ 2>&1 | head -3

echo "   - IP direto (bypass DNS):"
IP_ADDRESS=$(nslookup recibolegal.com.br | grep "Address:" | tail -1 | awk '{print $2}')
echo "   IP encontrado: $IP_ADDRESS"
curl -I --connect-timeout 10 -H "Host: recibolegal.com.br" https://$IP_ADDRESS/ 2>&1 | head -3

echo -e "\n📋 SOLUÇÕES PARA ERR_SOCKET_NOT_CONNECTED:"
echo "🔧 1. Problema de DNS/Proxy:"
echo "   - Tente usar DNS público: 8.8.8.8 ou 1.1.1.1"
echo "   - Desative proxy/VPN temporariamente"
echo ""
echo "🔧 2. Problema de firewall/antivírus:"
echo "   - Desative temporariamente o firewall"
echo "   - Verifique se antivírus está bloqueando"
echo ""
echo "🔧 3. Problema de rede:"
echo "   - Tente em outra rede (4G do celular)"
echo "   - Reinicie o roteador"
echo ""
echo "� 4. Problema do Chrome:"
echo "   - Abra modo incógnito: Ctrl+Shift+N"
echo "   - Limpe cache: Ctrl+Shift+Delete"
echo "   - Desative extensões temporariamente"
echo ""
echo "🔧 5. Teste em outros navegadores:"
echo "   - Firefox, Safari, Edge"

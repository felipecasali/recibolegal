#!/bin/bash

# ReciboLegal - Quick Domain Status Check
# Check current domain and SSL status

echo "🌐 ReciboLegal - Quick Domain Check"
echo "==================================="

echo ""
echo "🔍 Testing domain access:"

# Test different access points
echo "   HTTP: http://recibolegal.com.br"
curl -I http://recibolegal.com.br 2>/dev/null | head -1 || echo "   ❌ HTTP not accessible"

echo ""
echo "   HTTPS: https://recibolegal.com.br"  
curl -I https://recibolegal.com.br 2>/dev/null | head -1 || echo "   ❌ HTTPS not accessible"

echo ""
echo "🎯 If domain isn't working, run: ./fix-domain-ssl.sh"

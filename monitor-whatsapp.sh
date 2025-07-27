#!/bin/bash

# 📱 MONITOR WHATSAPP - ReciboLegal
# Monitor em tempo real das mensagens do WhatsApp

echo "📱 INICIANDO MONITOR WHATSAPP - $(date)"
echo "======================================="
echo ""
echo "📋 Instruções:"
echo "1. Deixe este terminal aberto"
echo "2. Abra WhatsApp no celular"
echo "3. Envie para +55 11 5028-1981:"
echo "   - Primeiro: 'join grown-shine'"
echo "   - Depois: 'oi'"
echo ""
echo "🔍 Monitorando logs em tempo real..."
echo "   Pressione Ctrl+C para parar"
echo ""

# Conectar ao servidor e monitorar logs
ssh root@recibolegal.com.br "cd /opt/recibolegal && docker-compose -f docker-compose.prod.yml logs -f --tail=0 recibolegal | grep -E '(📥|📤|WhatsApp|Message|Error|Webhook)'"

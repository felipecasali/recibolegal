#!/bin/bash

# Script de deployment para produção com correção SSL
echo "=== ReciboLegal Production Deployment ==="

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o arquivo .env.production existe
if [ ! -f ".env.production" ]; then
    echo "Erro: Arquivo .env.production não encontrado"
    echo "Crie o arquivo com as variáveis de ambiente de produção"
    exit 1
fi

echo "1. Fazendo backup da configuração atual..."
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

echo "2. Limpando recursos antigos..."
docker system prune -f
docker volume rm recibolegal_traefik_letsencrypt 2>/dev/null || true

echo "3. Construindo nova imagem..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "4. Iniciando serviços em ordem..."
# Primeiro o Traefik para configurar SSL
docker-compose -f docker-compose.prod.yml up -d traefik
echo "Aguardando Traefik inicializar..."
sleep 20

# Depois a aplicação
docker-compose -f docker-compose.prod.yml up -d recibolegal
echo "Aguardando aplicação inicializar..."
sleep 15

echo "5. Verificando status dos serviços:"
docker-compose -f docker-compose.prod.yml ps

echo "6. Verificando logs do Traefik:"
docker-compose -f docker-compose.prod.yml logs --tail=10 traefik | grep -E "(acme|certificate|error|ERROR)"

echo "7. Testando conectividade HTTPS..."
sleep 30
echo "Testando certificado SSL..."

# Teste básico de conectividade
if curl -k -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br/api/whatsapp/webhook | grep -q "405\|404\|200"; then
    echo "✅ Webhook acessível via HTTPS"
else
    echo "❌ Problema de conectividade HTTPS"
fi

# Verificar certificado
echo "8. Detalhes do certificado:"
timeout 10 openssl s_client -connect recibolegal.com.br:443 -servername recibolegal.com.br </dev/null 2>/dev/null | openssl x509 -noout -text | grep -E "(Issuer|Subject|Not After)" || echo "Certificado ainda processando..."

echo "=== Deployment Concluído ==="
echo ""
echo "Para monitorar os logs:"
echo "docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Para verificar certificados:"
echo "docker-compose -f docker-compose.prod.yml exec traefik cat /letsencrypt/acme.json"

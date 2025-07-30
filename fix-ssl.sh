#!/bin/bash

# Script para corrigir problemas de SSL no ReciboLegal
echo "=== ReciboLegal SSL Fix Script ==="
echo "Iniciando correção dos certificados SSL..."

# 1. Parar todos os containers
echo "1. Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down

# 2. Remover volume do Let's Encrypt para forçar renovação
echo "2. Limpando certificados antigos..."
docker volume rm recibolegal_traefik_letsencrypt 2>/dev/null || true

# 3. Criar novo volume do acme.json com permissões corretas
echo "3. Criando volume para certificados..."
docker volume create traefik_letsencrypt

# 4. Verificar se as portas estão livres
echo "4. Verificando portas..."
if lsof -i :80 -i :443 | grep -v docker; then
    echo "Atenção: Outras aplicações estão usando as portas 80/443"
    echo "Parando serviços que podem conflitar..."
    sudo pkill -f nginx || true
    sudo pkill -f apache || true
fi

# 5. Iniciar apenas o Traefik primeiro para resolver certificados
echo "5. Iniciando Traefik para resolver certificados SSL..."
docker-compose -f docker-compose.prod.yml up -d traefik

# Aguardar Traefik inicializar
echo "6. Aguardando Traefik inicializar..."
sleep 15

# 7. Iniciar a aplicação
echo "7. Iniciando aplicação ReciboLegal..."
docker-compose -f docker-compose.prod.yml up -d recibolegal

# 8. Aguardar aplicação inicializar
echo "8. Aguardando aplicação inicializar..."
sleep 10

# 9. Verificar status dos containers
echo "9. Verificando status dos containers:"
docker-compose -f docker-compose.prod.yml ps

# 10. Verificar logs do Traefik
echo "10. Verificando logs do Traefik (últimas 20 linhas):"
docker-compose -f docker-compose.prod.yml logs --tail=20 traefik

# 11. Testar certificado SSL
echo "11. Testando certificado SSL..."
sleep 30
echo "Aguardando Let's Encrypt processar o certificado..."

echo "12. Verificando certificado final:"
timeout 10 openssl s_client -connect recibolegal.com.br:443 -servername recibolegal.com.br </dev/null 2>/dev/null | openssl x509 -noout -text | grep -E "(Issuer|Subject|Not After)"

echo "=== Correção SSL Concluída ==="
echo "Se ainda houver problemas, execute:"
echo "docker logs \$(docker-compose -f docker-compose.prod.yml ps -q traefik)"
echo "Para ver logs detalhados do Traefik"

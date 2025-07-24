#!/usr/bin/env node

/**
 * Script para configurar produtos e preços no Stripe
 * Execute: node setup-stripe-products.js
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = [
  {
    id: 'basic',
    name: 'ReciboLegal Básico',
    description: '50 recibos por mês para profissionais',
    price: 1990, // R$ 19,90 em centavos
    interval: 'month',
    receiptsLimit: 50
  },
  {
    id: 'pro',
    name: 'ReciboLegal Profissional',
    description: '200 recibos por mês para empresas',
    price: 3990, // R$ 39,90 em centavos
    interval: 'month',
    receiptsLimit: 200
  },
  {
    id: 'unlimited',
    name: 'ReciboLegal Ilimitado',
    description: 'Recibos ilimitados para grandes empresas',
    price: 7990, // R$ 79,90 em centavos
    interval: 'month',
    receiptsLimit: -1
  }
];

async function setupStripeProducts() {
  console.log('🚀 Configurando produtos Stripe para produção...\n');

  for (const productData of PRODUCTS) {
    try {
      console.log(`📦 Criando produto: ${productData.name}`);
      
      // Criar produto
      const product = await stripe.products.create({
        id: `recibolegal_${productData.id}`,
        name: productData.name,
        description: productData.description,
        metadata: {
          receiptsLimit: productData.receiptsLimit.toString(),
          plan: productData.id
        }
      });

      console.log(`✅ Produto criado: ${product.id}`);

      // Criar preço
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.price,
        currency: 'brl',
        recurring: {
          interval: productData.interval
        },
        metadata: {
          plan: productData.id,
          receiptsLimit: productData.receiptsLimit.toString()
        }
      });

      console.log(`💰 Preço criado: ${price.id}`);
      console.log(`💵 Valor: R$ ${(productData.price / 100).toFixed(2)}\n`);

    } catch (error) {
      if (error.code === 'resource_already_exists') {
        console.log(`⚠️ Produto ${productData.name} já existe\n`);
      } else {
        console.error(`❌ Erro ao criar ${productData.name}:`, error.message);
      }
    }
  }

  console.log('🎉 Setup do Stripe concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Copie os Price IDs gerados');
  console.log('2. Configure webhook endpoint');
  console.log('3. Atualize .env.production');
}

// Função para listar produtos existentes
async function listProducts() {
  console.log('📋 Produtos existentes no Stripe:\n');
  
  const products = await stripe.products.list({ limit: 10 });
  const prices = await stripe.prices.list({ limit: 20 });

  for (const product of products.data) {
    console.log(`📦 ${product.name} (${product.id})`);
    
    const productPrices = prices.data.filter(price => price.product === product.id);
    productPrices.forEach(price => {
      console.log(`  💰 ${price.id} - R$ ${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval}`);
    });
    console.log('');
  }
}

// Verificar se é para setup ou listagem
const command = process.argv[2];

if (command === 'list') {
  listProducts().catch(console.error);
} else {
  setupStripeProducts().catch(console.error);
}

module.exports = { setupStripeProducts, listProducts };

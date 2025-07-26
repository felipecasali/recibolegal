// Script para criar usuário de teste no sistema
const userService = require('./server/services/userService');
const analyticsService = require('./server/services/analyticsService');

async function createTestUser() {
    const testPhone = '+5511987654321';
    const testUser = {
        phone: testPhone,
        name: 'Usuário Teste',
        createdAt: new Date(),
        subscription: {
            plan: 'free',
            receiptsThisMonth: 2,
            receiptsLimit: 5
        }
    };
    
    try {
        console.log('🔧 Criando usuário de teste...');
        
        // Criar usuário
        await userService.createUser(testUser);
        console.log('✅ Usuário criado:', testPhone);
        
        // Criar alguns recibos de exemplo
        const testReceipts = [
            {
                clientName: 'Cliente Teste 1',
                clientDocument: '123.456.789-00',
                serviceName: 'Consultoria',
                serviceDescription: 'Consultoria em desenvolvimento',
                amount: 500.00,
                date: new Date('2025-07-20'),
                phone: testPhone
            },
            {
                clientName: 'Cliente Teste 2',
                clientDocument: '987.654.321-00',
                serviceName: 'Design',
                serviceDescription: 'Design de interface',
                amount: 300.00,
                date: new Date('2025-07-22'),
                phone: testPhone
            }
        ];
        
        for (const receipt of testReceipts) {
            await analyticsService.saveReceiptAdvanced(receipt);
            console.log(`✅ Recibo criado: ${receipt.serviceName} - R$ ${receipt.amount}`);
        }
        
        console.log('\n🎉 USUÁRIO DE TESTE CRIADO COM SUCESSO!');
        console.log(`📱 Telefone: ${testPhone}`);
        console.log('📊 2 recibos de exemplo criados');
        console.log('\n🔍 AGORA VOCÊ PODE TESTAR:');
        console.log('1. Acesse http://localhost:3001/dashboard');
        console.log(`2. Digite: ${testPhone}`);
        console.log('3. O sistema deve solicitar código de autenticação');
        console.log('4. Use a API para verificar se o dashboard carrega corretamente');
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário de teste:', error.message);
    }
}

createTestUser();

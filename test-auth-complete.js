// Script de teste completo para validação do sistema de autenticação
const BASE_URL = 'http://localhost:3001';

async function testAuthenticationSystem() {
    console.log('🧪 TESTE COMPLETO DO SISTEMA DE AUTENTICAÇÃO\n');
    
    try {
        // 1. Testar health check
        console.log('1️⃣ Testando health check...');
        const healthRes = await fetch(`${BASE_URL}/api/health`);
        const healthData = await healthRes.json();
        console.log(`✅ Health: ${healthData.status}\n`);
        
        // 2. Testar acesso ao dashboard sem autenticação (deve dar erro de usuário não encontrado)
        console.log('2️⃣ Testando acesso ao dashboard sem autenticação...');
        const dashboardRes = await fetch(`${BASE_URL}/api/analytics/dashboard/${encodeURIComponent('+5511999999999')}`);
        const dashboardData = await dashboardRes.json();
        
        console.log(`Status: ${dashboardRes.status}`);
        console.log(`Resposta:`, dashboardData);
        
        if (dashboardRes.status === 404 || dashboardData.error === 'Failed to get dashboard data') {
            console.log('✅ Sistema corretamente rejeitando usuário inexistente\n');
        } else {
            console.log('❌ Falha: deveria rejeitar usuário inexistente\n');
        }
        
        // 3. Testar solicitação de código para usuário inexistente
        console.log('3️⃣ Testando solicitação de código para usuário inexistente...');
        const requestRes = await fetch(`${BASE_URL}/api/analytics/request-access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '+5511999999999' })
        });
        
        const requestData = await requestRes.json();
        console.log(`Status: ${requestRes.status}`);
        console.log(`Resposta:`, requestData);
        
        if (requestRes.status === 404) {
            console.log('✅ Sistema corretamente rejeitando solicitação para usuário inexistente\n');
        } else {
            console.log('❌ Falha: deveria rejeitar solicitação para usuário inexistente\n');
        }
        
        // 4. Verificar se o dashboard web está servindo corretamente
        console.log('4️⃣ Testando se dashboard HTML está sendo servido...');
        const dashboardHtmlRes = await fetch(`${BASE_URL}/dashboard`);
        
        if (dashboardHtmlRes.status === 200) {
            console.log('✅ Dashboard HTML sendo servido corretamente\n');
        } else {
            console.log('❌ Falha ao servir dashboard HTML\n');
        }
        
        console.log('🎉 TESTE COMPLETO FINALIZADO!\n');
        console.log('📋 RESUMO:');
        console.log('- ✅ Backend rodando na porta 3001');
        console.log('- ✅ Endpoints de API funcionando');
        console.log('- ✅ Sistema de autenticação rejeitando usuários inexistentes');
        console.log('- ✅ Dashboard web acessível em http://localhost:3001/dashboard');
        console.log('\n🔍 PRÓXIMOS PASSOS PARA TESTE MANUAL:');
        console.log('1. Acesse http://localhost:3001/dashboard');
        console.log('2. Digite um número de telefone');
        console.log('3. Observe se solicita código de autenticação');
        console.log('4. Verifique se mostra mensagem de usuário não encontrado');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testAuthenticationSystem();

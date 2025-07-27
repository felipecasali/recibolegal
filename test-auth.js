// Script de teste para sistema de autenticação

const BASE_URL = 'http://localhost:3001';
const TEST_PHONE = '+5511999999999';

async function testAuth() {
    console.log('🧪 Testando sistema de autenticação...\n');
    
    try {
        // 1. Testar acesso ao dashboard sem autenticação
        console.log('1. Testando acesso sem autenticação...');
        const dashboardRes = await fetch(`${BASE_URL}/api/analytics/dashboard/${encodeURIComponent(TEST_PHONE)}`);
        const dashboardResult = await dashboardRes.json();
        
        console.log(`Status: ${dashboardRes.status}`);
        console.log(`Resposta:`, dashboardResult);
        
        if (dashboardRes.status === 401) {
            console.log('✅ Autenticação obrigatória funcionando!\n');
        } else {
            console.log('❌ Falha na autenticação obrigatória\n');
        }
        
        // 2. Testar solicitação de código de acesso
        console.log('2. Testando solicitação de código...');
        const requestRes = await fetch(`${BASE_URL}/api/analytics/request-access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: TEST_PHONE })
        });
        
        const requestResult = await requestRes.json();
        console.log(`Status: ${requestRes.status}`);
        console.log(`Resposta:`, requestResult);
        
        if (requestRes.status === 404) {
            console.log('✅ Usuário não encontrado - correto para número de teste\n');
            return;
        }
        
        if (!requestResult.success) {
            console.log('❌ Falha na solicitação de código\n');
            return;
        }
        
        const testToken = requestResult.debug?.token;
        if (!testToken) {
            console.log('❌ Token não retornado\n');
            return;
        }
        
        console.log(`✅ Código gerado: ${testToken}\n`);
        
        // 3. Testar verificação de token
        console.log('3. Testando verificação de token...');
        const verifyRes = await fetch(`${BASE_URL}/api/analytics/verify-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phone: TEST_PHONE, 
                token: testToken 
            })
        });
        
        const verifyResult = await verifyRes.json();
        console.log(`Status: ${verifyRes.status}`);
        console.log(`Resposta:`, verifyResult);
        
        if (!verifyResult.success) {
            console.log('❌ Falha na verificação do token\n');
            return;
        }
        
        const sessionToken = verifyResult.data.sessionToken;
        console.log(`✅ Sessão criada: ${sessionToken}\n`);
        
        // 4. Testar acesso com token de sessão
        console.log('4. Testando acesso com token de sessão...');
        const authDashboardRes = await fetch(`${BASE_URL}/api/analytics/dashboard/${encodeURIComponent(TEST_PHONE)}`, {
            headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'X-Session-Token': sessionToken
            }
        });
        
        const authDashboardResult = await authDashboardRes.json();
        console.log(`Status: ${authDashboardRes.status}`);
        console.log(`Resposta:`, authDashboardResult);
        
        if (authDashboardRes.status === 200) {
            console.log('✅ Acesso autenticado funcionando!\n');
        } else {
            console.log('❌ Falha no acesso autenticado\n');
        }
        
        console.log('🎉 Teste completo!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testAuth();

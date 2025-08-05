import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserDashboard = ({ userPhone }) => {
  const [userStats, setUserStats] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://recibolegal.com.br');

  useEffect(() => {
    if (userPhone) {
      fetchUserData();
    }
  }, [userPhone]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats
      const statsResponse = await axios.get(`${apiUrl}/api/subscription/status/${encodeURIComponent(userPhone)}`);
      setUserStats(statsResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      const response = await axios.post(`${apiUrl}/api/subscription/create-checkout-session`, {
        planId,
        userPhone,
        userEmail: userStats?.user?.email,
        userName: userStats?.user?.name
      });

      if (response.data.success) {
        window.open(response.data.checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Erro ao criar sessão de pagamento');
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await axios.post(`${apiUrl}/api/subscription/create-portal-session`, {
        userPhone
      });

      if (response.data.success) {
        window.open(response.data.portalUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Erro ao acessar portal de assinatura');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchUserData}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const { user, stats } = userStats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Dashboard ReciboLegal
          </h1>
          <p className="text-gray-600">
            {user?.name ? `Olá, ${user.name}!` : `Usuário: ${userPhone}`}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plano Atual
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {stats?.planName || 'Gratuito'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Status: {user?.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
            </p>
          </div>

          {/* Usage This Month */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Uso Este Mês
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {stats?.currentMonthUsage || 0}
              {stats?.monthlyLimit > 0 && (
                <span className="text-sm text-gray-600">
                  /{stats.monthlyLimit}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {stats?.monthlyLimit === -1 
                ? 'Ilimitado' 
                : `${stats?.remainingReceipts || 0} restantes`}
            </p>
          </div>

          {/* Total Receipts */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total de Recibos
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {stats?.totalReceipts || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Desde o cadastro
            </p>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Gerenciar Assinatura
          </h3>
          
          {stats?.plan === 'FREE' ? (
            <div>
              <p className="text-gray-600 mb-4">
                Faça upgrade para ter mais recibos e recursos avançados.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">Básico</h4>
                  <p className="text-2xl font-bold text-green-600 my-2">R$ 19,90</p>
                  <p className="text-sm text-gray-600 mb-4">50 recibos/mês</p>
                  <button 
                    onClick={() => handleUpgrade('BASIC')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Assinar
                  </button>
                </div>
                
                <div className="border border-green-500 rounded-lg p-4 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs">
                    Popular
                  </div>
                  <h4 className="font-semibold text-gray-900">Profissional</h4>
                  <p className="text-2xl font-bold text-green-600 my-2">R$ 39,90</p>
                  <p className="text-sm text-gray-600 mb-4">200 recibos/mês</p>
                  <button 
                    onClick={() => handleUpgrade('PRO')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Assinar
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">Ilimitado</h4>
                  <p className="text-2xl font-bold text-green-600 my-2">R$ 79,90</p>
                  <p className="text-sm text-gray-600 mb-4">Recibos ilimitados</p>
                  <button 
                    onClick={() => handleUpgrade('UNLIMITED')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Assinar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Você tem uma assinatura ativa. Gerencie seu plano ou forma de pagamento.
              </p>
              <button 
                onClick={handleManageSubscription}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gerenciar Assinatura
              </button>
            </div>
          )}
        </div>

        {/* Usage Progress */}
        {stats?.monthlyLimit > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Progresso do Mês
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min((stats.currentMonthUsage / stats.monthlyLimit) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {stats.currentMonthUsage} de {stats.monthlyLimit} recibos utilizados
            </p>
            
            {stats.remainingReceipts <= 5 && stats.remainingReceipts > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                <p className="text-yellow-800">
                  ⚠️ Restam apenas {stats.remainingReceipts} recibos este mês.
                </p>
              </div>
            )}
            
            {stats.remainingReceipts === 0 && (
              <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400">
                <p className="text-red-800">
                  🚫 Limite mensal atingido. Faça upgrade para continuar gerando recibos.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => window.open(`https://wa.me/${process.env.VITE_WHATSAPP_NUMBER}?text=oi`, '_blank')}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📱 Criar Recibo via WhatsApp
            </button>
            <button 
              onClick={() => window.location.href = '/receipt-form'}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📄 Criar Recibo Web
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

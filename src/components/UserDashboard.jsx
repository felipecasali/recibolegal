import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FiArrowUp, FiUser, FiFileText, FiCreditCard, FiActivity } from 'react-icons/fi';

const UserDashboard = ({ userPhone }) => {
  const [userStats, setUserStats] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600">Carregando seu dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center bg-white p-8 rounded-2xl shadow-lg"
        >
          <FiActivity className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchUserData}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all"
          >
            Tentar Novamente
          </button>
        </motion.div>
      </div>
    );
  }

  const { user, stats } = userStats || {};

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <motion.div 
        className="max-w-6xl mx-auto p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="bg-white backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
          variants={itemVariants}
          style={{
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <FiUser className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Dashboard ReciboLegal
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                {user?.name ? `Bem-vindo, ${user.name}!` : `Usuário: ${userPhone}`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all border border-gray-100"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <FiCreditCard className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plano Atual
            </h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
              {stats?.planName || 'Gratuito'}
            </p>
            <div className="mt-2 inline-flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${user?.subscriptionStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <p className="text-sm text-gray-600">
                {user?.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all border border-gray-100"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <FiActivity className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Uso Este Mês
            </h3>
            <div className="flex items-baseline space-x-1">
              <CountUp
                end={stats?.currentMonthUsage || 0}
                duration={2}
                className="text-3xl font-bold text-blue-600"
              />
              {stats?.monthlyLimit > 0 && (
                <span className="text-lg text-gray-400">
                  /{stats.monthlyLimit}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {stats?.monthlyLimit === -1 
                ? '∞ Ilimitado' 
                : `${stats?.remainingReceipts || 0} restantes`}
            </p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all border border-gray-100"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <FiFileText className="w-8 h-8 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total de Recibos
            </h3>
            <CountUp
              end={stats?.totalReceipts || 0}
              duration={2}
              className="text-3xl font-bold text-purple-600"
            />
            <p className="text-sm text-gray-600 mt-2">
              Desde o cadastro
            </p>
          </motion.div>
        </div>
        
        {/* Usage Chart */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6 mb-12 border border-gray-100"
          variants={itemVariants}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Utilização ao Longo do Tempo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={receipts}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

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
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          variants={itemVariants}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FiFileText className="w-6 h-6 mr-2 text-purple-500" />
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open(`https://wa.me/${process.env.VITE_WHATSAPP_NUMBER}?text=oi`, '_blank')}
              className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 
                       hover:from-green-600 hover:to-green-700 text-white rounded-xl flex items-center justify-center
                       transform transition-all"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              <span className="text-lg">📱 Criar Recibo via WhatsApp</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/receipt-form'}
              className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600
                       hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-center
                       transform transition-all"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              <span className="text-lg">📄 Criar Recibo Web</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UserDashboard;

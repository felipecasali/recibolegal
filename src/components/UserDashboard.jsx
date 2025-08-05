import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FiArrowUp, FiUser, FiFileText, FiCreditCard, FiActivity } from 'react-icons/fi';
import '../styles/animations.css';

const UserDashboard = ({ userPhone }) => {
  const [userStats, setUserStats] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState({});

  // Intersection Observer setup
  const observeSection = (sectionId) => (node) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(prev => ({ ...prev, [sectionId]: entry.isIntersecting }));
      },
      { threshold: 0.1 }
    );
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  };

  const apiUrl = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://recibolegal.com.br');

  useEffect(() => {
    if (userPhone) {
      fetchUserData();
    }
  }, [userPhone]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
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
      const response = await axios.post(`${apiUrl}/api/subscription/upgrade`, {
        userPhone,
        planId
      });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error upgrading plan:', error);
      setError('Erro ao processar upgrade do plano');
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await axios.post(`${apiUrl}/api/subscription/manage`, { userPhone });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error managing subscription:', error);
      setError('Erro ao acessar gerenciamento da assinatura');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg animate-slideLeft">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const stats = userStats || { currentMonthUsage: 0, monthlyLimit: 0, remainingReceipts: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div ref={observeSection('header')} 
           className={`bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100
             ${isVisible.header ? 'animate-slideUp' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">
              {userStats?.name ? `Bem-vindo, ${userStats.name}!` : `Usuário: ${userPhone}`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {[
          {
            icon: <FiCreditCard className="w-8 h-8 text-green-500 mb-4" />,
            label: "Recibos este mês",
            value: stats.currentMonthUsage,
            delta: "+5%",
            deltaType: "increase"
          },
          {
            icon: <FiUser className="w-8 h-8 text-blue-500 mb-4" />,
            label: "Limite Mensal",
            value: stats.monthlyLimit,
            delta: "Ilimitado",
            deltaType: "neutral"
          },
          {
            icon: <FiFileText className="w-8 h-8 text-purple-500 mb-4" />,
            label: "Recibos Restantes",
            value: stats.remainingReceipts,
            delta: stats.remainingReceipts > 10 ? "Saudável" : "Baixo",
            deltaType: stats.remainingReceipts > 10 ? "increase" : "decrease"
          }
        ].map((stat, index) => (
          <div
            key={stat.label}
            ref={observeSection(`stat-${index}`)}
            className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-lg
              ${isVisible[`stat-${index}`] ? 'animate-slideUp' : 'opacity-0'}
              animate-delay-${(index + 1) * 200}`}
          >
            {stat.icon}
            <h3 className="text-lg font-semibold text-gray-600">{stat.label}</h3>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                <CountUp end={stat.value} duration={2} />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                stat.deltaType === 'increase' ? 'text-green-600' :
                stat.deltaType === 'decrease' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {stat.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Chart */}
      <div 
        ref={observeSection('chart')}
        className={`bg-white rounded-2xl shadow-lg p-6 mb-12 border border-gray-100
          ${isVisible.chart ? 'animate-slideUp animate-delay-400' : 'opacity-0'}`}
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
      </div>

      {/* Usage Progress */}
      {stats?.monthlyLimit > 0 && (
        <div 
          ref={observeSection('progress')}
          className={`bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100
            ${isVisible.progress ? 'animate-slideUp animate-delay-600' : 'opacity-0'}`}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Progresso do Mês
          </h3>
          <div className="w-full bg-gray-100 rounded-full h-4 mb-4">
            <div 
              style={{
                width: `${Math.min((stats.currentMonthUsage / stats.monthlyLimit) * 100, 100)}%`,
              }}
              className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-1000"
            />
          </div>
          <p className="text-gray-600">
            {stats.currentMonthUsage} de {stats.monthlyLimit} recibos utilizados
          </p>
          
          {stats.remainingReceipts <= 5 && stats.remainingReceipts > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg animate-slideLeft">
              <p className="text-yellow-800 flex items-center">
                <FiActivity className="w-5 h-5 mr-2" />
                Restam apenas {stats.remainingReceipts} recibos este mês.
              </p>
            </div>
          )}

          {stats.remainingReceipts === 0 && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg animate-slideLeft">
              <p className="text-red-800 flex items-center">
                <FiActivity className="w-5 h-5 mr-2" />
                Limite mensal atingido. Faça upgrade para continuar gerando recibos.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div 
        ref={observeSection('actions')}
        className={`bg-white rounded-2xl shadow-lg p-8 border border-gray-100
          ${isVisible.actions ? 'animate-slideUp animate-delay-800' : 'opacity-0'}`}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <FiFileText className="w-6 h-6 mr-2 text-purple-500" />
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              text: "Novo Recibo",
              icon: <FiFileText className="w-5 h-5 mr-2" />,
              gradient: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
              onClick: () => window.location.href = '/new-receipt'
            },
            {
              text: "Configurar Assinatura",
              icon: <FiCreditCard className="w-5 h-5 mr-2" />,
              gradient: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
              onClick: handleManageSubscription
            }
          ].map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`group relative overflow-hidden px-8 py-4 bg-gradient-to-r ${action.gradient}
                       text-white rounded-xl flex items-center justify-center
                       transform transition-all hover:scale-105`}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              <span className="text-lg flex items-center">
                {action.icon} {action.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

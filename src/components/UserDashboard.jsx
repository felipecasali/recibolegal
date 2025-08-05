import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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

  // Animation with Intersection Observer
  const [isVisible, setIsVisible] = useState({});
  const observerRefs = useRef({});

  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        setIsVisible(prev => ({
          ...prev,
          [entry.target.dataset.section]: entry.isIntersecting
        }));
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1
    });

    return () => observer.disconnect();
  }, []);

  const observeSection = (section) => (element) => {
    if (element && !observerRefs.current[section]) {
      observerRefs.current[section] = element;
      element.dataset.section = section;
      observer.observe(element);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg animate-slideDown">
          <FiActivity className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchUserData}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-300"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const { user, stats } = userStats || {};

  const [hoverRef, hoverInView] = useInView({
    threshold: 0.1
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div 
        ref={observeSection('container')}
        className={`max-w-6xl mx-auto p-6 transition-all duration-700 transform ${
          isVisible.container ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Header */}
        <div 
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          className="bg-white backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 transition-transform duration-300"
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
        </animated.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            {
              icon: <FiCreditCard className="w-8 h-8 text-green-500 mb-4" />,
              title: "Plano Atual",
              animationDelay: "animate-delay-100",
              content: (
                <>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                    {stats?.planName || 'Gratuito'}
                  </p>
                  <div className="mt-2 inline-flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${user?.subscriptionStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <p className="text-sm text-gray-600">
                      {user?.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </>
              )
            },
            {
              icon: <FiActivity className="w-8 h-8 text-blue-500 mb-4" />,
              title: "Uso Este Mês",
              content: (
                <>
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
                </>
              )
            },
            {
              icon: <FiFileText className="w-8 h-8 text-purple-500 mb-4" />,
              title: "Total de Recibos",
              content: (
                <>
                  <CountUp
                    end={stats?.totalReceipts || 0}
                    duration={2}
                    className="text-3xl font-bold text-purple-600"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Desde o cadastro
                  </p>
                </>
              )
            }
          ].map((card, index) => (
            <div
              key={index}
              ref={observeSection(`card-${index}`)}
              className={`bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all border border-gray-100
                ${isVisible[`card-${index}`] ? 'animate-scaleIn' : 'opacity-0'} ${card.animationDelay}`}
            >
              {card.icon}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {card.title}
              </h3>
              {card.content}
            </div>
          ))}
        </div>

        {/* Usage Chart */}
        <div 
          ref={observeSection('chart')}
          className={`bg-white rounded-2xl shadow-lg p-6 mb-12 border border-gray-100
            ${isVisible.chart ? 'animate-slideUp animate-delay-200' : 'opacity-0'}`}
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

        {/* Subscription Management */}
        <div 
          ref={observeSection('subscription')}
          className={`bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100
            ${isVisible.subscription ? 'animate-slideUp animate-delay-400' : 'opacity-0'}`}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Gerenciar Assinatura
          </h3>
          
          {stats?.plan === 'FREE' ? (
            <div>
              <p className="text-gray-600 mb-8">
                Faça upgrade para ter mais recibos e recursos avançados.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Básico',
                    price: '19,90',
                    limit: '50 recibos/mês',
                    planId: 'BASIC',
                    popular: false
                  },
                  {
                    name: 'Profissional',
                    price: '39,90',
                    limit: '200 recibos/mês',
                    planId: 'PRO',
                    popular: true
                  },
                  {
                    name: 'Ilimitado',
                    price: '79,90',
                    limit: 'Recibos ilimitados',
                    planId: 'UNLIMITED',
                    popular: false
                  }
                ].map((plan, index) => {
                  const planSpring = useSpring({
                    scale: hoverInView ? 1 : 0.9,
                    opacity: hoverInView ? 1 : 0,
                    delay: index * 100,
                    config: config.gentle
                  });

                  return (
                    <animated.div
                      key={plan.planId}
                      style={planSpring}
                      className={`relative bg-white rounded-2xl p-6 transform transition-all duration-300
                        ${plan.popular 
                          ? 'border-2 border-green-500 shadow-xl' 
                          : 'border border-gray-200 shadow-lg hover:shadow-xl'}`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full text-sm">
                            Popular
                          </span>
                        </div>
                      )}
                      
                      <h4 className="text-xl font-semibold text-gray-900 mt-4">{plan.name}</h4>
                      <div className="flex items-baseline my-4">
                        <span className="text-3xl font-bold text-green-600">R$</span>
                        <span className="text-4xl font-bold text-gray-900 mx-1">{plan.price}</span>
                        <span className="text-gray-600">/mês</span>
                      </div>
                      <p className="text-gray-600 mb-6">{plan.limit}</p>
                      <button 
                        onClick={() => handleUpgrade(plan.planId)}
                        className={`w-full py-3 rounded-lg text-white font-medium transform transition-all
                          ${plan.popular 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                            : 'bg-gray-800 hover:bg-gray-900'}`}
                      >
                        Assinar
                      </button>
                    </animated.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-6">
                Você tem uma assinatura ativa. Gerencie seu plano ou forma de pagamento.
              </p>
              <button 
                onClick={handleManageSubscription}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                         text-white rounded-lg transform hover:scale-105 transition-all"
              >
                Gerenciar Assinatura
              </button>
            </div>
          )}
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
              <animated.div 
                style={{
                  width: `${Math.min((stats.currentMonthUsage / stats.monthlyLimit) * 100, 100)}%`,
                }}
                className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full"
              />
            </div>
            <p className="text-gray-600">
              {stats.currentMonthUsage} de {stats.monthlyLimit} recibos utilizados
            </p>
            
            {stats.remainingReceipts <= 5 && stats.remainingReceipts > 0 && (
              <animated.div 
                style={useSpring({
                  opacity: 1,
                  transform: 'translateX(0)',
                  from: { opacity: 0, transform: 'translateX(-20px)' },
                  config: config.gentle
                })}
                className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg"
              >
                <p className="text-yellow-800 flex items-center">
                  <FiActivity className="w-5 h-5 mr-2" />
                  Restam apenas {stats.remainingReceipts} recibos este mês.
                </p>
              </animated.div>
            )}
            
            {stats.remainingReceipts === 0 && (
              <div 
                className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg
                  animate-slideRight animate-once"
              >
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
          className={`${isVisible.actions ? 'animate-slideUp animate-delay-800' : 'opacity-0'}`}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FiFileText className="w-6 h-6 mr-2 text-purple-500" />
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: '📱',
                text: 'Criar Recibo via WhatsApp',
                onClick: () => window.open(`https://wa.me/${process.env.VITE_WHATSAPP_NUMBER}?text=oi`, '_blank'),
                gradient: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              },
              {
                icon: '📄',
                text: 'Criar Recibo Web',
                onClick: () => window.location.href = '/receipt-form',
                gradient: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              }
            ].map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`group relative overflow-hidden px-8 py-4 bg-gradient-to-r ${action.gradient}
                         text-white rounded-xl flex items-center justify-center
                         transform transition-all hover:scale-105 animate-pulse`}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                <span className="text-lg">{action.icon} {action.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

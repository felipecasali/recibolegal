import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SubscriptionPlans.css';

const SubscriptionPlans = () => {
  const [loading, setLoading] = useState(false);
  const [userPhone, setUserPhone] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://recibolegal.com.br');

  // Check URL parameters for pre-filled phone
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('phone');
    if (phoneParam) {
      setUserPhone(phoneParam);
    }
  }, []);

  const plans = [
    {
      id: 'FREE',
      name: 'Gratuito',
      price: 'R$ 0',
      receiptsPerMonth: 5,
      features: [
        '5 recibos por mês',
        'Geração via WhatsApp',
        'PDF básico',
        'Suporte por email'
      ],
      buttonText: 'Começar Grátis',
      disabled: false,
      popular: false
    },
    {
      id: 'BASIC',
      name: 'Básico',
      price: 'R$ 19,90',
      receiptsPerMonth: 50,
      features: [
        '50 recibos por mês',
        'Geração via WhatsApp',
        'PDF com assinatura digital',
        'Dashboard web',
        'Histórico completo',
        'Suporte prioritário'
      ],
      buttonText: 'Assinar Agora',
      disabled: false,
      popular: false
    },
    {
      id: 'PRO',
      name: 'Profissional',
      price: 'R$ 39,90',
      receiptsPerMonth: 200,
      features: [
        '200 recibos por mês',
        'Geração via WhatsApp',
        'PDF com assinatura digital',
        'Dashboard web avançado',
        'Histórico completo',
        'Contratos simples',
        'API access',
        'Suporte premium'
      ],
      buttonText: 'Assinar Agora',
      disabled: false,
      popular: true
    },
    {
      id: 'UNLIMITED',
      name: 'Ilimitado',
      price: 'R$ 79,90',
      receiptsPerMonth: 'Ilimitado',
      features: [
        'Recibos ilimitados',
        'Geração via WhatsApp',
        'PDF com assinatura digital',
        'Dashboard web completo',
        'Histórico completo',
        'Contratos avançados',
        'API completa',
        'Integrações customizadas',
        'Webhook customizado',
        'Suporte premium 24/7'
      ],
      buttonText: 'Assinar Agora',
      disabled: false,
      popular: false
    }
  ];

  const handleSubscribe = async (planId) => {
    if (!userPhone.trim()) {
      alert('Por favor, informe seu número de WhatsApp primeiro');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/api/subscription/create-checkout-session`, {
        planId,
        userPhone: userPhone.trim(),
        userName: 'Usuário ReciboLegal'
      });

      if (response.data.success) {
        window.open(response.data.checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Erro ao criar sessão de pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-container">
      <div className="subscription-wrapper">
        <div className="subscription-header">
          <h1 className="subscription-title">
            Escolha seu Plano
          </h1>
          <p className="subscription-subtitle">
            Recibos profissionais e legais direto no WhatsApp
          </p>
          
          <div className="phone-input-container">
            <label htmlFor="phone" className="phone-input-label">
              Seu WhatsApp (com DDD)
            </label>
            <input
              type="tel"
              id="phone"
              className="phone-input"
              placeholder="11999999999"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
            />
            <p className="phone-input-hint">
              Informe seu número para integração com WhatsApp
            </p>
          </div>
        </div>

        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && (
                <div className="popular-badge">
                  Mais Popular
                </div>
              )}
              
              <div className="plan-content">
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">{plan.price}</div>
                  <p className="plan-description">
                    {typeof plan.receiptsPerMonth === 'number' 
                      ? `${plan.receiptsPerMonth} recibos/mês` 
                      : 'Recibos ilimitados'}
                  </p>
                </div>

                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="plan-feature">
                      <span className="plan-feature-icon">✓</span>
                      <span className="plan-feature-text">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`plan-button ${plan.disabled ? 'disabled' : plan.popular ? 'popular' : 'standard'}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.disabled || loading}
                >
                  {loading ? 'Processando...' : plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2 className="faq-title">
            Perguntas Frequentes
          </h2>
          
          <div className="faq-list">
            <div className="faq-item">
              <h3 className="faq-question">
                Como funciona o período de teste?
              </h3>
              <p className="faq-answer">
                Você pode começar com o plano gratuito que inclui 5 recibos por mês. 
                Faça upgrade a qualquer momento quando precisar de mais recibos.
              </p>
            </div>
            
            <div className="faq-item">
              <h3 className="faq-question">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="faq-answer">
                Sim! Você pode cancelar sua assinatura a qualquer momento através do portal de 
                cliente. Você continuará tendo acesso até o final do período pago.
              </p>
            </div>
            
            <div className="faq-item">
              <h3 className="faq-question">
                Os recibos são juridicamente válidos?
              </h3>
              <p className="faq-answer">
                Sim! Todos os recibos gerados incluem assinatura digital e seguem os padrões 
                legais brasileiros para comprovantes de prestação de serviços.
              </p>
            </div>
            
            <div className="faq-item">
              <h3 className="faq-question">
                Como funciona o pagamento?
              </h3>
              <p className="faq-answer">
                Utilizamos o Stripe para processar pagamentos de forma segura. 
                Aceitamos cartões de crédito e débito das principais bandeiras.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="contact-section">
          <p className="contact-text">
            Ainda tem dúvidas? Nossa equipe está aqui para ajudar!
          </p>
          <button
            onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Preciso de ajuda com os planos do ReciboLegal', '_blank')}
            className="contact-button"
          >
            💬 Falar no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;

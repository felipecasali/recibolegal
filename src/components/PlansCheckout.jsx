import React, { useState, useEffect } from 'react'
import './PlansCheckout.css'

function PlansCheckout({ onBack, initialPlan = 'professional' }) {
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  })
  const [showCheckout, setShowCheckout] = useState(false)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const plans = {
    free: {
      name: 'Gratuito',
      price: { monthly: 0, yearly: 0 },
      features: [
        '5 recibos por mês',
        'Assinatura digital básica',
        'Suporte por email',
        'Dashboard básico'
      ],
      popular: false
    },
    professional: {
      name: 'Profissional',
      price: { monthly: 19.90, yearly: 199.00 },
      features: [
        '50 recibos por mês',
        'Assinatura digital avançada',
        'Suporte prioritário',
        'Dashboard completo',
        'Relatórios financeiros',
        'API de integração'
      ],
      popular: true
    },
    unlimited: {
      name: 'Ilimitado',
      price: { monthly: 79.90, yearly: 799.00 },
      features: [
        'Recibos ilimitados',
        'Assinatura digital premium',
        'Suporte 24/7',
        'Dashboard avançado',
        'Relatórios personalizados',
        'API completa',
        'Consultor dedicado',
        'Integração personalizada'
      ],
      popular: false
    }
  }

  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey)
  }

  const handleContinue = () => {
    if (!userInfo.name || !userInfo.email || !userInfo.phone) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }
    
    // Para plano gratuito, vai direto para ativação
    if (selectedPlan === 'free') {
      handleFreePlanActivation()
      return
    }
    
    // Para planos pagos, continua com checkout
    setShowCheckout(true)
  }

  const handleFreePlanActivation = () => {
    const plan = plans[selectedPlan]
    
    // Simulação de ativação do plano gratuito
    alert(`🎉 Parabéns! Sua conta gratuita foi ativada!\n\nPlano: ${plan.name}\nLimite: 5 recibos por mês\n\nEm breve você receberá as instruções de acesso por WhatsApp no número ${userInfo.phone}.\n\nVerifique seu email para confirmação e tutorial de primeiros passos.`)
    
    // Aqui seria integrado com sistema de criação de conta
    onBack()
  }

  const handleSubscribe = () => {
    const plan = plans[selectedPlan]
    const price = plan.price[billingCycle]
    
    // Simulação de processo de pagamento
    alert(`🎉 Parabéns! Você contratou o plano ${plan.name}!\n\nValor: R$ ${price.toFixed(2)}${billingCycle === 'monthly' ? '/mês' : '/ano'}\n\nEm breve você receberá as instruções de acesso por WhatsApp no número ${userInfo.phone}.\n\nVerifique seu email para confirmação.`)
    
    // Aqui seria integrado com sistema de pagamento real (Stripe, PagSeguro, etc.)
    onBack()
  }

  if (showCheckout) {
    const plan = plans[selectedPlan]
    const price = plan.price[billingCycle]
    const savings = billingCycle === 'yearly' ? (plan.price.monthly * 12 - plan.price.yearly).toFixed(2) : 0

    return (
      <div className="plans-checkout">
        <div className="checkout-container">
          <button className="back-btn" onClick={() => setShowCheckout(false)}>
            ← Voltar para planos
          </button>
          
          <div className="checkout-content">
            <div className="checkout-summary">
              <h2>Resumo do Pedido</h2>
              
              <div className="selected-plan-card">
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  {plan.popular && <span className="popular-badge">Mais Popular</span>}
                </div>
                
                <div className="plan-price">
                  <span className="price">R$ {price.toFixed(2)}</span>
                  <span className="cycle">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                </div>
                
                {billingCycle === 'yearly' && savings > 0 && (
                  <div className="savings">
                    💰 Você economiza R$ {savings} por ano!
                  </div>
                )}
                
                <div className="plan-features">
                  <h4>Incluído:</h4>
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="user-info-summary">
                <h4>Dados do Cliente:</h4>
                <p><strong>Nome:</strong> {userInfo.name}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>WhatsApp:</strong> {userInfo.phone}</p>
                {userInfo.company && <p><strong>Empresa:</strong> {userInfo.company}</p>}
              </div>
            </div>

            <div className="checkout-form">
              <h3>Finalizar Contratação</h3>
              
              <div className="payment-methods">
                <h4>Método de Pagamento:</h4>
                <div className="payment-options">
                  <label className="payment-option">
                    <input type="radio" name="payment" defaultChecked />
                    <span>💳 Cartão de Crédito</span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="payment" />
                    <span>🏦 PIX</span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="payment" />
                    <span>📄 Boleto</span>
                  </label>
                </div>
              </div>

              <div className="terms">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  <span>Aceito os <a href="#" target="_blank">termos de uso</a> e <a href="#" target="_blank">política de privacidade</a></span>
                </label>
              </div>

              <button className="subscribe-btn" onClick={handleSubscribe}>
                🚀 Contratar Agora - R$ {price.toFixed(2)}{billingCycle === 'monthly' ? '/mês' : '/ano'}
              </button>

              <div className="security-info">
                <p>🔒 Pagamento 100% seguro</p>
                <p>📞 Suporte: (11) 99999-9999</p>
                <p>✉️ Contato: suporte@recibolegal.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="plans-checkout">
      <div className="checkout-container">
        <button className="back-btn" onClick={onBack}>
          ← Voltar
        </button>
        
        <div className="checkout-header">
          <h1>Escolha seu Plano</h1>
          <p>
            {selectedPlan === 'free' 
              ? 'Complete seus dados para ativar sua conta gratuita' 
              : 'Comece grátis ou escolha o plano ideal para você'
            }
          </p>
          
          {selectedPlan !== 'free' && (
            <div className="billing-toggle">
              <label className={billingCycle === 'monthly' ? 'active' : ''}>
                <input 
                  type="radio" 
                  name="billing" 
                  value="monthly" 
                  checked={billingCycle === 'monthly'}
                  onChange={(e) => setBillingCycle(e.target.value)}
                />
                Mensal
              </label>
              <label className={billingCycle === 'yearly' ? 'active' : ''}>
                <input 
                  type="radio" 
                  name="billing" 
                  value="yearly" 
                  checked={billingCycle === 'yearly'}
                  onChange={(e) => setBillingCycle(e.target.value)}
                />
                Anual <span className="discount">-17%</span>
              </label>
            </div>
          )}
        </div>

        <div className="plans-grid">
          {Object.entries(plans).map(([key, plan]) => (
            <div 
              key={key}
              className={`plan-card ${selectedPlan === key ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
              data-plan={key}
              onClick={() => handlePlanSelect(key)}
            >
              {plan.popular && <div className="popular-label">Mais Popular</div>}
              
              <h3>{plan.name}</h3>
              
              <div className="plan-price">
                <span className="price">
                  {key === 'free' ? 'Grátis' : `R$ ${plan.price[billingCycle].toFixed(2)}`}
                </span>
                {key !== 'free' && <span className="cycle">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>}
              </div>
              
              {billingCycle === 'yearly' && key !== 'free' && (
                <div className="yearly-savings">
                  Economize R$ {(plan.price.monthly * 12 - plan.price.yearly).toFixed(2)} por ano
                </div>
              )}
              
              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              
              <div className="plan-select-indicator">
                {selectedPlan === key ? '● Selecionado' : '○ Selecionar'}
              </div>
            </div>
          ))}
        </div>

        <div className="user-form">
          <h3>Seus Dados</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nome Completo *</label>
              <input 
                type="text" 
                value={userInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite seu nome"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input 
                type="email" 
                value={userInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label>WhatsApp *</label>
              <input 
                type="tel" 
                value={userInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Empresa (opcional)</label>
              <input 
                type="text" 
                value={userInfo.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Nome da sua empresa"
              />
            </div>
          </div>
        </div>

        <div className="checkout-actions">
          <button 
            className="continue-btn" 
            data-free={selectedPlan === 'free'}
            onClick={handleContinue}
          >
            {selectedPlan === 'free' ? 'Ativar Conta Gratuita →' : 'Continuar para Pagamento →'}
          </button>
          
          <div className="trust-indicators">
            <div className="trust-item">🔒 Dados seguros</div>
            {selectedPlan !== 'free' && <div className="trust-item">💳 Pagamento protegido</div>}
            <div className="trust-item">📞 Suporte brasileiro</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlansCheckout

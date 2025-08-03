import { useState } from 'react'
import ReceiptForm from './components/ReceiptForm.jsx'
import FAQSection from './components/FAQSection.jsx'
import WhatsAppIntegration from './components/WhatsAppIntegration.jsx'
import UserDashboard from './components/UserDashboard.jsx'
import SubscriptionPlans from './components/SubscriptionPlans.jsx'
import PlansCheckout from './components/PlansCheckout.jsx'
import './App.css'

function App() {
  const [showReceiptForm, setShowReceiptForm] = useState(false)
  const [showWhatsAppIntegration, setShowWhatsAppIntegration] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showPlans, setShowPlans] = useState(false)
  const [userPhone, setUserPhone] = useState('')
  const [isStarted, setIsStarted] = useState(false)
  const [startedWithFree, setStartedWithFree] = useState(false)

  const handleStartWhatsApp = () => {
    setShowWhatsAppIntegration(true)
  }

  const handleStartFree = () => {
    setStartedWithFree(true)
    setShowPlans(true)
  }

  const handleCreateReceipt = () => {
    setShowReceiptForm(true)
  }

  const handleShowDashboard = () => {
    const phone = prompt('Digite seu número de WhatsApp (ex: +5511999999999):')
    if (phone) {
      setUserPhone(phone)
      setShowDashboard(true)
    }
  }

  const handleShowPlans = () => {
    setStartedWithFree(false)
    setShowPlans(true)
  }

  const handleReceiptSubmit = (formData) => {
    console.log('Receipt data:', formData)
    setShowReceiptForm(false)
  }

  const handleReceiptCancel = () => {
    setShowReceiptForm(false)
  }

  // Show Dashboard
  if (showDashboard) {
    return (
      <div className="app">
        <header className="hero">
          <h1 className="logo">📄 ReciboLegal</h1>
          <button 
            className="back-button"
            onClick={() => setShowDashboard(false)}
          >
            ← Voltar
          </button>
        </header>
        <UserDashboard userPhone={userPhone} />
      </div>
    )
  }

  // Show Plans
  if (showPlans) {
    return (
      <div className="app">
        <PlansCheckout 
          onBack={() => {
            setShowPlans(false)
            setStartedWithFree(false)
          }} 
          initialPlan={startedWithFree ? 'free' : 'professional'}
        />
      </div>
    )
  }

  // Show WhatsApp Integration
  if (showWhatsAppIntegration) {
    return (
      <div className="app">
        <header className="hero">
          <h1 className="logo">📄 ReciboLegal</h1>
          <button 
            className="back-button"
            onClick={() => setShowWhatsAppIntegration(false)}
          >
            ← Voltar
          </button>
        </header>
        <WhatsAppIntegration />
      </div>
    )
  }

  return (
    <div className="app">
      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            ✨ Novo: Integração com WhatsApp Business
          </div>
          <h1 className="hero-title">
            Recibos legais pelo <span className="highlight">WhatsApp</span>
          </h1>
          <p className="hero-subtitle">
            A única plataforma que transforma conversas do WhatsApp em documentos jurídicos válidos. 
            Para freelancers e pequenos negócios que precisam de agilidade sem perder a legalidade.
          </p>
          
          <div className="hero-cta">
            <button className="cta-primary" onClick={handleStartFree}>
              🚀 Começar Grátis Agora
            </button>
            <button className="cta-secondary" onClick={handleCreateReceipt}>
              📺 Ver Demo
            </button>
          </div>
          
          <div className="hero-social-proof">
            <div className="proof-stats">
              <div className="stat">
                <span className="stat-number">10,000+</span>
                <span className="stat-label">recibos gerados</span>
              </div>
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">empresas ativas</span>
              </div>
              <div className="stat">
                <span className="stat-number">4.9 /5</span>
                <span className="stat-label">avaliação média</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="mockup-phone">
            <div className="phone-screen">
              <div className="whatsapp-chat">
                <div className="chat-message received">
                  <span>🤖 Oi! Vou te ajudar a criar um recibo. Qual o valor do serviço?</span>
                </div>
                <div className="chat-message sent">
                  <span>R$ 500,00</span>
                </div>
                <div className="chat-message received">
                  <span>📄 Perfeito! Seu recibo está pronto e foi enviado por email ✅</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Social Proof Logos */}
        <section className="social-proof">
          <p className="social-proof-text">Confiado por profissionais de todo o Brasil</p>
          <div className="company-logos">
            <div className="logo-item">💼 Consultores</div>
            <div className="logo-item">🏗️ Engenheiros</div>
            <div className="logo-item">💅 Designers</div>
            <div className="logo-item">💻 Desenvolvedores</div>
            <div className="logo-item">📸 Fotógrafos</div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section className="problem-solution">
          <div className="problem">
            <h2>❌ Chega de complicação</h2>
            <ul className="problem-list">
              <li>Sistemas complexos e caros</li>
              <li>Documentos sem validade jurídica</li>
              <li>Perda de tempo com burocracia</li>
              <li>Medo de errar nos impostos</li>
            </ul>
          </div>
          <div className="solution">
            <h2>✅ Solução simples e rápida</h2>
            <ul className="solution-list">
              <li>Tudo pelo WhatsApp em 2 minutos</li>
              <li>Documentos com assinatura digital</li>
              <li>Automatização total do processo</li>
              <li>Conforme legislação brasileira</li>
            </ul>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <div className="features-header">
            <h2>Por que escolher o ReciboLegal?</h2>
            <p>Tudo que você precisa para profissionalizar seus recibos</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>100% pelo WhatsApp</h3>
              <p>Não precisa baixar app nem acessar site. Tudo acontece no seu WhatsApp mesmo.</p>
            </div>
            
            <div className="feature-card featured">
              <div className="feature-badge">Mais Popular</div>
              <div className="feature-icon">⚡</div>
              <h3>Recibo em 2 minutos</h3>
              <p>Bot inteligente que faz as perguntas certas e gera seu documento automaticamente.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Assinatura Digital</h3>
              <p>Documentos com certificado digital válido em todo território nacional.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Dashboard Completo</h3>
              <p>Acompanhe todos seus recibos, clientes e faturamento em um painel web.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Controle Financeiro</h3>
              <p>Relatórios automáticos para facilitar sua declaração de imposto de renda.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Suporte Humano</h3>
              <p>Equipe brasileira pronta para te ajudar sempre que precisar.</p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="how-it-works">
          <h2>Como funciona na prática?</h2>
          <div className="steps-timeline">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Mande "Oi" no WhatsApp</h3>
                <p>Clique no botão abaixo e inicie uma conversa conosco</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Responda 4 perguntas simples</h3>
                <p>Valor, descrição do serviço, seus dados e dados do cliente</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Receba o PDF em segundos</h3>
                <p>Documento pronto, assinado digitalmente e enviado por email</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="pricing-preview">
          <div className="pricing-content">
            <h2>Preços transparentes</h2>
            <p>Comece grátis e pague apenas pelo que usar</p>
            
            <div className="pricing-cards">
              <div className="pricing-card">
                <h3>Gratuito</h3>
                <div className="price">R$ 0</div>
                <p>5 recibos por mês</p>
                <button className="price-cta" onClick={handleStartFree}>Começar Grátis</button>
              </div>
              
              <div className="pricing-card popular">
                <div className="popular-badge">Mais Popular</div>
                <h3>Profissional</h3>
                <div className="price">R$ 19,90<span>/mês</span></div>
                <p>50 recibos por mês</p>
                <button className="price-cta" onClick={handleShowPlans}>Escolher Plano</button>
              </div>
              
              <div className="pricing-card">
                <h3>Ilimitado</h3>
                <div className="price">R$ 79,90<span>/mês</span></div>
                <p>Recibos ilimitados</p>
                <button className="price-cta" onClick={handleShowPlans}>Escolher Plano</button>
              </div>
            </div>
          </div>
        </section>


      {/* FAQ SEO Section */}
      <FAQSection />
      </main>

      <footer className="footer">
        <p>&copy; 2025 ReciboLegal - Documentos legais pelo WhatsApp</p>
      </footer>

      {showReceiptForm && (
        <ReceiptForm
          onSubmit={handleReceiptSubmit}
          onCancel={handleReceiptCancel}
        />
      )}
    </div>
  )
}

export default App

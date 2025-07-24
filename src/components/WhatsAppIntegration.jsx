import { useState, useEffect } from 'react'
import apiService from '../services/api'
import TwilioTester from './TwilioTester'
import './WhatsAppIntegration.css'

const WhatsAppIntegration = () => {
  const [isServerRunning, setIsServerRunning] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('setup') // 'setup' or 'test'

  useEffect(() => {
    checkServerStatus()
    const interval = setInterval(checkServerStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkServerStatus = async () => {
    const status = await apiService.checkServerHealth()
    setIsServerRunning(status)
    
    if (status) {
      fetchSessions()
    }
  }

  const fetchSessions = async () => {
    try {
      const sessionsData = await apiService.getWhatsAppSessions()
      setSessions(sessionsData)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const generateWhatsAppLink = () => {
    if (!phoneNumber) {
      alert('Por favor, digite um número de WhatsApp válido')
      return
    }

    // Remove all non-numeric characters and add country code if needed
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    
    const whatsappUrl = apiService.generateWhatsAppQR(
      formattedPhone,
      'Oi! Quero criar um recibo com o ReciboLegal!'
    )
    
    setQrCode(whatsappUrl)
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank')
  }

  const sendTestMessage = async () => {
    if (!phoneNumber) {
      alert('Por favor, digite um número de WhatsApp válido')
      return
    }

    setIsLoading(true)
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      const formattedPhone = cleanPhone.startsWith('55') ? `whatsapp:+${cleanPhone}` : `whatsapp:+55${cleanPhone}`
      
      await apiService.sendWhatsAppMessage(
        formattedPhone,
        'Olá! Este é um teste do ReciboLegal. Digite "OI" para começar a criar seu recibo!'
      )
      
      alert('✅ Mensagem de teste enviada!')
      fetchSessions()
    } catch (error) {
      alert(`❌ Erro ao enviar mensagem: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="whatsapp-integration">
      <div className="integration-header">
        <h2>📱 Integração WhatsApp</h2>
        <div className={`server-status ${isServerRunning ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          {isServerRunning ? 'Servidor Online' : 'Servidor Offline'}
        </div>
      </div>

      {!isServerRunning && (
        <div className="server-warning">
          ⚠️ O servidor backend não está rodando. Execute <code>npm run server</code> para ativar a integração WhatsApp.
        </div>
      )}

      {isServerRunning && (
        <>
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'setup' ? 'active' : ''}`}
              onClick={() => setActiveTab('setup')}
            >
              🔧 Configuração
            </button>
            <button 
              className={`tab-button ${activeTab === 'test' ? 'active' : ''}`}
              onClick={() => setActiveTab('test')}
            >
              🧪 Testar Credenciais
            </button>
          </div>

          {activeTab === 'setup' && (
            <>
              <div className="phone-input-section">
                <h3>Testar Integração</h3>
                <div className="phone-input-group">
                  <input
                    type="tel"
                    placeholder="Digite seu WhatsApp (ex: 11987654321)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="phone-input"
                  />
                  <button
                    onClick={generateWhatsAppLink}
                    className="btn-whatsapp"
                    disabled={!phoneNumber}
                  >
                    💬 Abrir WhatsApp
                  </button>
                  <button
                    onClick={sendTestMessage}
                    className="btn-test"
                    disabled={!phoneNumber || isLoading}
                  >
                    {isLoading ? '⏳ Enviando...' : '🧪 Teste API'}
                  </button>
                </div>
                <p className="phone-help">
                  💡 Digite apenas números (ex: 11987654321). O código do país (+55) será adicionado automaticamente.
                </p>
              </div>

              <div className="sessions-section">
                <h3>Sessões Ativas</h3>
                {sessions.length === 0 ? (
                  <p className="no-sessions">Nenhuma conversa ativa no momento.</p>
                ) : (
                  <div className="sessions-list">
                    {sessions.map((session, index) => (
                      <div key={index} className="session-item">
                        <div className="session-phone">{session.phone}</div>
                        <div className="session-state">{session.state}</div>
                        <div className="session-data">
                          {session.data.clientName && (
                            <span>Cliente: {session.data.clientName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="setup-instructions">
                <h3>📋 Como configurar</h3>
                <ol>
                  <li>Crie uma conta no <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">Twilio</a></li>
                  <li>Configure o WhatsApp Business Sandbox</li>
                  <li>Use a aba "🧪 Testar Credenciais" para validar sua configuração</li>
                  <li>Configure o webhook URL para receber mensagens (opcional para teste)</li>
                  <li>Teste a integração usando os botões acima</li>
                </ol>
              </div>
            </>
          )}

          {activeTab === 'test' && (
            <TwilioTester />
          )}
        </>
      )}
    </div>
  )
}

export default WhatsAppIntegration

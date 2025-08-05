import { useState } from 'react'
import apiService from '../services/api'
import './TwilioTester.css'

const TwilioTester = () => {
  const [credentials, setCredentials] = useState({
    accountSid: '',
    authToken: '',
    whatsappNumber: 'whatsapp:+14155238886'
  })
  const [testPhone, setTestPhone] = useState('')
  const [message, setMessage] = useState('Olá! Este é um teste do ReciboLegal. Digite "oi" para começar!')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState('')

  const testCredentials = async () => {
    if (!credentials.accountSid || !credentials.authToken) {
      alert('Por favor, preencha as credenciais do Twilio')
      return
    }

    setIsLoading(true)
    setResult('')

    try {
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://recibolegal.com.br');
      const response = await fetch(`${apiUrl}/api/whatsapp/test-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountSid: credentials.accountSid,
          authToken: credentials.authToken,
          to: testPhone || 'whatsapp:+5511999999999',
          message: 'Test message'
        })
      })

      const responseText = await response.text()
      console.log('Response text:', responseText)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || `HTTP ${response.status}` }
        }
        setResult(`❌ Erro: ${errorData.error}`)
        return
      }

      try {
        const data = JSON.parse(responseText)
        setResult(`✅ Credenciais válidas! Conta: ${data.accountName || 'Twilio'} (${data.status || 'ativa'})`)
      } catch {
        setResult('✅ Credenciais válidas! Conexão com Twilio estabelecida.')
      }
    } catch (error) {
      console.error('Error testing credentials:', error)
      setResult(`❌ Erro de conexão: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestMessage = async () => {
    if (!testPhone) {
      alert('Por favor, digite um número de WhatsApp para teste')
      return
    }

    setIsLoading(true)
    setResult('')

    try {
      const formattedPhone = testPhone.startsWith('whatsapp:') 
        ? testPhone 
        : `whatsapp:+55${testPhone.replace(/\D/g, '')}`

      await apiService.sendWhatsAppMessage(formattedPhone, message)
      setResult('✅ Mensagem enviada com sucesso!')
    } catch (error) {
      setResult(`❌ Erro ao enviar: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const updateEnvFile = () => {
    const envContent = `# Copie e cole no seu arquivo .env

TWILIO_ACCOUNT_SID=${credentials.accountSid}
TWILIO_AUTH_TOKEN=${credentials.authToken}
TWILIO_WHATSAPP_NUMBER=${credentials.whatsappNumber}`

    navigator.clipboard.writeText(envContent)
    alert('📋 Configurações copiadas! Cole no seu arquivo .env e reinicie o servidor.')
  }

  return (
    <div className="twilio-tester">
      <h2>🧪 Testador de Credenciais Twilio</h2>
      
      <div className="credentials-section">
        <h3>📋 Credenciais do Twilio</h3>
        <div className="form-group">
          <label>Account SID</label>
          <input
            type="text"
            placeholder="AC1234567890abcdef..."
            value={credentials.accountSid}
            onChange={(e) => setCredentials(prev => ({...prev, accountSid: e.target.value}))}
          />
        </div>
        
        <div className="form-group">
          <label>Auth Token</label>
          <input
            type="password"
            placeholder="Seu auth token..."
            value={credentials.authToken}
            onChange={(e) => setCredentials(prev => ({...prev, authToken: e.target.value}))}
          />
        </div>
        
        <div className="form-group">
          <label>WhatsApp Number</label>
          <input
            type="text"
            value={credentials.whatsappNumber}
            onChange={(e) => setCredentials(prev => ({...prev, whatsappNumber: e.target.value}))}
          />
        </div>

        <div className="button-group">
          <button onClick={testCredentials} disabled={isLoading}>
            {isLoading ? '⏳ Testando...' : '🔍 Testar Credenciais'}
          </button>
          <button onClick={updateEnvFile}>
            📋 Copiar para .env
          </button>
        </div>
      </div>

      <div className="test-section">
        <h3>📱 Teste de Envio</h3>
        <div className="form-group">
          <label>Seu WhatsApp (com código do país)</label>
          <input
            type="tel"
            placeholder="11987654321"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Mensagem de Teste</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="3"
          />
        </div>

        <button onClick={sendTestMessage} disabled={isLoading || !testPhone}>
          {isLoading ? '⏳ Enviando...' : '📤 Enviar Teste'}
        </button>
      </div>

      {result && (
        <div className={`result ${result.includes('✅') ? 'success' : 'error'}`}>
          {result}
        </div>
      )}

      <div className="instructions">
        <h3>📖 Como usar:</h3>
        <ol>
          <li>Cole suas credenciais do Twilio nos campos acima</li>
          <li>Clique em "🔍 Testar Credenciais" para verificar se estão corretas</li>
          <li>Digite seu número de WhatsApp no campo de teste</li>
          <li>Clique em "📤 Enviar Teste" para receber uma mensagem</li>
          <li>Se funcionou, clique em "📋 Copiar para .env" e atualize seu arquivo .env</li>
          <li>Reinicie o servidor: <code>npm run server</code></li>
        </ol>
      </div>
    </div>
  )
}

export default TwilioTester

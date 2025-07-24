import { useState } from 'react'
import apiService from '../services/api'
import './ReceiptForm.css'

const ReceiptForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientDocument: '',
    serviceName: '',
    serviceDescription: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Generate receipt via API
      const result = await apiService.generateReceipt(formData)
      
      if (result.success) {
        // Show success message and offer download
        const downloadConfirm = window.confirm(
          `✅ Recibo criado com sucesso!\n\nID: ${result.receiptId}\n\nDeseja baixar o PDF agora?`
        )
        
        if (downloadConfirm) {
          await apiService.downloadReceipt(result.receiptId)
        }
        
        // Call parent callback with success data
        onSubmit({
          ...formData,
          receiptId: result.receiptId,
          downloadUrl: result.downloadUrl
        })
      }
    } catch (error) {
      console.error('Error generating receipt:', error)
      setError(error.message || 'Erro ao gerar recibo. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="receipt-form-overlay">
      <div className="receipt-form">
        <h2>📄 Criar Recibo</h2>
        <p className="form-subtitle">
          Preencha os dados para gerar seu recibo
        </p>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="clientName">Nome do Cliente *</label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              required
              placeholder="Ex: João Silva"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="clientDocument">CPF/CNPJ do Cliente *</label>
            <input
              type="text"
              id="clientDocument"
              name="clientDocument"
              value={formData.clientDocument}
              onChange={handleInputChange}
              required
              placeholder="Ex: 123.456.789-00"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="serviceName">Nome do Serviço *</label>
            <input
              type="text"
              id="serviceName"
              name="serviceName"
              value={formData.serviceName}
              onChange={handleInputChange}
              required
              placeholder="Ex: Consultoria em Marketing Digital"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="serviceDescription">Descrição do Serviço</label>
            <textarea
              id="serviceDescription"
              name="serviceDescription"
              value={formData.serviceDescription}
              onChange={handleInputChange}
              placeholder="Descreva o serviço prestado (opcional)"
              rows="3"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Valor (R$) *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                placeholder="0,00"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Data *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Gerando...' : '🚀 Gerar Recibo'}
            </button>
          </div>
        </form>

        <p className="form-note">
          * Campos obrigatórios
        </p>
      </div>
    </div>
  )
}

export default ReceiptForm

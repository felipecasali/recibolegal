// API service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : 'https://recibolegal.com.br/api');

class ApiService {
  async generateReceipt(receiptData) {
    try {
      const response = await fetch(`${API_BASE_URL}/receipts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate receipt');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw error;
    }
  }

  async downloadReceipt(receiptId) {
    try {
      const response = await fetch(`${API_BASE_URL}/receipts/download/${receiptId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo_${receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw error;
    }
  }

  async listReceipts() {
    try {
      const response = await fetch(`${API_BASE_URL}/receipts/list`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching receipts:', error);
      throw error;
    }
  }

  async sendWhatsAppMessage(to, message) {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, message }),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Unknown error' };
        }
        throw new Error(errorData.error || 'Failed to send WhatsApp message');
      }

      try {
        return JSON.parse(responseText);
      } catch {
        return { success: true, message: 'Message sent successfully' };
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async getWhatsAppSessions() {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/sessions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch WhatsApp sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching WhatsApp sessions:', error);
      throw error;
    }
  }

  async checkServerHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }

  // QR Code generation for WhatsApp
  generateWhatsAppQR(phoneNumber, message = 'Oi! Quero criar um recibo.') {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    return whatsappUrl;
  }
}

export default new ApiService();

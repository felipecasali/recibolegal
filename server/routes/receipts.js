const express = require('express');
const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const userService = require('../services/userService');
const analyticsService = require('../services/analyticsService');
const router = express.Router();

// Receipt template generator
function generateReceiptPDF(data) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234); // Purple color
  doc.text('RECIBO LEGAL', 105, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Recibo de Prestação de Serviços', 105, 40, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);
  
  // Receipt number and date
  const receiptId = generateReceiptId();
  doc.setFontSize(10);
  doc.text(`Recibo Nº: ${receiptId}`, 20, 60);
  doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, 130, 60);
  
  // Client information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 20, 80);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Nome: ${data.clientName}`, 20, 95);
  doc.text(`CPF/CNPJ: ${data.clientDocument}`, 20, 105);
  
  // Service information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO SERVIÇO', 20, 125);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Serviço: ${data.serviceName}`, 20, 140);
  
  if (data.serviceDescription && data.serviceDescription.trim() !== '') {
    const descriptionLines = doc.splitTextToSize(`Descrição: ${data.serviceDescription}`, 170);
    doc.text(descriptionLines, 20, 150);
  }
  
  doc.text(`Data do serviço: ${data.date}`, 20, data.serviceDescription ? 170 : 150);
  
  // Amount
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const amountY = data.serviceDescription ? 190 : 170;
  doc.text(`VALOR: R$ ${parseFloat(data.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, amountY);
  
  // Amount in words
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const amountInWords = numberToWords(parseFloat(data.amount));
  doc.text(`Valor por extenso: ${amountInWords}`, 20, amountY + 15);
  
  // Declaration
  const declarationY = amountY + 35;
  doc.setFontSize(11);
  doc.text('Declaro que recebi a quantia acima referente aos serviços prestados.', 20, declarationY);
  
  // Signature area
  const signatureY = declarationY + 30;
  doc.line(20, signatureY, 100, signatureY);
  doc.text('Assinatura do Prestador', 20, signatureY + 10);
  
  // Digital signature info
  const digitalSigY = signatureY + 25;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento assinado digitalmente pelo ReciboLegal', 20, digitalSigY);
  doc.text(`Hash de verificação: ${generateDocumentHash(data)}`, 20, digitalSigY + 8);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, digitalSigY + 16);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento foi gerado automaticamente pelo ReciboLegal', 105, 280, { align: 'center' });
  doc.text('www.recibolegal.com.br', 105, 285, { align: 'center' });
  
  return doc;
}

// Generate unique receipt ID
function generateReceiptId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REC-${timestamp.slice(-8)}-${random}`;
}

// Generate document hash for verification
function generateDocumentHash(data) {
  const content = `${data.clientName}${data.clientDocument}${data.serviceName}${data.amount}${data.date}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16).toUpperCase();
}

// Convert number to words (simplified version for Brazilian Portuguese)
function numberToWords(num) {
  if (num === 0) return 'zero reais';
  
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  
  const integer = Math.floor(num);
  const cents = Math.round((num - integer) * 100);
  
  let result = '';
  
  // Convert integer part
  if (integer >= 1000) {
    const thousands = Math.floor(integer / 1000);
    if (thousands === 1) {
      result += 'mil';
    } else {
      result += convertHundreds(thousands) + ' mil';
    }
    if (integer % 1000 > 0) {
      result += ' e ' + convertHundreds(integer % 1000);
    }
  } else {
    result = convertHundreds(integer);
  }
  
  result += integer === 1 ? ' real' : ' reais';
  
  // Add cents
  if (cents > 0) {
    result += ' e ' + convertHundreds(cents) + (cents === 1 ? ' centavo' : ' centavos');
  }
  
  return result;
  
  function convertHundreds(n) {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    
    let result = '';
    
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (h > 0) {
      result += hundreds[h];
      if (t > 0 || u > 0) result += ' e ';
    }
    
    if (t >= 2) {
      result += tens[t];
      if (u > 0) result += ' e ' + units[u];
    } else if (t === 1) {
      result += teens[u];
    } else if (u > 0) {
      result += units[u];
    }
    
    return result;
  }
}

// Generate receipt endpoint
router.post('/generate', async (req, res) => {
  try {
    const { clientName, clientDocument, serviceName, serviceDescription, amount, date, userPhone } = req.body;
    
    // Validate required fields
    if (!clientName || !clientDocument || !serviceName || !amount || !date) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['clientName', 'clientDocument', 'serviceName', 'amount', 'date']
      });
    }

    // Check user limits if userPhone is provided
    if (userPhone) {
      const cleanPhone = userService.cleanPhoneNumber(userPhone);
      
      // Get or create user
      let user = await userService.getUserByPhone(cleanPhone);
      if (!user) {
        user = await userService.createUser({
          phone: cleanPhone
        });
      }

      // Check if user can generate receipt
      const canGenerate = await userService.canGenerateReceipt(cleanPhone);
      if (!canGenerate) {
        const stats = await userService.getUserStats(cleanPhone);
        return res.status(403).json({
          error: 'Receipt limit exceeded',
          message: `Você atingiu o limite de ${stats.monthlyLimit} recibos do plano ${stats.planName}. Faça upgrade para continuar.`,
          stats,
          upgradeUrl: `${process.env.PUBLIC_URL || 'https://recibolegal2025.loca.lt'}/plans`
        });
      }
    }
    
    // Generate PDF
    const doc = generateReceiptPDF({
      clientName,
      clientDocument,
      serviceName,
      serviceDescription,
      amount,
      date
    });
    
    // Create receipts directory if it doesn't exist
    const receiptsDir = path.join(__dirname, '../receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    
    // Save PDF
    const receiptId = generateReceiptId();
    const filename = `receipt_${receiptId}.pdf`;
    const filepath = path.join(receiptsDir, filename);
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filepath, pdfBuffer);
    
    console.log(`📄 Receipt generated: ${filename}`);
    
    // Generate download URL for logging
    const baseUrl = process.env.PUBLIC_URL || 'https://recibolegal2025.loca.lt';
    const downloadUrl = `${baseUrl}/api/receipts/download/${receiptId}`;
    
    console.log(`� PDF Download URL: ${downloadUrl}`);
    console.log(`📁 Local file path: ${filepath}`);

        // If WhatsApp integration is enabled, send the PDF link
    if (userPhone && process.env.TWILIO_ACCOUNT_SID) {
      try {
        console.log(`📱 Sending PDF download link to ${userPhone}: ${filename}`);
        
        const linkMessage = `📄 *Seu recibo está pronto!*

🔗 Clique no link abaixo para baixar o PDF:
${downloadUrl}

💡 *Dica:* Salve este link para acessar seu recibo quando precisar.

Válido por: 30 dias`;

        // Use centralized sendWhatsAppMessage function (respects simulation mode)
        const { sendWhatsAppMessage } = require('./whatsapp');
        await sendWhatsAppMessage(userPhone, linkMessage);
        
        console.log(`✅ PDF download link processed for ${userPhone}`);
      } catch (error) {
        console.error('❌ Error sending PDF link via WhatsApp:', error);
      }
    }

    // Record receipt generation with advanced analytics
    if (userPhone) {
      try {
        const cleanPhone = userService.cleanPhoneNumber(userPhone);
        
        // Use new analytics service for enhanced tracking
        await analyticsService.saveReceiptAdvanced(cleanPhone, {
          receiptId,
          clientName,
          clientDocument,
          serviceName,
          serviceDescription,
          amount: parseFloat(amount),
          serviceDate: date,
          filename,
          documentHash: generateDocumentHash({ clientName, clientDocument, serviceName, amount, date })
        });
        
        console.log(`📊 Advanced analytics recorded for user: ${cleanPhone}`);
      } catch (error) {
        console.error('❌ Error recording analytics:', error);
        
        // Fallback to basic recording if analytics fails
        try {
          await userService.recordReceiptGeneration(cleanPhone, {
            receiptId,
            clientName,
            serviceName,
            amount: parseFloat(amount),
            filename
          });
          console.log(`📊 Basic usage recorded for user: ${cleanPhone}`);
        } catch (fallbackError) {
          console.error('❌ Error with fallback recording:', fallbackError);
        }
      }
    }
    
    // Final log highlighting the download link for easy access
    console.log('\n=======================================');
    console.log('📄 RECIBO GERADO COM SUCESSO!');
    console.log(`🔗 Link de Download: ${downloadUrl}`);
    console.log(`📋 ID do Recibo: ${receiptId}`);
    console.log('=======================================\n');
    
    // Return success response
    res.json({
      success: true,
      receiptId,
      filename,
      downloadUrl: `/api/receipts/download/${receiptId}`,
      message: 'Receipt generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ 
      error: 'Failed to generate receipt',
      message: error.message 
    });
  }
});

// Download receipt endpoint
router.get('/download/:receiptId', (req, res) => {
  try {
    const { receiptId } = req.params;
    const filename = `receipt_${receiptId}.pdf`;
    const filepath = path.join(__dirname, '../receipts', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading receipt:', error);
    res.status(500).json({ error: 'Failed to download receipt' });
  }
});

// List receipts endpoint
router.get('/list', (req, res) => {
  try {
    const receiptsDir = path.join(__dirname, '../receipts');
    
    if (!fs.existsSync(receiptsDir)) {
      return res.json({ receipts: [] });
    }
    
    const files = fs.readdirSync(receiptsDir)
      .filter(file => file.endsWith('.pdf'))
      .map(file => {
        const stats = fs.statSync(path.join(receiptsDir, file));
        const receiptId = file.replace('receipt_', '').replace('.pdf', '');
        
        return {
          receiptId,
          filename: file,
          createdAt: stats.birthtime,
          size: stats.size,
          downloadUrl: `/api/receipts/download/${receiptId}`
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ receipts: files });
    
  } catch (error) {
    console.error('Error listing receipts:', error);
    res.status(500).json({ error: 'Failed to list receipts' });
  }
});

module.exports = router;

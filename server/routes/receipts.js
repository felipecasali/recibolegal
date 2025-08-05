const express = require('express');
const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const userService = require('../services/userService');
const analyticsService = require('../services/analyticsService');
const router = express.Router();

// Receipt template generator
function generateReceiptPDF(data, receiptId, documentHash) {
  const doc = new jsPDF();
  // LOGO
  try {
    const logoPath = path.join(__dirname, '../assets/recibolegal-logo.PNG');
    const imgData = fs.readFileSync(logoPath);
    const base64Logo = Buffer.from(imgData).toString('base64');
    doc.addImage('data:image/png;base64,' + base64Logo, 'PNG', 85, 10, 40, 40);
  } catch (e) {
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('RECIBO LEGAL', 105, 30, { align: 'center' });
  }

  // TÍTULO E IDENTIFICAÇÃO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('RECIBO DE PRESTAÇÃO DE SERVIÇOS', 105, 60, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Recibo Nº: ${receiptId}`, 20, 70);
  doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, 150, 70);
  doc.text(`Hash da assinatura: ${documentHash}`, 20, 78);

  // LINHA
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(1);
  doc.line(20, 83, 190, 83);

  // DADOS DO PRESTADOR
  let y = 92;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text('Prestador', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(`Nome: ${data.providerName || 'Não informado'}`, 20, y + 8);
  doc.text(`CPF/CNPJ: ${data.providerDocument || 'Não informado'}`, 20, y + 16);

  // DADOS DO CLIENTE
  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text('Cliente', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(`Nome: ${data.clientName}`, 20, y + 8);
  doc.text(`CPF/CNPJ: ${data.clientDocument}`, 20, y + 16);

  // DADOS DO SERVIÇO
  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text('Serviço', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(`Título: ${data.serviceName}`, 20, y + 8);
  if (data.serviceDescription && data.serviceDescription.trim() !== '') {
    const descriptionLines = doc.splitTextToSize(`Descrição: ${data.serviceDescription}`, 170);
    doc.text(descriptionLines, 20, y + 16);
    y += 10 + descriptionLines.length * 6;
  } else {
    y += 16;
  }
  doc.text(`Data do serviço: ${data.date}`, 20, y + 8);
  y += 18;

  // VALOR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  const valor = `VALOR: R$ ${parseFloat(data.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  doc.text(valor, 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  const amountInWords = numberToWords(parseFloat(data.amount));
  doc.text(`Valor por extenso: ${amountInWords}`, 80, y);
  y += 15;

  // DECLARAÇÃO
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('Declaro que recebi a quantia acima referente aos serviços prestados.', 20, y);
  y += 20;

  // ASSINATURA
  doc.setDrawColor(120, 120, 120);
  doc.line(20, y, 100, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Assinatura do Prestador', 20, y + 7);
  y += 25;

  // DIGITAL SIGNATURE INFO
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento assinado digitalmente pelo ReciboLegal', 20, y);
  doc.text(`Hash de verificação: ${documentHash}`, 20, y + 7);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, y + 14);
  y += 22;

  // FOOTER
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento foi gerado automaticamente pelo ReciboLegal', 105, 285, { align: 'center' });
  doc.text('www.recibolegal.com.br | WhatsApp +551150281981', 105, 290, { align: 'center' });

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
    let cleanPhone = null;
    if (userPhone) {
      cleanPhone = userService.cleanPhoneNumber(userPhone);
      
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
    
    // Get user data for provider information (if user exists)
    let providerName = null;
    let providerDocument = null;
    
    if (userPhone && cleanPhone) {
      const userData = await userService.getUserByPhone(cleanPhone);
      if (userData && userData.fullName && userData.cpfCnpj) {
        providerName = userData.fullName;
        providerDocument = userData.cpfCnpj;
      }
    }
    
    // Generate PDF
    // Gerar receiptId e hash antes do PDF
    const receiptId = generateReceiptId();
    const documentHash = generateDocumentHash({ clientName, clientDocument, serviceName, amount, date });
    const doc = generateReceiptPDF({
      clientName,
      clientDocument,
      serviceName,
      serviceDescription,
      amount,
      date,
      providerName,
      providerDocument
    }, receiptId, documentHash);
    // Create receipts directory if it doesn't exist
    const receiptsDir = path.join(__dirname, '../receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    // Save PDF
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

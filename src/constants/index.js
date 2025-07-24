// Constants for ReciboLegal Application

export const APP_CONFIG = {
  name: 'ReciboLegal',
  tagline: 'Crie recibos e contratos válidos pelo WhatsApp',
  subtitle: 'Para freelancers e pequenos negócios que precisam de documentos legais de forma simples e rápida',
  freePlan: {
    limit: 5,
    description: 'Primeiros 5 recibos gratuitos'
  }
}

export const MESSAGES = {
  alerts: {
    whatsappRedirect: 'Em breve você será redirecionado para o WhatsApp para começar a criar seus recibos!',
    receiptSuccess: 'Recibo criado com sucesso! Em um projeto real, isso seria enviado para o WhatsApp.',
    receiptError: 'Erro ao criar recibo. Tente novamente.'
  },
  forms: {
    required: '* Campos obrigatórios',
    receiptTitle: 'Criar Recibo',
    receiptSubtitle: 'Preencha os dados para gerar seu recibo'
  }
}

export const FEATURES = [
  {
    id: 'legal',
    icon: '✅',
    title: 'Válido juridicamente',
    description: 'Todos os documentos seguem as normas legais brasileiras'
  },
  {
    id: 'whatsapp',
    icon: '📱',
    title: 'Simples pelo WhatsApp',
    description: 'Não precisa baixar app ou criar conta'
  },
  {
    id: 'signature',
    icon: '🔒',
    title: 'Assinatura digital',
    description: 'Documentos com validade legal e rastreabilidade'
  },
  {
    id: 'storage',
    icon: '☁️',
    title: 'Armazenamento seguro',
    description: 'Seus documentos ficam salvos na nuvem'
  }
]

export const STEPS = [
  {
    id: 'message',
    number: 1,
    title: 'Envie uma mensagem',
    description: 'Mande um "Oi" no nosso WhatsApp'
  },
  {
    id: 'questions',
    number: 2,
    title: 'Responda as perguntas',
    description: 'Nosso bot vai te guiar para criar seu documento'
  },
  {
    id: 'receive',
    number: 3,
    title: 'Receba o PDF',
    description: 'Documento assinado digitalmente direto no WhatsApp'
  }
]

export const FORM_FIELDS = {
  clientName: {
    id: 'clientName',
    label: 'Nome do Cliente *',
    placeholder: 'Ex: João Silva',
    required: true
  },
  clientDocument: {
    id: 'clientDocument',
    label: 'CPF/CNPJ do Cliente *',
    placeholder: 'Ex: 123.456.789-00',
    required: true
  },
  serviceName: {
    id: 'serviceName',
    label: 'Nome do Serviço *',
    placeholder: 'Ex: Consultoria em Marketing Digital',
    required: true
  },
  serviceDescription: {
    id: 'serviceDescription',
    label: 'Descrição do Serviço',
    placeholder: 'Descreva o serviço prestado (opcional)',
    required: false
  },
  amount: {
    id: 'amount',
    label: 'Valor (R$) *',
    placeholder: '0,00',
    required: true
  },
  date: {
    id: 'date',
    label: 'Data *',
    required: true
  }
}

export const BUTTON_LABELS = {
  startWhatsApp: '🚀 Começar pelo WhatsApp',
  createReceiptDemo: '📝 Demo: Criar Recibo',
  generateReceipt: '🚀 Gerar Recibo',
  cancel: 'Cancelar'
}

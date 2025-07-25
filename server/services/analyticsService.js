const { db, isFirebaseEnabled } = require('../config/firebase');
const userService = require('./userService');

let collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, increment;

if (isFirebaseEnabled) {
  const firestore = require('firebase/firestore');
  collection = firestore.collection;
  doc = firestore.doc;
  getDoc = firestore.getDoc;
  setDoc = firestore.setDoc;
  updateDoc = firestore.updateDoc;
  addDoc = firestore.addDoc;
  query = firestore.query;
  where = firestore.where;
  orderBy = firestore.orderBy;
  limit = firestore.limit;
  getDocs = firestore.getDocs;
  serverTimestamp = firestore.serverTimestamp;
  increment = firestore.increment;
}

class AnalyticsService {
  constructor() {
    this.receiptsCollection = 'receipts';
    this.analyticsCollection = 'user_analytics';
    this.dailyAnalyticsCollection = 'analytics_daily';
  }

  // Categorizar serviço automaticamente
  categorizeService(serviceName) {
    const categories = {
      'consultoria': ['consultoria', 'consulta', 'advisory', 'estratégia', 'planejamento'],
      'desenvolvimento': ['desenvolvimento', 'programação', 'software', 'app', 'site', 'sistema', 'código'],
      'design': ['design', 'logo', 'identidade', 'visual', 'gráfico', 'layout', 'arte'],
      'marketing': ['marketing', 'publicidade', 'social media', 'ads', 'propaganda', 'divulgação'],
      'educacao': ['curso', 'aula', 'treinamento', 'workshop', 'palestra', 'ensino', 'educação'],
      'juridico': ['jurídico', 'advocacia', 'direito', 'legal', 'processo', 'consultoria jurídica'],
      'contabilidade': ['contabilidade', 'contábil', 'fiscal', 'imposto', 'declaração'],
      'saude': ['saúde', 'médico', 'consulta médica', 'exame', 'tratamento', 'terapia'],
      'beleza': ['beleza', 'estética', 'cabelo', 'maquiagem', 'manicure', 'massagem'],
      'construcao': ['construção', 'reforma', 'engenharia', 'arquitetura', 'obra', 'reparo'],
      'transporte': ['transporte', 'frete', 'mudança', 'entrega', 'logística'],
      'manutencao': ['manutenção', 'reparo', 'conserto', 'instalação', 'assistência técnica'],
      'outros': []
    };

    const serviceLower = serviceName.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => serviceLower.includes(keyword))) {
        return category;
      }
    }

    return 'outros';
  }

  // Gerar número sequencial do recibo
  async generateReceiptNumber(phone) {
    try {
      const year = new Date().getFullYear();
      const user = await userService.getUserByPhone(phone);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Buscar último número usado no ano atual
      const currentCount = user[`receiptsCount_${year}`] || 0;
      const newNumber = String(currentCount + 1).padStart(3, '0');
      
      // Atualizar contador no usuário
      if (isFirebaseEnabled) {
        const userRef = doc(db, 'users', phone);
        await updateDoc(userRef, {
          [`receiptsCount_${year}`]: increment(1)
        });
      }

      return `${newNumber}/${year}`;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback: usar timestamp
      return `${Date.now().toString().slice(-6)}/${new Date().getFullYear()}`;
    }
  }

  // Salvar recibo com dados expandidos
  async saveReceiptAdvanced(phone, receiptData) {
    try {
      const receiptNumber = await this.generateReceiptNumber(phone);
      const serviceCategory = this.categorizeService(receiptData.serviceName);
      
      const enhancedData = {
        ...receiptData,
        receiptNumber,
        serviceCategory,
        generatedVia: 'whatsapp',
        status: 'active',
        paymentStatus: 'pending',
        currency: 'BRL',
        createdAt: isFirebaseEnabled ? serverTimestamp() : new Date(),
        updatedAt: isFirebaseEnabled ? serverTimestamp() : new Date()
      };

      // Salvar no Firebase/Memory
      let receiptId;
      if (isFirebaseEnabled) {
        const receiptRef = await addDoc(collection(db, this.receiptsCollection), {
          userPhone: phone,
          ...enhancedData
        });
        receiptId = receiptRef.id;
      } else {
        receiptId = `REC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        // Salvar em memória (usando userService existente)
        await userService.recordReceiptGeneration(phone, enhancedData);
      }

      // Atualizar analytics
      await this.updateAnalytics(phone, enhancedData, receiptId);

      return receiptId;
    } catch (error) {
      console.error('Error saving advanced receipt:', error);
      throw error;
    }
  }

  // Atualizar analytics diários e do usuário
  async updateAnalytics(phone, receiptData, receiptId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Atualizar analytics diários
      await this.updateDailyAnalytics(phone, today, receiptData);

      // Atualizar analytics do usuário
      await this.updateUserAnalytics(phone, receiptData);

    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  // Analytics diários
  async updateDailyAnalytics(phone, date, receiptData) {
    if (!isFirebaseEnabled) return; // Skip para ambiente local

    try {
      const dailyDocId = `${phone}_${date}`;
      const dailyRef = doc(db, this.dailyAnalyticsCollection, dailyDocId);
      
      const dailyDoc = await getDoc(dailyRef);
      
      if (dailyDoc.exists()) {
        // Atualizar documento existente
        const currentData = dailyDoc.data();
        const newServiceCategories = { ...currentData.serviceCategories };
        newServiceCategories[receiptData.serviceCategory] = (newServiceCategories[receiptData.serviceCategory] || 0) + 1;

        await updateDoc(dailyRef, {
          receiptsGenerated: increment(1),
          totalAmount: increment(receiptData.amount),
          serviceCategories: newServiceCategories,
          updatedAt: serverTimestamp()
        });
      } else {
        // Criar novo documento
        await setDoc(dailyRef, {
          date,
          userPhone: phone,
          receiptsGenerated: 1,
          totalAmount: receiptData.amount,
          avgReceiptValue: receiptData.amount,
          serviceCategories: {
            [receiptData.serviceCategory]: 1
          },
          generationChannels: {
            [receiptData.generatedVia]: 1
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating daily analytics:', error);
    }
  }

  // Analytics do usuário
  async updateUserAnalytics(phone, receiptData) {
    if (!isFirebaseEnabled) return; // Skip para ambiente local

    try {
      const userAnalyticsRef = doc(db, this.analyticsCollection, phone);
      const userAnalyticsDoc = await getDoc(userAnalyticsRef);

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

      if (userAnalyticsDoc.exists()) {
        // Atualizar analytics existentes
        const currentData = userAnalyticsDoc.data();
        
        // Atualizar totais
        const newTotalReceipts = (currentData.totalReceipts || 0) + 1;
        const newTotalAmount = (currentData.totalAmount || 0) + receiptData.amount;
        const newAvgReceiptValue = newTotalAmount / newTotalReceipts;

        // Atualizar mês atual
        const thisMonth = currentData.thisMonth || { receipts: 0, amount: 0 };
        const newThisMonth = {
          receipts: thisMonth.receipts + 1,
          amount: thisMonth.amount + receiptData.amount
        };

        // Atualizar top serviços
        const topServices = currentData.topServices || [];
        const serviceIndex = topServices.findIndex(s => s.name === receiptData.serviceName);
        
        if (serviceIndex >= 0) {
          topServices[serviceIndex].count += 1;
          topServices[serviceIndex].amount += receiptData.amount;
        } else {
          topServices.push({
            name: receiptData.serviceName,
            count: 1,
            amount: receiptData.amount
          });
        }
        
        // Ordenar por count decrescente e manter top 10
        topServices.sort((a, b) => b.count - a.count);
        const limitedTopServices = topServices.slice(0, 10);

        await updateDoc(userAnalyticsRef, {
          totalReceipts: newTotalReceipts,
          totalAmount: newTotalAmount,
          avgReceiptValue: newAvgReceiptValue,
          thisMonth: newThisMonth,
          topServices: limitedTopServices,
          lastUpdated: serverTimestamp()
        });
      } else {
        // Criar novo documento de analytics
        await setDoc(userAnalyticsRef, {
          userPhone: phone,
          totalReceipts: 1,
          totalAmount: receiptData.amount,
          avgReceiptValue: receiptData.amount,
          thisMonth: {
            receipts: 1,
            amount: receiptData.amount
          },
          lastMonth: {
            receipts: 0,
            amount: 0
          },
          topClients: [
            {
              name: receiptData.clientName,
              receipts: 1,
              amount: receiptData.amount
            }
          ],
          topServices: [
            {
              name: receiptData.serviceName,
              count: 1,
              amount: receiptData.amount
            }
          ],
          monthlyTrend: [
            {
              month: currentMonth,
              receipts: 1,
              amount: receiptData.amount
            }
          ],
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating user analytics:', error);
    }
  }

  // Dashboard do usuário
  async getUserDashboard(phone) {
    try {
      const user = await userService.getUserByPhone(phone);
      if (!user) throw new Error('User not found');

      // Buscar analytics do usuário
      let analytics = null;
      if (isFirebaseEnabled) {
        const analyticsDoc = await getDoc(doc(db, this.analyticsCollection, phone));
        analytics = analyticsDoc.exists() ? analyticsDoc.data() : null;
      }

      // Buscar recibos recentes
      const recentReceipts = await userService.getUserReceipts(phone, 5);

      // Se não tem analytics ainda, calcular básico
      if (!analytics) {
        const totalReceipts = recentReceipts.length;
        const totalAmount = recentReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
        
        analytics = {
          totalReceipts,
          totalAmount,
          avgReceiptValue: totalReceipts > 0 ? totalAmount / totalReceipts : 0,
          thisMonth: { receipts: 0, amount: 0 },
          topServices: [],
          topClients: []
        };
      }

      return {
        summary: {
          totalReceipts: analytics.totalReceipts || 0,
          totalAmount: analytics.totalAmount || 0,
          avgReceiptValue: analytics.avgReceiptValue || 0,
          thisMonthReceipts: analytics.thisMonth?.receipts || 0,
          thisMonthAmount: analytics.thisMonth?.amount || 0
        },
        charts: {
          monthlyTrend: analytics.monthlyTrend || [],
          topServices: (analytics.topServices || []).slice(0, 5),
          topClients: (analytics.topClients || []).slice(0, 5)
        },
        recentActivity: recentReceipts.map(receipt => ({
          id: receipt.id,
          receiptNumber: receipt.receiptNumber || 'N/A',
          clientName: receipt.clientName,
          serviceName: receipt.serviceName,
          amount: receipt.amount,
          date: receipt.serviceDate || receipt.createdAt,
          status: receipt.status || 'active'
        }))
      };
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      throw error;
    }
  }

  // Relatório financeiro por período
  async getFinancialReport(phone, startDate, endDate) {
    try {
      // Por enquanto, usar os recibos existentes
      // Em uma implementação completa, filtrar por data
      const allReceipts = await userService.getUserReceipts(phone, 100);
      
      // Filtrar por período se especificado
      let receipts = allReceipts;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        receipts = allReceipts.filter(receipt => {
          const receiptDate = new Date(receipt.serviceDate || receipt.createdAt);
          return receiptDate >= start && receiptDate <= end;
        });
      }

      const totalAmount = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
      const avgReceiptValue = receipts.length > 0 ? totalAmount / receipts.length : 0;

      // Agrupar por serviço
      const byService = receipts.reduce((acc, receipt) => {
        const service = receipt.serviceName || 'Não informado';
        if (!acc[service]) {
          acc[service] = { count: 0, amount: 0 };
        }
        acc[service].count += 1;
        acc[service].amount += receipt.amount || 0;
        return acc;
      }, {});

      // Agrupar por cliente
      const byClient = receipts.reduce((acc, receipt) => {
        const client = receipt.clientName || 'Não informado';
        if (!acc[client]) {
          acc[client] = { count: 0, amount: 0 };
        }
        acc[client].count += 1;
        acc[client].amount += receipt.amount || 0;
        return acc;
      }, {});

      return {
        period: { 
          startDate: startDate || 'início', 
          endDate: endDate || 'hoje' 
        },
        summary: {
          totalReceipts: receipts.length,
          totalAmount,
          avgReceiptValue
        },
        breakdown: {
          byService: Object.entries(byService).map(([name, data]) => ({
            name,
            count: data.count,
            amount: data.amount
          })).sort((a, b) => b.amount - a.amount),
          
          byClient: Object.entries(byClient).map(([name, data]) => ({
            name,
            count: data.count,
            amount: data.amount
          })).sort((a, b) => b.amount - a.amount)
        },
        receipts: receipts.slice(0, 50) // Limitar para performance
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  }

  // Buscar recibos com filtros
  async getReceiptsFiltered(phone, filters = {}) {
    try {
      const { category, status, startDate, endDate, page = 1, limit = 20 } = filters;
      
      // Por enquanto, usar método simples
      let receipts = await userService.getUserReceipts(phone, 1000);
      
      // Aplicar filtros
      if (category && category !== 'all') {
        receipts = receipts.filter(r => r.serviceCategory === category);
      }
      
      if (status && status !== 'all') {
        receipts = receipts.filter(r => (r.status || 'active') === status);
      }
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        receipts = receipts.filter(r => {
          const date = new Date(r.serviceDate || r.createdAt);
          return date >= start && date <= end;
        });
      }
      
      // Paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReceipts = receipts.slice(startIndex, endIndex);
      
      return {
        receipts: paginatedReceipts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(receipts.length / limit),
          totalReceipts: receipts.length,
          hasNextPage: endIndex < receipts.length,
          hasPrevPage: page > 1
        },
        summary: {
          totalAmount: receipts.reduce((sum, r) => sum + (r.amount || 0), 0),
          avgAmount: receipts.length > 0 ? receipts.reduce((sum, r) => sum + (r.amount || 0), 0) / receipts.length : 0
        }
      };
    } catch (error) {
      console.error('Error getting filtered receipts:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();

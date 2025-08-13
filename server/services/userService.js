const { db, isFirebaseEnabled } = require('../config/firebase');
const { SUBSCRIPTION_PLANS } = require('../config/stripe');

// In-memory storage when Firebase is not available
const inMemoryUsers = new Map();
const inMemoryReceipts = new Map();
const inMemoryUsage = new Map();

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

class UserService {
  constructor() {
    this.usersCollection = 'users';
    this.receiptsCollection = 'receipts';
    this.usageCollection = 'usage';
  }

  // Create or update user profile
  async createUser(userData) {
    try {
      if (!isFirebaseEnabled) {
        // Use in-memory storage
        const existingUser = inMemoryUsers.get(userData.phone);
        if (existingUser) {
          const updatedUser = { ...existingUser, ...userData, updatedAt: new Date() };
          inMemoryUsers.set(userData.phone, updatedUser);
          return updatedUser;
        } else {
          const newUser = {
            ...userData,
            plan: 'FREE',
            receiptsUsed: 0,
            receiptsLimit: SUBSCRIPTION_PLANS.FREE.receiptsPerMonth,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            subscriptionStatus: 'active',
            // User profile fields for receipts
            fullName: userData.fullName || null,
            cpfCnpj: userData.cpfCnpj || null,
            profileComplete: !!(userData.fullName && userData.cpfCnpj),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          inMemoryUsers.set(userData.phone, newUser);
          return newUser;
        }
      }

      const userRef = doc(db, this.usersCollection, userData.phone);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        });
        return { ...userDoc.data(), ...userData };
      } else {
        // Create new user with free plan
        const newUser = {
          ...userData,
          plan: 'FREE',
          receiptsUsed: 0,
          receiptsLimit: SUBSCRIPTION_PLANS.FREE.receiptsPerMonth,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: 'active',
          // User profile fields for receipts
          fullName: userData.fullName || null,
          cpfCnpj: userData.cpfCnpj || null,
          profileComplete: !!(userData.fullName && userData.cpfCnpj),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(userRef, newUser);
        return newUser;
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  // Get user by phone number
  async getUserByPhone(phone) {
    try {
      if (!isFirebaseEnabled) {
        const user = inMemoryUsers.get(phone);
        return user ? { id: phone, ...user } : null;
      }

      const userRef = doc(db, this.usersCollection, phone);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      throw error;
    }
  }

  // Update user subscription
  async updateUserSubscription(phone, subscriptionData) {
    try {
      if (!isFirebaseEnabled) {
        const user = inMemoryUsers.get(phone);
        if (user) {
          const updatedUser = { ...user, ...subscriptionData, updatedAt: new Date() };
          inMemoryUsers.set(phone, updatedUser);
        }
        return true;
      }

      const userRef = doc(db, this.usersCollection, phone);
      await updateDoc(userRef, {
        ...subscriptionData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }

  // Check if user can generate receipt (within limits)
  async canGenerateReceipt(phone) {
    try {
      const user = await this.getUserByPhone(phone);
      if (!user) return false;

      const plan = SUBSCRIPTION_PLANS[user.plan];
      if (!plan) return false;

      // Unlimited plan
      if (plan.receiptsPerMonth === -1) return true;

      // Check current month usage
      const currentMonthUsage = await this.getCurrentMonthUsage(phone);
      return currentMonthUsage < plan.receiptsPerMonth;
    } catch (error) {
      console.error('Error checking receipt generation limit:', error);
      return false;
    }
  }

  // Get current month usage
  async getCurrentMonthUsage(phone) {
    try {
      if (!isFirebaseEnabled) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        let count = 0;
        
        for (const [key, usage] of inMemoryUsage) {
          if (usage.userPhone === phone && 
              usage.type === 'receipt_generated' && 
              usage.createdAt >= startOfMonth) {
            count++;
          }
        }
        return count;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const usageQuery = query(
        collection(db, this.usageCollection),
        where('userPhone', '==', phone),
        where('createdAt', '>=', startOfMonth),
        where('type', '==', 'receipt_generated')
      );

      const usageSnapshot = await getDocs(usageQuery);
      return usageSnapshot.size;
    } catch (error) {
      console.error('Error getting current month usage:', error);
      return 0;
    }
  }

  // Record receipt generation
  async recordReceiptGeneration(phone, receiptData) {
    try {
      const receiptId = Date.now().toString();

      if (!isFirebaseEnabled) {
        // Store in memory
        inMemoryReceipts.set(receiptId, {
          userPhone: phone,
          ...receiptData,
          createdAt: new Date()
        });

        inMemoryUsage.set(`usage_${Date.now()}`, {
          userPhone: phone,
          type: 'receipt_generated',
          receiptId,
          createdAt: new Date()
        });

        // Update user receipts count
        const user = inMemoryUsers.get(phone);
        if (user) {
          user.receiptsUsed = (user.receiptsUsed || 0) + 1;
          user.lastReceiptAt = new Date();
          inMemoryUsers.set(phone, user);
        }

        return receiptId;
      }

      // Add to receipts collection
      const receiptRef = await addDoc(collection(db, this.receiptsCollection), {
        userPhone: phone,
        ...receiptData,
        createdAt: serverTimestamp()
      });

      // Record usage
      await addDoc(collection(db, this.usageCollection), {
        userPhone: phone,
        type: 'receipt_generated',
        receiptId: receiptRef.id,
        createdAt: serverTimestamp()
      });

      // Update user receipts count
      const userRef = doc(db, this.usersCollection, phone);
      await updateDoc(userRef, {
        receiptsUsed: increment(1),
        lastReceiptAt: serverTimestamp()
      });

      return receiptRef.id;
    } catch (error) {
      console.error('Error recording receipt generation:', error);
      throw error;
    }
  }

  // Get user receipts history
  async getUserReceipts(phone, limitCount = 20) {
    try {
      if (!isFirebaseEnabled) {
        const receipts = [];
        for (const [id, receipt] of inMemoryReceipts) {
          if (receipt.userPhone === phone) {
            receipts.push({ id, ...receipt });
          }
        }
        return receipts.sort((a, b) => b.createdAt - a.createdAt).slice(0, limitCount);
      }

      const receiptsQuery = query(
        collection(db, this.receiptsCollection),
        where('userPhone', '==', phone),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const receiptsSnapshot = await getDocs(receiptsQuery);
      return receiptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user receipts:', error);
      throw error;
    }
  }

  // Get user usage statistics
  async getUserStats(phone) {
    try {
      const user = await this.getUserByPhone(phone);
      if (!user) return null;

      const currentMonthUsage = await this.getCurrentMonthUsage(phone);
      const plan = SUBSCRIPTION_PLANS[user.plan];

      return {
        plan: user.plan,
        planName: plan.name,
        currentMonthUsage,
        monthlyLimit: plan.receiptsPerMonth,
        remainingReceipts: plan.receiptsPerMonth === -1 ? -1 : Math.max(0, plan.receiptsPerMonth - currentMonthUsage),
        subscriptionStatus: user.subscriptionStatus,
        totalReceipts: user.receiptsUsed || 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Update user profile information
  async updateUserProfile(phone, profileData) {
    try {
      const { fullName, cpfCnpj } = profileData;
      
      if (!isFirebaseEnabled) {
        const user = inMemoryUsers.get(phone);
        if (user) {
          const updatedUser = { 
            ...user, 
            fullName, 
            cpfCnpj,
            profileComplete: !!(fullName && cpfCnpj),
            updatedAt: new Date() 
          };
          inMemoryUsers.set(phone, updatedUser);
          return updatedUser;
        }
        return null;
      }

      const userRef = doc(db, this.usersCollection, phone);
      await updateDoc(userRef, {
        fullName,
        cpfCnpj,
        profileComplete: !!(fullName && cpfCnpj),
        updatedAt: serverTimestamp()
      });
      
      return await this.getUserByPhone(phone);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Check if user profile is complete
  async isProfileComplete(phone) {
    try {
      const user = await this.getUserByPhone(phone);
      return user && user.fullName && user.cpfCnpj;
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return false;
    }
  }

  // Check if user has a valid document (CPF/CNPJ)
  async hasValidDocument(phone) {
    try {
      const user = await this.getUserByPhone(phone);
      if (!user || !user.cpfCnpj) return false;

      const cpfCnpj = user.cpfCnpj.replace(/[^\d]/g, ''); // Remove non-digits
      
      // Check if it's a CPF (11 digits) or CNPJ (14 digits)
      if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
        return false;
      }

      // Basic validation passed
      return true;
    } catch (error) {
      console.error('Error validating document:', error);
      return false;
    }
  }

  // Clean phone number format
  cleanPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove whatsapp: prefix and spaces
    let cleaned = phone.replace(/whatsapp:|\s+/g, '');
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }
}

module.exports = new UserService();

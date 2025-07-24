#!/usr/bin/env node

/**
 * Script para configurar Firebase para produção
 * Cria projeto e configura regras de segurança
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Regras de segurança para Firestore (produção)
const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para usuários
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para recibos
    match /receipts/{receiptId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.creatorId);
    }
    
    // Regras para assinaturas
    match /subscriptions/{subscriptionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Regras para auditoria (apenas leitura para admins)
    match /audit/{auditId} {
      allow read: if request.auth != null && 
        request.auth.token.admin == true;
      allow write: if false; // Apenas via Admin SDK
    }
  }
}`;

// Regras de segurança para Storage
const STORAGE_RULES = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Regras para PDFs de recibos
    match /receipts/{userId}/{receiptId}.pdf {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.admin == true);
      allow write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Regras para uploads temporários
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
      allow delete: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.admin == true);
    }
  }
}`;

// Configuração do índice composto para Firestore
const FIRESTORE_INDEXES = {
  indexes: [
    {
      collectionGroup: "receipts",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "userId", order: "ASCENDING" },
        { fieldPath: "createdAt", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "receipts",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "userPhone", order: "ASCENDING" },
        { fieldPath: "createdAt", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "subscriptions",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "userId", order: "ASCENDING" },
        { fieldPath: "status", order: "ASCENDING" },
        { fieldPath: "updatedAt", order: "DESCENDING" }
      ]
    }
  ]
};

function createFirebaseConfig() {
  console.log('🔥 Configurando Firebase para produção...\n');

  // Criar arquivo de regras do Firestore
  fs.writeFileSync('firestore.rules', FIRESTORE_RULES);
  console.log('✅ Arquivo firestore.rules criado');

  // Criar arquivo de regras do Storage
  fs.writeFileSync('storage.rules', STORAGE_RULES);
  console.log('✅ Arquivo storage.rules criado');

  // Criar arquivo de índices
  fs.writeFileSync('firestore.indexes.json', JSON.stringify(FIRESTORE_INDEXES, null, 2));
  console.log('✅ Arquivo firestore.indexes.json criado');

  // Criar arquivo firebase.json
  const firebaseConfig = {
    firestore: {
      rules: "firestore.rules",
      indexes: "firestore.indexes.json"
    },
    storage: {
      rules: "storage.rules"
    },
    hosting: {
      public: "dist",
      ignore: [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      rewrites: [
        {
          source: "**",
          destination: "/index.html"
        }
      ]
    }
  };

  fs.writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2));
  console.log('✅ Arquivo firebase.json criado');

  console.log('\n📋 Setup Firebase concluído!');
  console.log('\n🚀 Próximos passos:');
  console.log('1. Instale Firebase CLI: npm install -g firebase-tools');
  console.log('2. Faça login: firebase login');
  console.log('3. Crie projeto: firebase projects:create recibolegal-prod');
  console.log('4. Inicialize: firebase init');
  console.log('5. Deploy regras: firebase deploy --only firestore:rules,storage:rules');
}

createFirebaseConfig();

module.exports = { createFirebaseConfig };

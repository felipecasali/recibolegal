# 👤 Sistema de Perfil de Usuário - ReciboLegal

## 🎯 **Funcionalidades Implementadas**

### **✅ Captura de Perfil no Primeiro Uso**
- **Nome Completo**: Coletado na primeira interação
- **CPF/CNPJ**: Documento do prestador de serviço
- **Validação**: Sistema verifica se perfil está completo
- **Persistência**: Dados salvos no Firebase/InMemory

### **✅ Inclusão no Recibo**
- **Seção "DADOS DO PRESTADOR"** adicionada ao PDF
- **Layout atualizado** com informações do usuário
- **Posicionamento**: Prestador → Cliente → Serviço → Valor

### **✅ Edição via WhatsApp**
- **Comando "PERFIL"**: Mostra dados atuais e opções
- **Edição de Nome**: Digite "NOME" ou "1"
- **Edição de Documento**: Digite "DOCUMENTO" ou "2"
- **Interface amigável** com confirmações

---

## 📱 **Fluxo de Uso WhatsApp**

### **🆕 Primeiro Acesso**
```
Usuário: "oi"
Bot: "Como é seu primeiro acesso, preciso de informações básicas.
      Por favor, me diga seu nome completo:"

Usuário: "João Silva"
Bot: "Perfeito! Agora preciso do seu CPF ou CNPJ:"

Usuário: "123.456.789-00"  
Bot: "✅ Perfil configurado! Olá João! Para seu primeiro recibo,
      me diga o nome completo do seu cliente:"
```

### **🔄 Usuário Recorrente**
```
Usuário: "oi"
Bot: "🎉 Olá novamente, João Silva!
      Para criar um novo recibo, me diga o nome do seu cliente:"
```

### **⚙️ Edição de Perfil**
```
Usuário: "perfil"
Bot: "⚙️ Meu Perfil
     
     Dados atuais:
     👤 Nome: João Silva
     📄 CPF/CNPJ: 123.456.789-00
     
     1️⃣ Digite NOME para alterar
     2️⃣ Digite DOCUMENTO para alterar
     3️⃣ Digite SAIR para voltar"

Usuário: "nome"
Bot: "✏️ Digite seu novo nome completo:"

Usuário: "João Silva Santos"
Bot: "✅ Perfil atualizado com sucesso!
     Nome: João Silva Santos
     CPF/CNPJ: 123.456.789-00"
```

---

## 🛠️ **Implementação Técnica**

### **🗄️ Banco de Dados**
```javascript
// User Schema (Firebase/InMemory)
{
  phone: "+5511999999999",
  fullName: "João Silva",        // NOVO
  cpfCnpj: "123.456.789-00",    // NOVO
  profileComplete: true,         // NOVO
  plan: "FREE",
  receiptsUsed: 0,
  // ... outros campos existentes
}
```

### **🤖 Estados do Bot**
```javascript
// Novos estados adicionados:
COLLECTING_USER_NAME: 'collecting_user_name',
COLLECTING_USER_DOCUMENT: 'collecting_user_document', 
EDITING_PROFILE: 'editing_profile',
EDITING_USER_NAME: 'editing_user_name',
EDITING_USER_DOCUMENT: 'editing_user_document'
```

### **📄 PDF Layout**
```
RECIBO LEGAL
Data de emissão: 27/07/2025

DADOS DO PRESTADOR          ← NOVO
Nome: João Silva
CPF/CNPJ: 123.456.789-00

DADOS DO CLIENTE
Nome: Maria Santos
CPF/CNPJ: 987.654.321-00

DADOS DO SERVIÇO
Serviço: Consultoria
Descrição: Análise de processos
Data: 27/07/2025

VALOR: R$ 1.500,00
```

---

## 🔄 **Comandos WhatsApp**

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `oi` / `olá` | Iniciar/criar recibo | "oi" |
| `perfil` | Ver/editar perfil | "perfil" |
| `nome` | Editar nome (no menu perfil) | "nome" |
| `documento` | Editar CPF/CNPJ (no menu perfil) | "documento" |
| `histórico` | Ver recibos anteriores | "histórico" |
| `status` | Ver plano atual | "status" |
| `recomeçar` | Reiniciar processo | "recomeçar" |

---

## ✅ **Benefícios**

### **👥 Para o Usuário**
- **Setup único**: Configura uma vez, usa sempre
- **Recibos profissionais**: Com dados completos do prestador
- **Edição fácil**: Via WhatsApp, sem apps externos
- **Histórico preservado**: Dados consistentes

### **📈 Para o Negócio**
- **Compliance legal**: Recibos com prestador identificado
- **Experiência melhor**: Setup guiado para novos usuários
- **Retenção**: Perfil completo aumenta engajamento
- **Dados estruturados**: Para analytics e features futuras

---

## 🧪 **Testes**

### **Cenários Testados**
- ✅ Primeiro acesso (perfil incompleto)
- ✅ Usuário recorrente (perfil completo)
- ✅ Edição de nome via WhatsApp
- ✅ Edição de documento via WhatsApp
- ✅ Geração de PDF com dados do prestador
- ✅ Fallback quando dados não disponíveis

### **Edge Cases**
- ✅ Perfil incompleto (só nome ou só documento)
- ✅ Dados vazios no PDF (mostra "Não informado")
- ✅ Erro ao salvar perfil (retry com mensagem)
- ✅ Firebase offline (usa InMemory)

---

## 🚀 **Próximos Passos**

1. **Validação de CPF/CNPJ**: Regex e verificação de dígitos
2. **Múltiplos prestadores**: Para empresas com vários funcionários
3. **Logo/Assinatura**: Upload de imagem para personalizar recibos
4. **Templates**: Diferentes layouts de recibo
5. **API pública**: Para integração com outros sistemas

**Sistema totalmente funcional e pronto para uso!** 🎉

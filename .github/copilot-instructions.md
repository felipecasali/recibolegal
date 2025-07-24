<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This project is a Vite-based React application for ReciboLegal, a platform that allows freelancers and small businesses to generate receipts, contracts, and service proofs via WhatsApp. Focus on simplicity, mobile-first design, and automatic digital document signing.

# GitHub Copilot Custom Instructions for ReciboLegal

## 🧾 Project: ReciboLegal
ReciboLegal is a WhatsApp-based microservice platform that allows independent professionals and informal workers to generate legally valid receipts and simple contracts using natural language interaction. The system generates and delivers signed PDF documents via WhatsApp and stores them in the cloud.

---

## 🧩 Core Modules

1. **WhatsApp Bot Interface**
   - Handles message flow via Twilio or Meta WhatsApp Cloud API.
   - Uses simple and guided questions to collect user inputs.

2. **Receipt and Contract Generator**
   - Converts user input into legally structured documents.
   - Uses templates to generate PDFs (e.g., with ReportLab or PDFKit).
   - Adds basic digital signature fields.

3. **Storage and Access**
   - Stores generated files in Firebase Storage or AWS S3.
   - Generates secure, short-lived URLs for access and sharing.

4. **Authentication and User Management**
   - Identifies users by WhatsApp number and session token.
   - Simple tracking of usage quota (e.g., 5 free receipts per month).

5. **Billing and Plans**
   - Freemium model with Stripe integration.
   - Monthly subscription and/or pay-per-use logic.

---

## 💻 Tech Stack

- **Frontend (if any):** Web landing page (React/Next.js)
- **Backend:** Node.js or Python (FastAPI)
- **PDF Generation:** ReportLab (Python) or PDFKit
- **Database:** Firebase Firestore or MongoDB Atlas
- **File Storage:** Firebase Storage or AWS S3
- **WhatsApp API:** Twilio or Meta WhatsApp Business Cloud API
- **Authentication:** Based on WhatsApp number + token

---

## 💡 Naming Conventions

- Use camelCase for variables and function names.
- Use PascalCase for classes.
- Use kebab-case for filenames in frontend (e.g., `receipt-form.tsx`).
- Folder structure should group by feature (e.g., `/whatsapp-bot`, `/pdf-generator`, `/billing`).

---

## ✅ Copilot Suggestions

Copilot should prioritize:
- Clean and modular functions.
- RESTful API structure.
- Async/await handling where applicable.
- Reusable components (e.g., PDF template generation, WhatsApp message formatting).

Avoid:
- Hardcoded strings (use constants or localization support).
- Writing raw SQL (use Firestore SDK or appropriate client).
- Inlining business logic into route handlers.

---

## 🧠 Example Prompts

Use these prompts in the editor to generate or continue tasks:

### WhatsApp Bot
> "Generate a FastAPI route that receives a webhook from WhatsApp and replies with a step-by-step receipt builder."

### PDF Generator
> "Create a Python function that receives user data and generates a signed receipt PDF using ReportLab."

### Storage
> "Write a Firebase function that uploads a file to Storage and returns a download URL."

### Subscription
> "Implement Stripe billing for a freemium plan with a limit of 5 receipts per month."

### Usage Tracking
> "Track usage per WhatsApp user ID and limit free plan to 5 receipts per month."

---

## 🧪 Test Strategy

- Use pytest or Jest (depending on backend).
- Mock WhatsApp payloads for testing bot flow.
- Validate PDF output fields against templates.
- Unit tests for usage tracking and billing.

---

## 🛡️ Security Notes

- Sanitize all inputs.
- Never trust incoming WhatsApp payloads without verification.
- Secure signed URL expirations.

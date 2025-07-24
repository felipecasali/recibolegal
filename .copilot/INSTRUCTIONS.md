# Copilot Instructions for ReciboLegal

## Project Overview

ReciboLegal is a SaaS platform designed to help self-employed individuals generate **receipts and contracts via WhatsApp**. It simplifies bureaucratic tasks by guiding users through a conversational flow and automating PDF generation, digital storage, and document delivery.

## Technology Stack

- **Backend:** Python, FastAPI
- **Frontend:** React + Tailwind CSS
- **Storage:** Firebase Firestore, Firebase Storage
- **Payments:** Stripe
- **Messaging:** WhatsApp (via Twilio or Meta API)

## Coding Style & Conventions

- Use **FastAPI** for all backend routes.
- Use **async** functions for I/O-bound operations.
- Always handle exceptions gracefully and return structured error responses.
- Use **Type Hints** wherever possible.
- Store stateful interactions (e.g., user progress) in **Firestore** using the WhatsApp number as the unique ID.
- In React, use **functional components** and **Tailwind CSS** for styling.
- Maintain a mobile-first, clean, and minimalist design.

## Business Logic Guidelines

- Each WhatsApp interaction should correspond to a step in the document creation flow.
- Limit free-tier users to **5 documents per month**.
- All documents must be uploaded to Firebase Storage and a short URL should be generated.
- After a receipt or contract is generated, send the download link via WhatsApp.

## Prompting Philosophy

When generating code with Copilot:
- Focus on practical, minimal examples.
- Prefer modular, composable functions over large monolithic scripts.
- Respect architectural separation between layers (e.g., don’t mix view logic with PDF generation).
- Output PDF documents with professional formatting and basic branding.

## Naming Conventions

- Use `whatsapp_*.py` for message handling logic.
- Use `receipt_generator.py` and `contract_generator.py` for PDF creation.
- Use `firebase_utils.py` for Firestore and Storage interactions.
- Use `stripe_utils.py` for all payment-related functions.
- Use `user_session.py` to manage conversational context.

## Security

- Sanitize all user input before injecting it into templates.
- Validate webhook signatures to avoid spoofed requests.
- Protect user data and restrict access via proper Firestore security rules.

## Future Features

Copilot should also be ready to assist with future tasks like:
- Digital signature integration (e.g., DocuSign).
- WhatsApp-based user authentication.
- Document revision tracking.
- User dashboard for document history and plan upgrades.

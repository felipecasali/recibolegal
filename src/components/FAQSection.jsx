import React from 'react';

const faqList = [
  {
    question: 'Como emitir recibo online grátis?',
    answer: "Basta acessar o ReciboLegal, clicar em 'Começar Grátis', responder as perguntas e receber seu recibo em PDF pelo WhatsApp."
  },
  {
    question: 'Recibo online tem validade jurídica?',
    answer: 'Sim, os recibos gerados pelo ReciboLegal possuem validade jurídica, assinatura digital e são aceitos em todo o Brasil.'
  },
  {
    question: 'Serve para MEI e autônomo?',
    answer: 'Sim, a plataforma é ideal para MEI, autônomos, freelancers e pequenas empresas que precisam de recibos rápidos e seguros.'
  },
  {
    question: 'Como funciona a assinatura digital?',
    answer: 'Todos os recibos são assinados digitalmente, garantindo autenticidade e segurança jurídica para você e seu cliente.'
  },
  {
    question: 'Posso emitir recibo pelo WhatsApp?',
    answer: 'Sim! O ReciboLegal permite que você gere e receba seus recibos diretamente pelo WhatsApp, sem burocracia.'
  }
];

export default function FAQSection() {
  return (
    <section className="faq-section">
      <h2>Perguntas frequentes sobre recibo online</h2>
      <div className="faq-list">
        {faqList.map((item, idx) => (
          <div className="faq-item" key={idx}>
            <h3 className="faq-question">{item.question}</h3>
            <p className="faq-answer">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

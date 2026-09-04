/**
 * Answers are drawn from what the shop already promises elsewhere on the site
 * (delivery windows, the preview step, the shipping threshold, payment
 * options). Nothing here states a policy the shop has not actually set —
 * returns and refunds are deliberately absent until there is a real one.
 */
export const faqs = [
  {
    question: "How long does a personalised gift take?",
    answer:
      "Pencil portraits take 5–7 working days to draw, and printed items like mugs and frames are usually dispatched in 3–4 working days. Delivery across India adds roughly 2–7 days depending on your pin code.",
  },
  {
    question: "What kind of photo should I send?",
    answer:
      "A clear, well-lit photograph works best — ideally facing the camera, with the face large enough in frame that you can see the eyes clearly. Phone photos are perfectly fine. Send it on WhatsApp after ordering, or paste a link at checkout.",
  },
  {
    question: "Can I see the gift before it ships?",
    answer:
      "Yes. We photograph the finished piece and send it to you for approval before anything is packed. Nothing is dispatched until you are happy with it.",
  },
  {
    question: "Do you deliver everywhere in India?",
    answer:
      "Yes, we ship anywhere in India with tracking. Delivery is charged on every order — the amount depends on the item and on where it is going, and the exact figure appears at checkout once you enter your state. Every parcel is padded and gift-wrapped.",
  },
  {
    question: "How do I pay?",
    answer:
      "You can pay online at checkout by UPI, card or netbanking through Razorpay. You can also choose to pay on confirmation — we send a payment link along with the design preview, so nothing is charged until you approve the work.",
  },
  {
    question: "Can I order a portrait of more than one person?",
    answer:
      "Yes. The A3 couple portrait covers two people, and for larger family groups message us on WhatsApp with the photograph and we will quote for the size you need.",
  },
  {
    question: "Do you take bulk or corporate orders?",
    answer:
      "Yes — mugs and frames work well for wedding return gifts, office milestones and event giveaways. Send us the quantity and the date you need them by, and we will come back with pricing and a timeline.",
  },
] as const;

export function faqPageSchema() {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

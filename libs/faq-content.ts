/**
 * Shopper FAQ, ported verbatim from the mobile app's `constants/faqContent.ts`.
 *
 * The facts — delivery windows, fees, refund timing, voucher rules — are the same words as the
 * app, so a shopper is never told two different things. The "where to click" lines are rewritten
 * for the web, because "tap Save Changes" on a Profile screen describes a UI that does not exist
 * in a browser. If a fact changes, change both files.
 */
export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string[];
};

export const FAQ_CATEGORIES = ["Get Started", "Orders", "Delivery", "Payment", "Vouchers", "Returns", "Markets"] as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-account-1",
    category: "Get Started",
    question: "How do I update my profile details?",
    answer: ["Go to Account, then the Profile tab.", "Edit your name, phone or photo and choose Save changes."],
  },
  {
    id: "faq-account-2",
    category: "Get Started",
    question: "Do I need an account to shop on ODOS?",
    answer: ["You can browse stores and products as a guest.", "Sign in to save addresses, track orders, use vouchers, and chat with stores."],
  },
  {
    id: "faq-orders-1",
    category: "Orders",
    question: "How do I track my order?",
    answer: ["Open Orders from the account menu and choose the order you want.", "You'll see live status updates, the full breakdown, and store chat if you need help."],
  },
  {
    id: "faq-orders-2",
    category: "Orders",
    question: "Can I cancel an order?",
    answer: ["If the store has not started preparing it yet, open the order and choose Cancel order.", "Once a store starts preparing your order, message the store from the order page instead."],
  },
  {
    id: "faq-delivery-1",
    category: "Delivery",
    question: "What delivery options does ODOS offer?",
    answer: ["Standard delivery usually takes 3–5 business days.", "Express is 1–2 days where available.", "Same-day delivery may be offered in Greater Accra when your address qualifies."],
  },
  {
    id: "faq-delivery-2",
    category: "Delivery",
    question: "How is my delivery fee calculated?",
    answer: ["Delivery fees depend on your region, cart total, and the method you choose at checkout.", "The exact fee is always shown before you pay — no surprises after checkout."],
  },
  {
    id: "faq-payment-1",
    category: "Payment",
    question: "Are there extra fees for card payments?",
    answer: ["No. ODOS does not add extra payment fees for debit or credit card transactions."],
  },
  {
    id: "faq-payment-2",
    category: "Payment",
    question: "Why can't I check out with my card?",
    answer: ["Confirm your card number, expiry date, and CVV are correct.", "Check that you have enough funds and that online transactions are enabled with your bank.", "If it still fails, try another payment method or contact support."],
  },
  {
    id: "faq-payment-3",
    category: "Payment",
    question: "Can I pay with my ODOS wallet?",
    answer: ["If wallet balance is available at checkout, you'll see it as a payment option.", "Top up from Account, then the Wallet tab, before you check out."],
  },
  {
    id: "faq-vouchers-1",
    category: "Vouchers",
    question: "How do I apply a voucher at checkout?",
    answer: ["Claim vouchers from Deals, or from the Vouchers tab in your account.", "At checkout, pick one of your vouchers or type a code in before you place the order."],
  },
  {
    id: "faq-vouchers-2",
    category: "Vouchers",
    question: "Why was my voucher rejected?",
    answer: ["The voucher may have expired, already been used, or not meet the minimum order amount.", "Check the Vouchers tab in your account for its terms and expiry."],
  },
  {
    id: "faq-returns-1",
    category: "Returns",
    question: "How do I start a return?",
    answer: ["Open the Returns tab in your account and pick the delivered item.", "Explain the issue and submit — the store or ODOS team will review your request."],
  },
  {
    id: "faq-returns-2",
    category: "Returns",
    question: "How long do refunds take?",
    answer: ["After your return is approved, refunds are processed back to your original payment method.", "Timing depends on your bank or mobile money provider — usually a few business days."],
  },
  {
    id: "faq-markets-1",
    category: "Markets",
    question: "How do I find stores in my city?",
    answer: ["Open Market, or search for a store by name.", "Use the category and market filters to narrow down fashion, electronics, beauty and more."],
  },
  {
    id: "faq-markets-2",
    category: "Markets",
    question: "Can I chat with a store before buying?",
    answer: ["Yes. Open a product or store page and choose Chat to message the vendor directly.", "Your conversations stay in the Chats tab of your account, and on your phone."],
  },
];

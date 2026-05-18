"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, Search, HelpCircle, MessageCircle, Mail, Phone, ShoppingBag, Truck, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

interface ContactDetails {
  email?: string;
  phone?: string;
  support_email?: string;
  support_phone?: string;
}

const FAQ_CATEGORIES = [
  { id: 'all', name: 'All Questions', icon: HelpCircle },
  { id: 'orders', name: 'Orders & Returns', icon: ShoppingBag },
  { id: 'shipping', name: 'Shipping & Delivery', icon: Truck },
  { id: 'payment', name: 'Payments', icon: CreditCard },
  { id: 'account', name: 'Account & Security', icon: ShieldCheck },
];

const FAQS = [
  {
    category: 'orders',
    question: "How do I track my order status?",
    answer: "You can track your order by visiting the 'Track Order' page in our footer. Simply enter your Order ID and Billing Email to see the current status and tracking information for your package."
  },
  {
    category: 'orders',
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for most unused items in their original packaging. Please visit our Shipping & Returns page for detailed instructions on how to start a return process."
  },
  {
    category: 'shipping',
    question: "How long does shipping usually take?",
    answer: "Standard shipping typically takes 3-5 business days within the country. Express shipping options are available at checkout and usually take 1-2 business days."
  },
  {
    category: 'shipping',
    question: "Do you offer international shipping?",
    answer: "Currently, we ship to Malaysia, Singapore, and Thailand. We are working on expanding our delivery network to more countries in the near future."
  },
  {
    category: 'payment',
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards (Visa, Mastercard, AMEX), FPX Online Banking, and various e-wallets including Touch 'n Go, GrabPay, and Boost."
  },
  {
    category: 'payment',
    question: "Is it safe to use my credit card on your site?",
    answer: "Yes, we use industry-standard SSL encryption to protect your data. We do not store your credit card information on our servers; all payments are processed through secure, PCI-compliant payment gateways."
  },
  {
    category: 'account',
    question: "How do I create an account?",
    answer: "Click on the user icon in the top right corner of the website and select 'Sign Up'. You'll need to provide your name, email address, and create a secure password."
  },
  {
    category: 'account',
    question: "I forgot my password, what should I do?",
    answer: "On the login page, click 'Forgot Password'. Enter your registered email address, and we'll send you a link to reset your password immediately."
  },
  {
    category: 'orders',
    question: "Can I cancel my order after it has been placed?",
    answer: "Orders can be cancelled within 1 hour of placement. After that, we begin processing for shipment. Please contact our support team immediately if you need to make changes."
  }
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);

  useEffect(() => {
    api.get('/settings/contact-details')
      .then((res) => {
        if (res.data?.data) setContactDetails(res.data.data);
      })
      .catch(() => {/* silently fail, fallback values used */});
  }, []);

  // Resolve the best email and phone to display
  const displayEmail = contactDetails?.support_email || contactDetails?.email;
  const displayPhone = contactDetails?.support_phone || contactDetails?.phone;


  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Red Header Banner */}
      <section className='py-3 bg-brand'>
        <div className="container">
          <div className="w-full flex items-center justify-between">
            <h1 className="text-white font-bold text-sm md:text-base tracking-wide">Frequently Asked Questions</h1>
            <div className="flex items-center gap-2 text-xs md:sm font-medium">
              <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
              <span className="text-white/50">/</span>
              <span className="text-white">FAQ</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Search Section */}
      <section className="bg-white border-b border-slate-200 py-12 md:py-20">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight">How can we help you?</h2>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for questions (e.g. 'shipping', 'return')..."
              className="pl-12 h-14 rounded-2xl border-slate-200 shadow-sm focus:ring-brand focus:border-brand text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Left: Categories Navigation */}
            <aside className="lg:w-1/4">
              <div className="sticky top-24 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-4">Categories</h3>
                {FAQ_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer",
                        activeCategory === cat.id
                          ? "bg-brand text-white shadow-lg shadow-brand/20"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", activeCategory === cat.id ? "text-white" : "text-slate-400")} />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right: Accordion Questions */}
            <div className="lg:w-3/4">
              {filteredFaqs.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 border-dashed">
                  <HelpCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No questions found matching your search.</p>
                  <Button
                    variant="ghost"
                    className="mt-4 text-brand font-bold cursor-pointer"
                    onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <div
                      key={index}
                      className={cn(
                        "bg-white rounded-2xl border transition-all duration-300",
                        openIndex === index ? "border-brand/30 shadow-md" : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
                      >
                        <span className={cn(
                          "font-bold text-base transition-colors",
                          openIndex === index ? "text-brand" : "text-slate-800"
                        )}>
                          {faq.question}
                        </span>
                        <ChevronDown className={cn(
                          "h-5 w-5 text-slate-400 transition-transform duration-300",
                          openIndex === index ? "rotate-180 text-brand" : ""
                        )} />
                      </button>
                      <div className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        openIndex === index ? "max-h-96" : "max-h-0"
                      )}>
                        <div className="px-6 pb-6 pt-2">
                          <div className="h-px bg-slate-100 mb-6" />
                          <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Still have questions? Section */}
              <div className="mt-16 bg-slate-900 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <MessageCircle className="h-32 w-32 text-white" />
                </div>
                <div className="relative z-10 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
                  <p className="text-slate-400 text-sm mb-8 max-w-xl">
                    Can't find the answer you're looking for? Please contact our friendly support team.
                    We're here to help you 24/7.
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <Link href="/contact">
                      <Button className="bg-brand hover:bg-brand/90 text-white rounded-xl px-8 h-12 font-bold transition-all">
                        Contact Us
                      </Button>
                    </Link>
                    <div className="flex items-center gap-6 text-slate-400 text-sm font-bold">
                      {displayEmail && (
                        <a href={`mailto:${displayEmail}`} className="hover:text-white transition-colors flex items-center gap-2">
                          <Mail className="h-4 w-4" /> {displayEmail}
                        </a>
                      )}
                      {displayPhone && (
                        <a href={`tel:${displayPhone}`} className="hover:text-white transition-colors flex items-center gap-2">
                          <Phone className="h-4 w-4" /> {displayPhone}
                        </a>
                      )}
                      {!displayEmail && !displayPhone && (
                        <a href="mailto:support@netmow.com" className="hover:text-white transition-colors flex items-center gap-2">
                          <Mail className="h-4 w-4" /> support@netmow.com
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

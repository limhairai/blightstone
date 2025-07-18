"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useInView } from 'react-intersection-observer';

const faqs = [
  {
    question: "How quickly can I get access to Meta ad accounts?",
    answer:
      "Most ad account applications are processed within 24-48 hours. Once approved, you'll have instant access to your accounts through our dashboard.",
  },
  {
    question: "What payment methods do you accept for account top-ups?",
    answer:
      "We accept all major credit cards, bank transfers, and cryptocurrency payments. All transactions are processed securely and funds are available immediately.",
  },
  {
    question: "Can I manage multiple business entities from one dashboard?",
    answer:
      "Yes! Our platform supports multi-entity management, allowing you to seamlessly switch between different business entities and manage all your ad accounts from a single interface.",
  },
  {
    question: "Is there a minimum spending requirement?",
    answer:
      "No, there's no minimum spending requirement. You can start with any budget that works for your campaigns and scale up as needed.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We offer 24/7 customer support through chat, email, and phone. Our team of ad account specialists is always ready to help with any questions or issues.",
  },
  {
    question: "Do I need to verify my domains and landing pages?",
    answer:
      "Yes, we require domain and landing page verification to ensure compliance with Meta's advertising policies and to maintain platform integrity. This helps protect both your campaigns and our network.",
  },
  {
    question: "How secure is my account and payment information?",
    answer:
      "We use enterprise-grade security measures including SSL encryption, two-factor authentication, and comply with all major security standards to protect your data and funds.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div 
      ref={ref}
      className={`max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-1000 ease-out transform ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
          Frequently Asked <span className="text-gradient">Questions</span>
        </h2>
        <p className="text-white/70 text-lg sm:text-xl leading-relaxed">
          Everything you need to know about AdHub and our services.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/20"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200 touch-manipulation"
            >
              <span className="text-base sm:text-lg font-medium text-white pr-4 sm:pr-6 md:pr-8 leading-relaxed">{faq.question}</span>
              <ChevronDown
                className={`w-4 h-4 sm:w-5 sm:h-5 text-white/60 transition-transform duration-200 flex-shrink-0 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-5 md:pb-6">
                <div className="text-white/70 leading-relaxed text-sm sm:text-base">{faq.answer}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 
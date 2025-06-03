"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

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
    question: "How secure is my account and payment information?",
    answer:
      "We use enterprise-grade security measures including SSL encryption, two-factor authentication, and comply with all major security standards to protect your data and funds.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Frequently Asked <span className="text-gradient">Questions</span>
        </h2>
        <p className="text-white/70 text-xl leading-relaxed">
          Everything you need to know about AdHub and our services.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/20"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
            >
              <span className="text-lg font-medium text-white pr-8">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-white/60 transition-transform duration-200 flex-shrink-0 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-8 pb-6">
                <div className="text-white/70 leading-relaxed">{faq.answer}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 
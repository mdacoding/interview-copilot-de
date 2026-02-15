import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageCircle, HelpCircle, Zap, CreditCard, Shield } from 'lucide-react'

const faqs = [
  {
    question: "How does AI Interview Copilot work?",
    answer: "Upload your resume, paste a job URL, or just start speaking. Our AI analyzes your answers in real-time and provides STAR method suggestions to help you ace your interview.",
    icon: Zap
  },
  {
    question: "Is this free?",
    answer: "Yes! You get 3 free practice sessions. Upgrade to Pro for unlimited sessions at just $29/month, or get lifetime access for a one-time $299 payment.",
    icon: CreditCard
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use enterprise-grade encryption and never share your data. Your resume and interview practice sessions are stored securely and you can delete them anytime.",
    icon: Shield
  },
  {
    question: "Can I use it on my phone?",
    answer: "Yes! AI Interview Copilot works on desktop browsers. For the best experience, we recommend using Chrome or Safari on a laptop with a microphone.",
    icon: MessageCircle
  },
  {
    question: "What is the STAR method?",
    answer: "STAR is a structured manner of responding to behavioral-based interview questions. S-Situation, T-Task, A-Action, R-Result. Our AI helps you structure your answers using this proven technique.",
    icon: HelpCircle
  }
]

function FAQItem({ faq, isOpen, onToggle }) {
  const Icon = faq.icon
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="pb-4 pl-12 pr-4 text-gray-600 dark:text-gray-400">
          {faq.answer}
        </div>
      )}
    </div>
  )
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-600" />
          Frequently Asked Questions
        </h2>
      </div>
      
      <div>
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            faq={faq}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
          />
        ))}
      </div>
    </div>
  )
}

import { Quote, Star } from 'lucide-react'

const testimonials = [
  {
    quote: "I landed my dream job at Google after just 3 practice sessions. The STAR method suggestions were game-changing!",
    author: "Sarah M.",
    role: "Software Engineer",
    company: "Google",
    rating: 5
  },
  {
    quote: "The real-time feedback helped me identify and fix filler words I didn't even know I was using.",
    author: "James K.",
    role: "Product Manager",
    company: "Meta",
    rating: 5
  },
  {
    quote: "Worth every penny for the lifetime deal. I've used it for 5 different interviews and got offers from all of them!",
    author: "Emily R.",
    role: "Data Scientist",
    company: "Netflix",
    rating: 5
  }
]

function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      
      <Quote className="h-8 w-8 text-indigo-200 dark:text-indigo-800 mb-3" />
      
      <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
        "{testimonial.quote}"
      </p>
      
      <div className="border-t pt-4">
        <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {testimonial.role} at {testimonial.company}
        </p>
      </div>
    </div>
  )
}

export default function Testimonials() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-500" />
        Loved by job seekers
      </h2>
      
      <div className="grid md:grid-cols-3 gap-4">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={index} testimonial={testimonial} />
        ))}
      </div>
      
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Join 2,000+ professionals who landed their dream jobs
      </p>
    </div>
  )
}

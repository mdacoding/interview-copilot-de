import { Twitter, Linkedin, Facebook, Link2, Check } from 'lucide-react'
import { useState } from 'react'
import { trackShare } from '../lib/ph-analytics'

const shareMessages = {
  twitter: "I just tried AI Interview Copilot and landed my dream job! 🚀 Try it free →",
  linkedin: "Just discovered AI Interview Copilot - the best way to practice interviews with real-time AI feedback. Perfect for landing your dream job!",
  facebook: "I landed my dream job using AI Interview Copilot! The real-time STAR method feedback helped me ace my interviews. Try it free!"
}

export default function ShareButtons({ 
  url = null, 
  title = "AI Interview Copilot", 
  variant = 'default' 
}) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessages.twitter)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  }

  const handleShare = (platform) => {
    trackShare(platform)
    window.open(shareLinks[platform], '_blank', 'width=600,height=400')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      trackShare('copy')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleShare('twitter')}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Share on Twitter"
        >
          <Twitter className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleCopyLink}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Copy link"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Share with your network:
      </p>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
        >
          <Twitter className="h-4 w-4" />
          <span className="text-sm font-medium">Twitter</span>
        </button>

        <button
          onClick={() => handleShare('linkedin')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077b5] text-white hover:bg-[#005885] transition-colors"
        >
          <Linkedin className="h-4 w-4" />
          <span className="text-sm font-medium">LinkedIn</span>
        </button>

        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877f2] text-white hover:bg-[#0d65d9] transition-colors"
        >
          <Facebook className="h-4 w-4" />
          <span className="text-sm font-medium">Facebook</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              <span className="text-sm font-medium">Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

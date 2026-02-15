import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UpgradeBanner from '../components/UpgradeBanner'
import DarkModeToggle from '../components/DarkModeToggle'
import FAQSection from '../components/FAQSection'
import Testimonials from '../components/Testimonials'
import ShareButtons from '../components/ShareButtons'
import { usePHTracking } from '../hooks/usePHTracking'
import { GradientText, GlassCard } from '../components/ui/MagicButton'
import { TrendingUp, Users, Video, Zap } from 'lucide-react'

export default function Dashboard() {
  const { user, currentPlan, remainingSessions, isLoggedIn, loading, signOut } = useAuth()
  usePHTracking() // Initialize PH tracking

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-900">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-900">
        <div className="text-center">
          <p className="text-white/60 mb-4">Please sign in first.</p>
          <Link to="/login" className="text-brand-400 font-medium hover:underline">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-100 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-900 transition-colors">
      {/* Sticky Pricing - Top Right */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-2xl shadow-2xl text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          $29/mo or $299 Lifetime
        </div>
      </div>

      <header className="bg-white/80 dark:bg-black/50 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Interview Copilot</h1>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <span className="text-sm text-gray-600 dark:text-white/60">{user?.email}</span>
            <span className="text-xs px-2 py-1 rounded bg-brand-500/20 text-brand-600 dark:text-brand-300">{currentPlan}</span>
            <button onClick={signOut} className="text-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Trust Badges */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <div className="bg-gradient-to-r from-green-400 to-green-600 px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            92% Success Rate
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
            <Users className="h-5 w-5" />
            500+ Users
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
            <Video className="h-5 w-5" />
            Works with Zoom/Teams
          </div>
        </div>

        {/* Hero Section */}
        <div className="py-12 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-8 leading-tight">
            AI Zoom Copilot
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-100 max-w-2xl mx-auto leading-relaxed px-4">
            92% Interview Success Rate • Live AI Tips • STAR Method
          </p>
        </div>

        <UpgradeBanner />

        {/* Sessions Info */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your Plan</h2>
          <p className="text-gray-600 dark:text-white/70">
            Free sessions remaining: <strong className="text-brand-600 dark:text-brand-400">{remainingSessions}</strong>
            {remainingSessions <= 0 && ' — Upgrade to continue practicing!'}
          </p>
        </GlassCard>

        {/* Start Interview - GOLD CTA */}
        <div className="text-center">
          <Link
            to="/interview"
            className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xl font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all"
          >
            🎯 Start Interview ({remainingSessions} free)
          </Link>
        </div>

        {/* PH Features: Testimonials */}
        <Testimonials />

        {/* PH Features: FAQ */}
        <FAQSection />

        {/* PH Features: Share */}
        <GlassCard className="p-6">
          <ShareButtons />
        </GlassCard>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { MagicButton, GlassCard, GradientText } from './ui/MagicButton'
import { Zap, Crown, Check, CreditCard, Users, TrendingUp, Video } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export default function UpgradeBanner() {
  const { remainingSessions, currentPlan, getAccessToken, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = pricing, 2 = email capture

  if (currentPlan === 'pro' || currentPlan === 'lifetime' || remainingSessions > 0) return null

  const handleCheckout = async (plan = 'pro') => {
    setLoading(true)
    try {
      const token = await getAccessToken()
      const res = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-supabase-auth': token || '' },
        body: JSON.stringify({ 
          plan,
          success_url: window.location.origin + '/dashboard', 
          cancel_url: window.location.origin + '/dashboard' 
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else await refreshProfile()
    } catch (_) {}
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Trust Signals */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-green-300">92% Success Rate</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/20 border border-brand-500/30">
          <Users className="h-4 w-4 text-brand-400" />
          <span className="text-sm font-medium text-brand-300">500+ Users</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
          <Video className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">Works with Zoom/Teams</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-brand-400' : 'bg-white/20'}`} />
        <div className="w-8 h-0.5 bg-white/20" />
        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-brand-400' : 'bg-white/20'}`} />
        <span className="ml-2 text-sm text-white/60">Step {step}/2</span>
      </div>

      {/* Main Banner */}
      <GlassCard className="p-6 md:p-8">
        <div className="text-center mb-6">
          <GradientText className="text-3xl md:text-4xl font-bold mb-2">
            🚀 Unlock Unlimited Interviews
          </GradientText>
          <p className="text-white/70">Your 3 free sessions are expired. Upgrade now!</p>
        </div>

        {/* Free Sessions Counter - Prominent */}
        <div className="flex justify-center mb-6">
          <div className="px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/40">
            <span className="text-red-300 font-semibold">No Free Sessions Remaining</span>
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pro Monthly */}
              <div className="relative bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-brand-400/50 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-6 w-6 text-brand-400" />
                  <h4 className="font-bold text-xl text-white">Pro Monthly</h4>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">$29</span>
                  <span className="text-white/60">/month</span>
                </div>
                <ul className="text-sm space-y-2 mb-6 text-white/70">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Unlimited Interviews</li>
                  <li className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-400" /> Card, SEPA, Klarna</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Cancel anytime</li>
                </ul>
                <MagicButton 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setStep(2)}
                >
                  Select Plan
                </MagicButton>
              </div>

              {/* Lifetime Deal */}
              <div className="relative bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-2xl p-6 border-2 border-yellow-400/50">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-bold flex items-center gap-1">
                  🔥 PH DEAL
                </div>
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <Crown className="h-6 w-6 text-yellow-400" />
                  <h4 className="font-bold text-xl text-white">Lifetime Access</h4>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">$299</span>
                  <span className="text-white/60"> one-time</span>
                </div>
                <ul className="text-sm space-y-2 mb-6 text-white/70">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Lifetime access</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> All future updates</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Product Hunt Exclusive</li>
                </ul>
                <MagicButton 
                  variant="gold" 
                  className="w-full"
                  onClick={() => setStep(2)}
                >
                  Get Lifetime Deal
                </MagicButton>
              </div>
            </div>

            {/* No Credit Card Banner */}
            <p className="text-center text-sm text-white/50 mt-4">
              🔒 No credit card required for free trial • 30-day money-back guarantee
            </p>
          </>
        ) : (
          <>
            {/* Email Capture Step */}
            <div className="max-w-md mx-auto">
              <p className="text-white/80 text-center mb-6">
                Enter your email to continue to payment
              </p>
              
              <div className="space-y-4">
                <MagicButton 
                  variant="gold" 
                  size="lg"
                  className="w-full text-xl"
                  onClick={() => handleCheckout('lifetime')}
                  glow={true}
                >
                  <Crown className="h-6 w-6" />
                  Get Lifetime - $299
                </MagicButton>
                
                <MagicButton 
                  variant="ghost" 
                  size="lg"
                  className="w-full"
                  onClick={() => handleCheckout('pro')}
                >
                  <Zap className="h-6 w-6" />
                  Get Pro - $29/mo
                </MagicButton>
              </div>

              <button 
                onClick={() => setStep(1)}
                className="block mx-auto mt-4 text-sm text-white/60 hover:text-white"
              >
                ← Back to pricing
              </button>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  )
}

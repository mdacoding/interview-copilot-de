import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  trackPageView, 
  trackInterviewStart, 
  trackUpgradeClick, 
  trackSignup,
  trackPurchase,
  initPHAnalytics 
} from '../lib/ph-analytics'

export function usePHTracking() {
  const location = useLocation()

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  // Initialize PH analytics
  useEffect(() => {
    initPHAnalytics()
  }, [])

  // Helper to track interview starts
  const trackInterviewStarted = useCallback(() => {
    trackInterviewStart()
  }, [])

  // Helper to track upgrades
  const trackUpgrade = useCallback((plan) => {
    trackUpgradeClick(plan)
  }, [])

  // Helper to track purchases
  const trackPurchaseComplete = useCallback((plan, amount) => {
    trackPurchase(plan, amount)
  }, [])

  // Helper to track signups
  const trackSignupComplete = useCallback((method) => {
    trackSignup(method)
  }, [])

  return {
    trackInterviewStarted,
    trackUpgrade,
    trackPurchaseComplete,
    trackSignupComplete
  }
}

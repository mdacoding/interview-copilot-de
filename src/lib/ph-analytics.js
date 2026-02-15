/**
 * Product Hunt Analytics & Tracking
 * Track key events for PH launch optimization
 */

// Track PH-specific events
export function trackPHEvent(eventName, properties = {}) {
  // Product Hunt Pixel
  if (window.ph) {
    window.ph('track', eventName, properties)
  }
  
  // Console log for debugging
  console.log('[PH Analytics]', eventName, properties)
}

// Track page views
export function trackPageView(pageName) {
  trackPHEvent('PageView', { page: pageName })
}

// Track interview starts
export function trackInterviewStart() {
  trackPHEvent('interview_start', {
    timestamp: new Date().toISOString(),
    source: 'dashboard'
  })
}

// Track upgrade clicks
export function trackUpgradeClick(plan) {
  trackPHEvent('upgrade_click', {
    plan,
    price: plan === 'pro' ? 29 : 299,
    currency: 'USD'
  })
}

// Track successful payments
export function trackPurchase(plan, amount) {
  trackPHEvent('purchase', {
    plan,
    amount,
    currency: 'USD',
    timestamp: new Date().toISOString()
  })
}

// Track signups
export function trackSignup(method) {
  trackPHEvent('signup', {
    method, // 'email' or 'google'
    timestamp: new Date().toISOString()
  })
}

// Track waitlist signups
export function trackWaitlist(email) {
  trackPHEvent('waitlist_signup', {
    timestamp: new Date().toISOString()
  })
}

// Track share events
export function trackShare(platform) {
  trackPHEvent('share', {
    platform, // 'twitter', 'linkedin', 'facebook'
    url: window.location.href
  })
}

// Track A/B test variants
export function trackABTest(variant, experiment) {
  trackPHEvent('ab_test', {
    variant,
    experiment
  })
}

// Initialize PH pixel on load
export function initPHAnalytics() {
  if (typeof window !== 'undefined') {
    // Wait for PH pixel to load
    const checkPH = setInterval(() => {
      if (window.ph) {
        clearInterval(checkPH)
        trackPHEvent('Pageview')
      }
    }, 100)
    
    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkPH), 5000)
  }
}

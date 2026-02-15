import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility function to merge classes
function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Magic Button - Premium gradient with gold hover
export const MagicButton = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  glow = true,
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-hero-gradient text-white hover:shadow-glow-lg hover:scale-105',
    ghost: 'bg-glass backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 hover:border-white/40',
    gold: 'bg-gold-shimmer text-cosmic-indigo hover:shadow-glow-gold hover:scale-105 font-semibold',
    outline: 'border-2 border-brand-400 text-brand-400 hover:bg-brand-400 hover:text-white',
    destructive: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative overflow-hidden rounded-xl font-medium transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-cosmic-indigo',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Shimmer effect for gold variant */}
      {variant === 'gold' && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
      )}
      
      {/* Glow effect */}
      {glow && variant === 'primary' && (
        <span className="absolute -inset-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  )
})

MagicButton.displayName = 'MagicButton'

// Glass Card - Premium glassmorphism
export function GlassCard({ 
  children, 
  className,
  hover = true,
  glow = false,
  ...props 
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-white/60 dark:bg-black/40 backdrop-blur-xl',
        'border border-gray-200/50 dark:border-white/10',
        'shadow-lg dark:shadow-none',
        hover && 'hover:shadow-xl hover:border-gray-300/50 dark:hover:border-white/20',
        glow && 'hover:shadow-glow',
        className
      )}
      {...props}
    >
      {/* Inner gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

// Animated Gradient Text
export function GradientText({ 
  children, 
  className,
  gradient = 'hero-gradient'
}) {
  return (
    <span className={cn(
      'bg-clip-text text-transparent bg-gradient-to-r',
      gradient === 'hero-gradient' && 'from-brand-400 via-brand-500 to-brand-600',
      gradient === 'gold' && 'from-yellow-400 via-amber-500 to-yellow-400',
      className
    )}>
      {children}
    </span>
  )
}

// Animated Background
export function AnimatedBackground({ className, children }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-hero-gradient animate-gradient bg-[length:400%_400%] opacity-20" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Skeleton Loader
export function Skeleton({ className, ...props }) {
  return (
    <div 
      className={cn(
        'animate-pulse rounded-lg bg-white/10',
        className
      )} 
      {...props}
    />
  )
}

// Staggered Fade In Container
export function StaggeredFadeIn({ children, className, delay = 0.1 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

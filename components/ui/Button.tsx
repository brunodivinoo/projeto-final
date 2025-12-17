import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  loading?: boolean
}

export function Button({ children, variant = 'primary', loading, className = '', ...props }: ButtonProps) {
  const base = 'h-12 px-6 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50'

  const variants = {
    primary: 'bg-primary hover:bg-[#0f6ac6] text-white shadow-lg shadow-primary/20',
    secondary: 'bg-[#233648] hover:bg-[#2f465c] text-white',
    outline: 'border border-[#324d67] bg-[#192633] hover:bg-[#233648] text-white'
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  )
}

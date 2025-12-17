'use client'
import { InputHTMLAttributes, useState } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: string
  error?: string
}

export function Input({ label, icon, error, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-white text-sm font-medium">{label}</label>}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-[#92adc9] material-symbols-outlined text-xl">
            {icon}
          </span>
        )}
        <input
          {...props}
          type={isPassword && showPassword ? 'text' : type}
          className={`w-full h-12 rounded-lg border bg-[#111a22] text-white px-4
            ${icon ? 'pl-11' : ''} ${isPassword ? 'pr-11' : ''}
            border-[#324d67] focus:border-primary focus:ring-1 focus:ring-primary
            placeholder:text-[#92adc9] transition-colors outline-none
            ${error ? 'border-red-500' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[#92adc9] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
}

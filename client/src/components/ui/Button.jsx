import React from 'react';

export default function Button({
  children,
  variant = 'secondary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-void focus:ring-gold disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-gold text-void hover:bg-gold-dim active:scale-[0.98] shadow-glow-gold',
    secondary: 'bg-transparent border border-border text-text hover:bg-surface-raised hover:border-text-muted active:scale-[0.98]',
    danger: 'bg-red/20 border border-red/30 text-red hover:bg-red/30 hover:border-red active:scale-[0.98]',
    ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-surface-raised',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

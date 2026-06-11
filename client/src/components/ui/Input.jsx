import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  textarea = false,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  const inputStyles = `
    w-full bg-surface border border-border rounded-md px-3 py-2 text-text text-sm placeholder-text-faint
    transition-all duration-200 outline-none
    focus:border-gold focus:ring-1 focus:ring-gold
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-red focus:border-red focus:ring-red' : ''}
    ${className}
  `;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-medium text-text-muted tracking-wide uppercase">
          {label}
        </label>
      )}
      {textarea ? (
        <textarea
          ref={ref}
          className={inputStyles}
          rows={rows}
          {...props}
        />
      ) : (
        <input
          ref={ref}
          type={type}
          className={inputStyles}
          {...props}
        />
      )}
      {error && (
        <span className="text-xs text-red font-medium mt-0.5">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

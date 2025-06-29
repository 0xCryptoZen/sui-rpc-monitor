'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-sui-blue border-sui-blue text-white hover:bg-sui-teal hover:border-sui-teal focus:ring-sui-blue shadow-sm hover:shadow-md',
    secondary: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 shadow-sm hover:shadow-md',
    success: 'bg-status-healthy border-status-healthy text-white hover:bg-green-700 hover:border-green-700 focus:ring-status-healthy shadow-sm hover:shadow-md',
    danger: 'bg-status-error border-status-error text-white hover:bg-red-700 hover:border-red-700 focus:ring-status-error shadow-sm hover:shadow-md',
    warning: 'bg-status-warning border-status-warning text-white hover:bg-yellow-600 hover:border-yellow-600 focus:ring-status-warning shadow-sm hover:shadow-md',
    ghost: 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const fullWidthClass = fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidthClass} ${className}`;

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Icon Button Component
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  variant = 'ghost',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-sui-blue border-sui-blue text-white hover:bg-sui-teal hover:border-sui-teal focus:ring-sui-blue',
    secondary: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
    success: 'bg-status-healthy border-status-healthy text-white hover:bg-green-700 hover:border-green-700 focus:ring-status-healthy',
    danger: 'bg-status-error border-status-error text-white hover:bg-red-700 hover:border-red-700 focus:ring-status-error',
    warning: 'bg-status-warning border-status-warning text-white hover:bg-yellow-600 hover:border-yellow-600 focus:ring-status-warning',
    ghost: 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
  };

  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4'
  };

  const iconSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className={`animate-spin rounded-full border-b-2 border-current ${iconSizeClasses[size]}`}></div>
      ) : (
        <span className={iconSizeClasses[size]}>{icon}</span>
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';
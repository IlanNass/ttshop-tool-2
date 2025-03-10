import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  href?: string;
  isExternal?: boolean;
}

const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  href,
  isExternal = false,
  ...props
}: ButtonProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'outline':
        return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
      case 'ghost':
        return 'hover:bg-accent hover:text-accent-foreground';
      case 'link':
        return 'text-primary underline-offset-4 hover:underline p-0 h-auto';
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-9 px-3 text-sm rounded-md';
      case 'md':
        return 'h-10 px-4 py-2 rounded-md';
      case 'lg':
        return 'h-11 px-5 py-2.5 rounded-lg';
      default:
        return '';
    }
  };

  const buttonClasses = cn(
    'relative inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    getVariantClasses(),
    getSizeClasses(),
    fullWidth && 'w-full',
    className
  );

  const buttonContent = (
    <>
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </>
  );

  if (href) {
    if (isExternal) {
      return (
        <motion.a
          href={href}
          className={buttonClasses}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.98 }}
          whileHover={variant !== 'link' ? { scale: 1.03 } : undefined}
        >
          {buttonContent}
        </motion.a>
      );
    } else {
      return (
        <motion.div
          whileTap={{ scale: 0.98 }}
          whileHover={variant !== 'link' ? { scale: 1.03 } : undefined}
        >
          <Link to={href} className={buttonClasses}>
            {buttonContent}
          </Link>
        </motion.div>
      );
    }
  }

  return (
    <motion.button
      className={buttonClasses}
      whileTap={{ scale: 0.98 }}
      whileHover={variant !== 'link' ? { scale: 1.03 } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
};

export default Button;

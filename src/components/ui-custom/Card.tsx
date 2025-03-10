
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHover } from '@/lib/animations';

interface CardProps {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
}

const Card = ({
  className,
  title,
  description,
  children,
  footer,
  hover = false,
  onClick
}: CardProps) => {
  return (
    <motion.div
      className={cn(
        'rounded-xl border border-border bg-card p-6 shadow-sm',
        hover && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      initial="rest"
      whileHover={hover ? "hover" : undefined}
      variants={hover ? cardHover : undefined}
    >
      {title && (
        <div className="mb-4">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
          ) : (
            title
          )}
          {description && (
            <div className="mt-1 text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-4 border-t">{footer}</div>}
    </motion.div>
  );
};

export default Card;

'use client';

import { motion } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../badge';

interface FilterPillProps {
  label: string;
  value: string;
  count?: number;
  variant?: 'default' | 'active' | 'suggested' | 'premium';
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  icon?: React.ElementType;
  gradient?: string;
  isAnimated?: boolean;
}

const pillVariants = {
  initial: { 
    scale: 0.8, 
    opacity: 0,
    y: 20
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300
    }
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    x: -50,
    transition: {
      duration: 0.2
    }
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400
    }
  },
  tap: {
    scale: 0.95
  }
};

const variants = {
  default: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-700'
  },
  active: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50'
  },
  suggested: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
  },
  premium: {
    bg: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    hover: 'hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50'
  }
};

export default function FilterPill({
  label,
  value,
  count,
  variant = 'default',
  removable = false,
  onRemove,
  onClick,
  className = '',
  icon: Icon,
  gradient,
  isAnimated = true
}: FilterPillProps) {
  const variantStyles = variants[variant];
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  const pillContent = (
    <>
      {Icon && (
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      
      {label && (
        <span className="text-xs font-medium opacity-75">
          {label}:
        </span>
      )}
      
      <span className="text-sm font-medium">
        {value}
      </span>
      
      {count !== undefined && (
        <Badge 
          variant="secondary" 
          className="text-xs h-5 px-1.5 bg-white/50 dark:bg-gray-700/50"
        >
          {count.toLocaleString()}
        </Badge>
      )}
      
      {removable && onRemove && (
        <button
          onClick={handleRemove}
          className="flex items-center justify-center w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors ml-1"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </>
  );

  if (isAnimated) {
    return (
      <motion.div
        variants={pillVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover="hover"
        whileTap="tap"
        className={cn(
          "inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-200 select-none",
          gradient ? gradient : variantStyles.bg,
          variantStyles.text,
          variantStyles.border,
          gradient ? '' : variantStyles.hover,
          onClick && 'hover:shadow-md',
          className
        )}
        onClick={onClick}
      >
        {pillContent}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-200 select-none hover:scale-105 hover:-translate-y-0.5",
        gradient ? gradient : variantStyles.bg,
        variantStyles.text,
        variantStyles.border,
        gradient ? '' : variantStyles.hover,
        onClick && 'hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      {pillContent}
    </div>
  );
}
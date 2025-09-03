'use client';

import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterChipProps {
  label: string;
  value?: string;
  onRemove?: () => void;
  variant?: 'default' | 'active' | 'saved';
  removable?: boolean;
  className?: string;
}

export default function FilterChip({
  label,
  value,
  onRemove,
  variant = 'default',
  removable = true,
  className = ''
}: FilterChipProps) {
  const baseStyles = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200";
  
  const variantStyles = {
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    active: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    saved: "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <span>
        {label}
        {value && (
          <span className="font-normal opacity-75">
            : {value}
          </span>
        )}
      </span>
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label={`Remove ${label} filter`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}
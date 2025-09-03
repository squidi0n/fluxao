import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

// 🎨 Enhanced Badge Variants with Beautiful Design System
const badgeVariants = cva(
  'inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm hover:shadow-md hover:scale-105',
  {
    variants: {
      variant: {
        // ✨ Default - Beautiful sky gradient
        default: 'border-transparent bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sky-500/25 hover:shadow-sky-500/40',
        // 🌟 Secondary - Subtle slate
        secondary: 'border-transparent bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 hover:from-slate-200 hover:to-slate-300',
        // 🔥 Destructive - Modern red gradient
        destructive: 'border-transparent bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25 hover:shadow-red-500/40',
        // 📋 Outline - Clean border style
        outline: 'text-slate-700 border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-slate-50 hover:border-slate-300',
        // ✨ New enhanced variants
        success: 'border-transparent bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40',
        warning: 'border-transparent bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/25 hover:shadow-amber-500/40',
        purple: 'border-transparent bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-purple-500/25 hover:shadow-purple-500/40',
        indigo: 'border-transparent bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40',
        // 🔴 Live indicator
        live: 'border-transparent bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25 hover:shadow-green-500/40 animate-pulse',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

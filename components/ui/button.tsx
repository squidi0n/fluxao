import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

// 🎨 Enhanced Button Variants with Beautiful Design System
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 transform hover:scale-105',
  {
    variants: {
      variant: {
        // 🚀 Primary - Beautiful gradient with shadow
        default: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:from-sky-600 hover:to-blue-700 border-0',
        // 🔥 Destructive - Modern red gradient
        destructive: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:from-red-600 hover:to-rose-700 border-0',
        // 📋 Outline - Clean border with subtle hover
        outline: 'border-2 border-slate-200 bg-white hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:border-slate-300 text-slate-700 shadow-sm hover:shadow-md backdrop-blur-sm',
        // 🌟 Secondary - Subtle gradient
        secondary: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 hover:from-slate-200 hover:to-slate-300 shadow-sm hover:shadow-md border border-slate-200',
        // 👻 Ghost - Clean hover effect
        ghost: 'hover:bg-gradient-to-r hover:from-slate-100/50 hover:to-slate-200/50 hover:backdrop-blur-sm rounded-xl text-slate-700 hover:text-slate-900 hover:shadow-sm',
        // 🔗 Link - Enhanced underline
        link: 'text-sky-600 underline-offset-4 hover:underline hover:text-sky-700 rounded-xl px-2 py-1 hover:bg-sky-50',
        // ✨ New variants for enhanced design
        success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-green-700 border-0',
        warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:from-amber-600 hover:to-orange-700 border-0',
        purple: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:from-purple-600 hover:to-violet-700 border-0',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 rounded-lg px-4 text-sm',
        lg: 'h-14 rounded-2xl px-8 text-base font-bold',
        icon: 'h-11 w-11 rounded-xl',
        xs: 'h-7 rounded-lg px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };

import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '7xl';
  noPadding?: boolean;
}

export default function PageContainer({ 
  children, 
  className = '', 
  size = '7xl',
  noPadding = false
}: PageContainerProps) {
  const sizeClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md', 
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '7xl': 'max-w-7xl'
  };

  const paddingClasses = noPadding ? '' : 'px-4 sm:px-6 lg:px-8';

  return (
    <div className={`${sizeClasses[size]} mx-auto ${paddingClasses} ${className}`}>
      {children}
    </div>
  );
}
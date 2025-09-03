'use client';

import { useState, createContext, useContext, ReactNode } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (newToast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toastWithId = { ...newToast, id };
    setToasts((prev) => [...prev, toastWithId]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[300px] rounded-lg p-4 shadow-lg transition-all ${
              t.variant === 'destructive'
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 border'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{t.title}</h3>
                {t.description && <p className="text-sm mt-1 opacity-90">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-4 text-sm opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a dummy implementation if provider is missing
    return {
      toast: (toast: Omit<Toast, 'id'>) => {
        // console.log('Toast:', toast);
      },
      toasts: [],
      dismiss: () => {},
    };
  }
  return context;
}

// Export toast as a standalone function for convenience
export const toast = (toastData: Omit<Toast, 'id'>) => {
  // This is a simplified version for components that don't have access to the context
  // console.log('Toast:', toastData);

  // Create a temporary toast element
  const toastId = Math.random().toString(36).substr(2, 9);
  const toastElement = document.createElement('div');
  toastElement.className = `fixed bottom-4 right-4 z-50 min-w-[300px] rounded-lg p-4 shadow-lg transition-all ${
    toastData.variant === 'destructive'
      ? 'bg-red-500 text-white'
      : 'bg-white dark:bg-gray-800 border'
  }`;
  toastElement.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-semibold">${toastData.title}</h3>
        ${toastData.description ? `<p class="text-sm mt-1 opacity-90">${toastData.description}</p>` : ''}
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-sm opacity-70 hover:opacity-100">✕</button>
    </div>
  `;
  document.body.appendChild(toastElement);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toastElement.remove();
  }, 5000);
};

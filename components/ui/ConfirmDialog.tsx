import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<{
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setPending({ options, resolve });
    });
  }, []);

  const handleResponse = (val: boolean) => {
    pending?.resolve(val);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => handleResponse(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 p-5 border-b border-gray-100">
              {pending.options.danger !== false && (
                <div className="flex-shrink-0 w-9 h-9 bg-red-50 rounded-full flex items-center justify-center mt-0.5">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {pending.options.title && (
                  <h3 className="font-bold text-gray-900 mb-1">{pending.options.title}</h3>
                )}
                <p className="text-sm text-gray-600">{pending.options.message}</p>
              </div>
              <button
                onClick={() => handleResponse(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                onClick={() => handleResponse(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                {pending.options.cancelLabel || 'Cancelar'}
              </button>
              <button
                onClick={() => handleResponse(true)}
                className={`px-4 py-2 text-sm text-white rounded-lg font-bold transition-colors shadow-sm ${
                  pending.options.danger !== false
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-elio-yellow hover:bg-elio-yellow-hover'
                }`}
              >
                {pending.options.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};

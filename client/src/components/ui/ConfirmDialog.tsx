import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-amber-100 text-amber-600';
      case 'info':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-primary-100 text-primary-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full", getIconStyles())}>
            <AlertTriangle size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-medium leading-6 text-slate-900">{title}</h3>
            <div className="mt-2">
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
              getVariantStyles()
            )}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

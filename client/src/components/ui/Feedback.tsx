import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function Spinner({ size = 24, className, ...props }: SpinnerProps) {
  return (
    <div className={cn("flex justify-center items-center p-4", className)} {...props}>
      <Loader2 className="animate-spin text-primary-600" size={size} />
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 border-dashed">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

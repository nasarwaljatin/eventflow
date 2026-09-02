import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlerts, dismissAlert } from '../api/alerts';
import { AlertTriangle, Clock, X, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: alerts, isLoading, isError } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 30000,
  });

  const dismissMutation = useMutation({
    mutationFn: dismissAlert,
    onSuccess: () => {
      toast.success('Alert dismissed');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertCount'] });
    },
    onError: () => {
      toast.error('Failed to dismiss alert');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading alerts</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
          At-Capacity Alerts
        </h1>
        <p className="mt-1 text-sm text-slate-500">Manage sessions that have reached maximum capacity.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {alerts?.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-400 mb-3" />
            <p className="text-lg font-medium">All clear!</p>
            <p className="text-sm">There are currently no active alerts.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {alerts?.map((alert) => (
              <li key={alert.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">
                        {alert.session?.title} — {alert.session?.event?.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center font-medium text-slate-700">
                          {alert.session?.activeRegistrationsCount}/{alert.session?.capacity} seats filled
                        </span>
                        <span className="flex items-center">
                          <Clock className="mr-1.5 h-4 w-4 shrink-0 text-slate-400" />
                          Triggered {formatDistanceToNow(new Date(alert.triggeredAt))} ago
                        </span>
                      </div>
                      <div className="mt-3 flex gap-3">
                        <Link
                          to={`/sessions/${alert.sessionId}`}
                          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          View Session <ChevronRight className="ml-1 w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  {user?.role === 'ORGANIZER' && (
                    <button
                      onClick={() => dismissMutation.mutate(alert.id)}
                      disabled={dismissMutation.isPending}
                      className="inline-flex items-center rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      <X className="mr-1 w-3 h-3" /> Dismiss
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

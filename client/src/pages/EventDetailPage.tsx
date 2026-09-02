import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEventById, toggleArchive } from '../api/events';
import { getSessionsByEvent } from '../api/sessions';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { Edit, Archive, RefreshCw, Plus, Clock, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  });

  const { data: sessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => getSessionsByEvent(id!),
    enabled: !!id,
  });

  const archiveMutation = useMutation({
    mutationFn: (isArchived: boolean) => toggleArchive(id!, isArchived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(event?.isArchived ? 'Event restored' : 'Event archived');
    },
    onError: () => toast.error('Action failed'),
  });

  if (isEventLoading) return <div className="text-center py-12">Loading...</div>;
  if (!event) return <div className="text-center py-12">Event not found</div>;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/events" className="hover:text-primary-600">Events</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{event.name}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{event.name}</h1>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  event.isArchived ? "bg-slate-100 text-slate-800" : "bg-green-100 text-green-800"
                )}>
                  {event.isArchived ? 'Archived' : 'Active'}
                </span>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap">{event.description}</p>
            </div>
            
            {user?.role === 'ORGANIZER' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/events/${event.id}/edit`)}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => archiveMutation.mutate(!event.isArchived)}
                  disabled={archiveMutation.isPending}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
                    event.isArchived 
                      ? "bg-slate-600 hover:bg-slate-700 focus:ring-slate-500" 
                      : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  )}
                >
                  {event.isArchived ? <><RefreshCw size={16} /> Restore</> : <><Archive size={16} /> Archive</>}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-100">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Venue</h3>
              <p className="text-slate-900">{event.venue}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Date & Time</h3>
              <p className="text-slate-900">
                {format(new Date(event.startDate), 'PPp')} — {format(new Date(event.endDate), 'PPp')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Sessions</h2>
          {user?.role === 'ORGANIZER' && (
            <button
              onClick={() => navigate(`/events/${event.id}/sessions/new`)}
              className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Plus size={16} /> Add Session
            </button>
          )}
        </div>
        
        {isSessionsLoading ? (
          <div className="text-center py-8">Loading sessions...</div>
        ) : !sessions?.length ? (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-slate-500">No sessions available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const activeCount = session.activeRegistrationsCount ?? 0;
              const percentFull = Math.min(100, Math.round((activeCount / session.capacity) * 100));
              let barColor = 'bg-green-500';
              if (percentFull >= 90) barColor = 'bg-red-500';
              else if (percentFull >= 70) barColor = 'bg-yellow-500';

              return (
                <div key={session.id} className="border border-slate-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/events/${event.id}/sessions/${session.id}`} className="text-lg font-semibold text-primary-600 hover:underline">
                      {session.title}
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {format(new Date(session.startTime), 'PPp')} ({session.durationMinutes}m)
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      {session.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      {activeCount} / {session.capacity} Registered
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className={cn("h-2.5 rounded-full transition-all", barColor)} style={{ width: `${percentFull}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

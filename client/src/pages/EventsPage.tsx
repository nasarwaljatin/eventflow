import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getEvents } from '../api/events';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { Plus, CalendarX } from 'lucide-react';
import { cn } from '../lib/utils';
import { Spinner, EmptyState } from '../components/ui/Feedback';

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', showArchived],
    queryFn: () => getEvents(showArchived),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Show Archived
          </label>
          {user?.role === 'ORGANIZER' && (
            <Link
              to="/events/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Plus size={16} />
              Create Event
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <Spinner size={32} className="py-12" />
      ) : events?.length === 0 ? (
        <EmptyState 
          title="No events found" 
          description="There are currently no events matching your criteria."
          icon={<CalendarX size={48} />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/events/${event.id}`)}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">{event.name}</h3>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  event.isArchived ? "bg-slate-100 text-slate-800" : "bg-green-100 text-green-800"
                )}>
                  {event.isArchived ? 'Archived' : 'Active'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{event.description}</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p>📍 {event.venue}</p>
                <p>🗓️ {format(new Date(event.startDate), 'MMM d, yyyy')} - {format(new Date(event.endDate), 'MMM d, yyyy')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

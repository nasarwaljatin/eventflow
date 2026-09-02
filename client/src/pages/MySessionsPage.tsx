import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMySessions } from '../api/sessions';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Session } from '../types';

export default function MySessionsPage() {
  const { data: sessions, isLoading, error } = useQuery<Session[]>({
    queryKey: ['my-sessions'],
    queryFn: getMySessions
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading sessions</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Sessions</h1>
        <p className="text-slate-600 mt-1">Sessions you are assigned to manage.</p>
      </div>

      {!sessions?.length ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500">You are not assigned to any sessions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/events/${session.eventId}/sessions/${session.id}`}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow group"
            >
              <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary-600 transition-colors">
                {session.title}
              </h3>
              
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-slate-400" />
                  {format(new Date(session.startTime), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-2 text-slate-400" />
                  {format(new Date(session.startTime), 'h:mm a')} ({session.durationMinutes} min)
                </div>
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2 text-slate-400" />
                  {session.location}
                </div>
                <div className="flex items-center">
                  <Users size={16} className="mr-2 text-slate-400" />
                  {session.activeRegistrationsCount ?? 0} / {session.capacity} Registered
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

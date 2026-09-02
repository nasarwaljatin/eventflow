import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSessionById, updateSession } from '../api/sessions';
import { SessionFormData } from '../types';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().min(1, 'Start time is required'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  location: z.string().min(1, 'Location is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
});

type FormData = z.infer<typeof schema>;

export default function EditSessionPage() {
  const { id: eventId, sid: sessionId } = useParams<{ id: string; sid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', eventId, sessionId],
    queryFn: () => getSessionById(eventId!, sessionId!),
    enabled: !!eventId && !!sessionId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (session) {
      reset({
        title: session.title,
        startTime: new Date(session.startTime).toISOString().slice(0, 16),
        durationMinutes: session.durationMinutes,
        location: session.location,
        capacity: session.capacity,
      });
    }
  }, [session, reset]);

  const mutation = useMutation({
    mutationFn: (data: SessionFormData) => updateSession(eventId!, sessionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', eventId, sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', eventId] });
      toast.success('Session updated successfully');
      navigate(`/events/${eventId}/sessions/${sessionId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update session');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (isLoading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/events" className="hover:text-primary-600">Events</Link>
        <span className="mx-2">/</span>
        <Link to={`/events/${eventId}`} className="hover:text-primary-600">Event</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Edit Session</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Session</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Same form fields as CreateSessionPage */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                {...register('title')}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-slate-700">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  {...register('startTime')}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="durationMinutes" className="block text-sm font-medium text-slate-700">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  id="durationMinutes"
                  {...register('durationMinutes', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errors.durationMinutes && (
                  <p className="mt-1 text-sm text-red-600">{errors.durationMinutes.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  {...register('location')}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-slate-700">
                  Capacity
                </label>
                <input
                  type="number"
                  id="capacity"
                  {...register('capacity', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/events/${eventId}/sessions/${sessionId}`)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

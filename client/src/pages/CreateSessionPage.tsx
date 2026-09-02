
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSession } from '../api/sessions';
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

export default function CreateSessionPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      durationMinutes: 60,
      capacity: 10,
    }
  });

  const mutation = useMutation({
    mutationFn: (data: SessionFormData) => createSession(eventId!, data),
    onSuccess: () => {
      toast.success('Session created successfully');
      navigate(`/events/${eventId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create session');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/events" className="hover:text-primary-600">Events</Link>
        <span className="mx-2">/</span>
        <Link to={`/events/${eventId}`} className="hover:text-primary-600">Event Details</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">New Session</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Create New Session</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                onClick={() => navigate(`/events/${eventId}`)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {mutation.isPending ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

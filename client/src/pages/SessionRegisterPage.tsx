
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSessionById } from '../api/sessions';
import { createRegistration } from '../api/registrations';
import { RegistrationFormData } from '../types';
import toast from 'react-hot-toast';

const schema = z.object({
  attendeeName: z.string().min(1, 'Name is required'),
  attendeeEmail: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

export default function SessionRegisterPage() {
  const { id: eventId, sid: sessionId } = useParams<{ id: string; sid: string }>();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', eventId, sessionId],
    queryFn: () => getSessionById(eventId!, sessionId!),
    enabled: !!eventId && !!sessionId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: RegistrationFormData) => createRegistration(sessionId!, data),
    onSuccess: () => {
      toast.success('Registration created successfully');
      navigate(`/events/${eventId}/sessions/${sessionId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to register');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (isLoading) return <div className="text-center py-12">Loading...</div>;
  if (!session) return <div className="text-center py-12">Session not found</div>;

  const activeCount = session.activeRegistrationsCount ?? 0;
  const isFull = activeCount >= session.capacity;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to={`/events/${eventId}`} className="hover:text-primary-600">Event</Link>
        <span className="mx-2">/</span>
        <Link to={`/events/${eventId}/sessions/${sessionId}`} className="hover:text-primary-600">Session</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Register</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Register for Session</h1>
          <p className="text-slate-600 mb-6">{session.title}</p>
          
          {isFull ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              This session is currently full.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="attendeeName" className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="attendeeName"
                  {...register('attendeeName')}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errors.attendeeName && (
                  <p className="mt-1 text-sm text-red-600">{errors.attendeeName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="attendeeEmail" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  id="attendeeEmail"
                  {...register('attendeeEmail')}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errors.attendeeEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.attendeeEmail.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {mutation.isPending ? 'Registering...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

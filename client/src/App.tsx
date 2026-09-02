import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Layout from './components/layout/Layout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import EventDetailPage from './pages/EventDetailPage';
import CreateSessionPage from './pages/CreateSessionPage';
import EditSessionPage from './pages/EditSessionPage';
import SessionDetailPage from './pages/SessionDetailPage';
import SessionRegisterPage from './pages/SessionRegisterPage';
import MySessionsPage from './pages/MySessionsPage';
import RegistrationsPage from './pages/RegistrationsPage';
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/events/:id/sessions/:sid" element={<SessionDetailPage />} />
              <Route path="/events/:id/sessions/:sid/register" element={<SessionRegisterPage />} />
              <Route path="/registrations" element={<RegistrationsPage />} />
              
              <Route element={<RoleGuard allowedRoles={['CHECK_IN_STAFF']} />}>
                <Route path="/my-sessions" element={<MySessionsPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['ORGANIZER']} />}>
                <Route path="/events/new" element={<CreateEventPage />} />
                <Route path="/events/:id/edit" element={<EditEventPage />} />
                <Route path="/events/:id/sessions/new" element={<CreateSessionPage />} />
                <Route path="/events/:id/sessions/:sid/edit" element={<EditSessionPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;


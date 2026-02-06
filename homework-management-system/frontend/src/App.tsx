import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components/layout/Layout';
import { Login } from '@/pages/Login';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { AssignmentDetails } from '@/pages/AssignmentDetails';
import { CreateAssignment } from '@/pages/CreateAssignment';
import { StudentsPage } from '@/pages/StudentsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { NotFound } from '@/pages/NotFound';
import { Toaster } from '@/components/ui/toaster';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={
            user?.role === 'STUDENT' ? <StudentDashboard /> : <TeacherDashboard />
          } />
        </Route>

        <Route path="/assignments/:id" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AssignmentDetails />} />
        </Route>

        <Route path="/assignments/create" element={
          <ProtectedRoute allowedRole="TEACHER">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<CreateAssignment />} />
        </Route>

        <Route path="/students" element={
          <ProtectedRoute allowedRole="TEACHER">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentsPage />} />
        </Route>

        <Route path="/analytics" element={
          <ProtectedRoute allowedRole="ADMIN">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AnalyticsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <Toaster />
    </>
  );
}

export default App;

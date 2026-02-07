import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components/layout/Layout';
import { Login } from '@/pages/Login';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { AssignmentDetails } from '@/pages/AssignmentDetails';
import { CreateAssignment } from '@/pages/CreateAssignment';
import { StudentsPage } from '@/pages/StudentsPage';
import { StudentDetailPage } from '@/pages/StudentDetailPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SubmissionsPage } from '@/pages/SubmissionsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { EvaluationsPage } from '@/pages/EvaluationsPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { AttendanceJoinPage } from '@/pages/AttendanceJoinPage';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { StudentPortfolioPage } from '@/pages/StudentPortfolioPage';
import { PeerReviewPage } from '@/pages/PeerReviewPage';
import { TimelinePage } from '@/pages/TimelinePage';
import { ErrorBankPage } from '@/pages/ErrorBankPage';
import { TeacherResourcesPage } from '@/pages/TeacherResourcesPage';
import { TeacherWikiList, TeacherWikiDetailPage } from '@/pages/TeacherWikiPage';
import { InterventionPage } from '@/pages/InterventionPage';
import { MakeUpPage } from '@/pages/MakeUpPage';
import { NotFound } from '@/pages/NotFound';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string | string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role) {
    const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!allowed.includes(user.role)) {
      const fallback = user.role === 'STUDENT' ? '/student' : '/teacher';
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
}

function AssignmentDetailsKeyed() {
  const { id } = useParams<{ id: string }>();
  return <AssignmentDetails key={id} />;
}

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to={user?.role === 'STUDENT' ? '/student' : '/teacher'} replace />
            : <Login />
        } />

        <Route path="/" element={
          isAuthenticated
            ? <Navigate to={user?.role === 'STUDENT' ? '/student' : '/teacher'} replace />
            : <Navigate to="/login" replace />
        } />
        <Route path="/dashboard" element={
          <Navigate to={user?.role === 'STUDENT' ? '/student' : '/teacher'} replace />
        } />
        <Route path="/assignments" element={
          isAuthenticated
            ? <Navigate to={user?.role === 'STUDENT' ? '/student' : '/teacher'} replace />
            : <Navigate to="/login" replace />
        } />

        <Route path="/teacher" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<TeacherDashboard />} />
        </Route>

        <Route path="/student" element={
          <ProtectedRoute allowedRole="STUDENT">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
        </Route>

        <Route path="/assignments/create" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<CreateAssignment />} />
        </Route>

        <Route path="/assignments/:id" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AssignmentDetailsKeyed />} />
        </Route>

        <Route path="/students" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentsPage />} />
        </Route>

        <Route path="/students/:id" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDetailPage />} />
          <Route path="portfolio" element={<StudentPortfolioPage />} />
        </Route>

        <Route path="/analytics" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AnalyticsPage />} />
        </Route>

        <Route path="/submissions" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<SubmissionsPage />} />
        </Route>

        <Route path="/evaluations" element={
          <ProtectedRoute allowedRole="STUDENT">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<EvaluationsPage />} />
        </Route>

        <Route path="/attendance" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AttendancePage />} />
        </Route>

        <Route path="/attendance/join" element={
          <ProtectedRoute allowedRole="STUDENT">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AttendanceJoinPage />} />
        </Route>

        <Route path="/announcements" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AnnouncementsPage />} />
        </Route>

        <Route path="/portfolio" element={
          <ProtectedRoute allowedRole="STUDENT">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<PortfolioPage />} />
        </Route>

        <Route path="/makeup" element={
          <ProtectedRoute allowedRole="STUDENT">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<MakeUpPage />} />
        </Route>

        <Route path="/peer-review" element={
          <ProtectedRoute allowedRole="STUDENT">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<PeerReviewPage />} />
        </Route>

        <Route path="/timeline" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<TimelinePage />} />
        </Route>

        <Route path="/error-bank" element={
          <ProtectedRoute allowedRole="STUDENT">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<ErrorBankPage />} />
        </Route>

        <Route path="/teacher-resources" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<TeacherResourcesPage />} />
        </Route>

        <Route path="/teacher-wiki" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<TeacherWikiList />} />
          <Route path=":id" element={<TeacherWikiDetailPage />} />
        </Route>

        <Route path="/intervention" element={
          <ProtectedRoute allowedRole={['TEACHER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<InterventionPage />} />
        </Route>

        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <Toaster />
      <SonnerToaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}

export default App;

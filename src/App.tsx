import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/ui/toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout';
import {
  LoginPage,
  ForbiddenPage,
  DashboardPage,
  PassagesPage,
  NodesPage,
  QuestionsPage,
  TestModePage,
} from '@/pages';
import { VillagesPage } from '@/pages/VillagesPage';
import { CastlesPage } from '@/pages/CastlesPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Full-screen test mode (protected but no layout) */}
          <Route
            path="/nodes/:nodeId/test"
            element={
              <ProtectedRoute>
                <TestModePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boss/:bossId/test"
            element={
              <ProtectedRoute>
                <TestModePage />
              </ProtectedRoute>
            }
          />

          {/* Protected admin routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/villages" element={<VillagesPage />} />
            <Route path="/villages/:villageId/passages" element={<PassagesPage />} />
            <Route path="/castles" element={<CastlesPage />} />
            <Route path="/passages/:passageId/nodes" element={<NodesPage />} />
            <Route path="/nodes/:nodeId/questions" element={<QuestionsPage />} />
            <Route path="/boss/:bossId/questions" element={<QuestionsPage />} />
            {/* Legacy routes redirect */}
            <Route path="/buildings" element={<Navigate to="/villages" replace />} />
            <Route path="/buildings/:villageId/passages" element={<PassagesPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

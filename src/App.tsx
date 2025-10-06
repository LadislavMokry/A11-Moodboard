import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthCallback } from "@/pages/AuthCallback";
import BoardPage from "@/pages/BoardPage";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import ProfilePage from "@/pages/ProfilePage";
import PublicBoard from "@/pages/PublicBoard";
import Staging from "@/pages/Staging";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkStatusBanner />
        <Toaster position="top-center" />
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <Home />
              </ErrorBoundary>
            }
          />
          <Route
            path="/staging"
            element={
              <ErrorBoundary>
                <Staging />
              </ErrorBoundary>
            }
          />
          <Route
            path="/boards/:boardId"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <BoardPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/b/:shareToken"
            element={
              <ErrorBoundary>
                <PublicBoard />
              </ErrorBoundary>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ProfilePage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/callback"
            element={<AuthCallback />}
          />
          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

import Home from "@/pages/Home";
import Staging from "@/pages/Staging";
import BoardPage from "@/pages/BoardPage";
import PublicBoard from "@/pages/PublicBoard";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";
import { AuthCallback } from "@/pages/AuthCallback";
import { Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-center" />
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/staging"
          element={<Staging />}
        />
        <Route
          path="/boards/:boardId"
          element={(
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/b/:shareToken"
          element={<PublicBoard />}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          )}
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
  );
}

import Home from "@/pages/Home";
import UsersPage from "@/pages/UsersPage";
import { AuthCallback } from "@/pages/AuthCallback";
import { Link, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <header className="mb-6 flex gap-4 text-primary underline">
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
      </header>

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/users"
          element={<UsersPage />}
        />
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />
      </Routes>
    </div>
  );
}

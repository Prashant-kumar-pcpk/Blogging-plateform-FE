import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Header from "./components/layout/Header";
import LoadingScreen from "./components/common/LoadingScreen";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { apiFetch } from "./api/api";
import { isTokenExpired, parseStoredSession, saveStoredSession } from "./utils/session";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import EditorPage from "./pages/EditorPage";
import PostDetailsPage from "./pages/PostDetailsPage";
import AuthorPage from "./pages/AuthorPage";

function App() {
  const [session, setSession] = useState(parseStoredSession);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = session.token;
  const user = session.user;

  const persistSession = (nextSession) => {
    setSession(nextSession);
    saveStoredSession(nextSession);
  };

  const clearSession = () => persistSession({ token: "", user: null });

  const loadBootstrap = async () => {
    try {
      setLoading(true);
      const [postData, categoryData, tagData] = await Promise.all([
        apiFetch("/posts"),
        apiFetch("/categories"),
        apiFetch("/tags"),
      ]);

      setPosts(postData);
      setCategories(categoryData);
      setTags(tagData);

      if (token && !isTokenExpired(token)) {
        const [me, mySubscriptions] = await Promise.all([
          apiFetch("/auth/me", { token }),
          apiFetch("/subscriptions", { token }),
        ]);
        persistSession({ token, user: me });
        setSubscriptions(mySubscriptions);
      } else {
        setSubscriptions([]);
        if (token) {
          clearSession();
        }
      }

      setError("");
    } catch (requestError) {
      if (token) {
        clearSession();
      }
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appState = {
    token,
    user,
    posts,
    categories,
    tags,
    subscriptions,
    setPosts,
    setCategories,
    setTags,
    setSubscriptions,
    refresh: loadBootstrap,
    persistSession,
    clearSession,
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-sand text-ink">
      <AppShell appState={appState} />
      {error ? (
        <div className="fixed bottom-4 right-4 rounded-2xl bg-coral px-4 py-3 text-sm text-white shadow-card">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function AppShell({ appState }) {
  const location = useLocation();

  return (
    <>
      <Header appState={appState} />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage appState={appState} />} />
          <Route path="/auth" element={<AuthPage appState={appState} />} />
          <Route path="/auth/login" element={<LoginPage appState={appState} />} />
          <Route path="/auth/register" element={<RegisterPage appState={appState} />} />
          <Route
            path="/editor"
            element={
              <ProtectedRoute user={appState.user}>
                <EditorPage appState={appState} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:postId"
            element={
              <ProtectedRoute user={appState.user}>
                <EditorPage appState={appState} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={appState.user}>
                <DashboardPage appState={appState} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute user={appState.user}>
                <ChangePasswordPage appState={appState} />
              </ProtectedRoute>
            }
          />
          <Route path="/posts/:slug" element={<PostDetailsPage appState={appState} />} />
          <Route path="/authors/:username" element={<AuthorPage appState={appState} />} />
          <Route path="*" element={<Navigate to={location.pathname === "/" ? "/" : "/"} replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;

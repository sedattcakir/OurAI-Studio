import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { JobsProvider } from "./contexts/JobsContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TextGeneration from "./pages/TextGeneration";
import ImageGeneration from "./pages/ImageGeneration";
import VoiceSynthesis from "./pages/VoiceSynthesis";
import SpeechRecognition from "./pages/SpeechRecognition";
import VideoGeneration from "./pages/VideoGeneration";
import AvatarGeneration from "./pages/AvatarGeneration";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import PricingPage from "./pages/PricingPage";
import RegisterPage from "./pages/RegisterPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <JobsProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="text" element={<TextGeneration />} />
          <Route path="image" element={<ImageGeneration />} />
          <Route path="voice" element={<VoiceSynthesis />} />
          <Route path="speech" element={<SpeechRecognition />} />
          <Route path="video" element={<VideoGeneration />} />
          <Route path="avatar" element={<AvatarGeneration />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      </JobsProvider>
    </AuthProvider>
  );
}

export default App;

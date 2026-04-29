/**
 * App Module
 *
 * Responsibilities:
 * - Define the root routing structure of the application
 * - Map URL paths to page components
 *
 * Boundaries:
 * - Does not handle global state providers (managed in main.tsx)
 */

import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Viewer from "./pages/Viewer";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import { PasscodeOverlay } from "../features/auth/PasscodeOverlay";
import { useAuth } from "../hooks/useAuth";

/** Root application component with core routing configuration */
export default function App() {
  const { isUnlocked, unlock, login, error } = useAuth();

  if (!isUnlocked) {
    return <PasscodeOverlay onVerify={unlock} onLogin={login} error={error} />;
  }

  return (
    <Routes>
      <Route path="/*" element={<Home />} />
      <Route path="/viewer" element={<Viewer />} />
      <Route path="/player/:provider/:id/*" element={<VideoPlayerPage />} />
    </Routes>
  );
}
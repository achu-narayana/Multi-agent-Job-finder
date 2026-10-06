import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { MotionConfig } from "motion/react";
import { Shell } from "./components/Shell";
import { Company } from "./pages/Company";
import { Dashboard } from "./pages/Dashboard";
import { Outreach } from "./pages/Outreach";
import { Pipeline } from "./pages/Pipeline";
import { Profile } from "./pages/Profile";
import { Referrals } from "./pages/Referrals";
import { Startups } from "./pages/Startups";
import { StoreProvider } from "./state/store";

// The hosted build has no server to route deep links, so it keeps the route in memory.
const Router = import.meta.env.MODE === "artifact" ? MemoryRouter : BrowserRouter;

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <Router>
          <AppRoutes />
        </Router>
      </StoreProvider>
    </MotionConfig>
  );
}

/** Routes get an explicit location so the page animating out keeps rendering its own route. */
function AppRoutes() {
  const location = useLocation();
  return (
    <Shell>
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/startups" element={<Startups />} />
        <Route path="/startups/:id" element={<Company />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/outreach" element={<Outreach />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

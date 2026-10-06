import { useState } from "react";
import { MotionConfig } from "motion/react";
import { Nav } from "./components/Nav";
import { Hero } from "./sections/Hero";
import { JobBoard } from "./sections/JobBoard";
import { Pipeline } from "./sections/Pipeline";
import { AgentFlow } from "./sections/AgentFlow";
import { Footer } from "./sections/Footer";

export function App() {
  const [query, setQuery] = useState("");

  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main>
        <Hero onSearch={setQuery} />
        <JobBoard query={query} />
        <Pipeline />
        <AgentFlow />
      </main>
      <Footer />
    </MotionConfig>
  );
}

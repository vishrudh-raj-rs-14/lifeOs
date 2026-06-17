import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgb(9,9,11)", minHeight: "100vh" }}>
      <Sidebar />
      {/*
        .app-main and .app-content are defined in globals.css (not Tailwind JIT)
        to guarantee the sidebar offset margin is always applied.
      */}
      <main className="app-main">
        <div className="app-content">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

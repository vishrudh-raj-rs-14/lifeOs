"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Scale, Footprints, Dumbbell, Target, Code2,
  BookOpen, Brain, Clock, Monitor, TrendingUp, FileText, LogOut, Zap,
  ListChecks,
} from "lucide-react";

const groups = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard",    icon: LayoutDashboard },
      { href: "/goals",     label: "Daily Goals",  icon: Target },
      { href: "/habits",    label: "Daily Habits", icon: ListChecks },
    ],
  },
  {
    label: "Body",
    items: [
      { href: "/gym",    label: "Gym & Workouts", icon: Dumbbell   },
      { href: "/weight", label: "Weight",         icon: Scale      },
      { href: "/steps",  label: "Steps",          icon: Footprints },
    ],
  },
  {
    label: "Mind",
    items: [
      { href: "/codeforces",  label: "Codeforces",   icon: Code2    },
      { href: "/deep-work",   label: "Deep Work",    icon: Clock    },
      { href: "/learning",    label: "Learning Log", icon: Brain    },
      { href: "/reading",     label: "Reading",      icon: BookOpen },
    ],
  },
  {
    label: "Review",
    items: [
      { href: "/screen-time",   label: "Screen Time",   icon: Monitor  },
      { href: "/weekly-review", label: "Weekly Review", icon: FileText },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 z-30 h-screen overflow-hidden"
      style={{
        width: "280px",
        background: "rgb(11,11,14)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-7 pt-8 pb-6">
        <div
          className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
            boxShadow: "0 8px 24px -4px rgba(109,40,217,0.5)",
          }}
        >
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-white leading-tight tracking-tight">LifeOS</p>
          <p className="text-[11px] leading-tight" style={{ color: "rgb(80,80,95)" }}>habit tracker</p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "pt-5" : ""}>
            {group.label && (
              <p
                className="px-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "rgb(65,65,80)" }}
              >
                {group.label}
              </p>
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-3.5 h-10 px-4 rounded-xl text-[13.5px] font-medium transition-all duration-100 group",
                    active
                      ? "text-white"
                      : "text-[rgb(115,115,130)] hover:text-[rgb(200,200,215)] hover:bg-white/[0.04]"
                  )}
                  style={active ? { background: "rgba(139,92,246,0.1)" } : {}}
                >
                  {/* Left accent bar */}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                      style={{ background: "rgb(139,92,246)" }}
                    />
                  )}
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={cn(
                      "flex-shrink-0",
                      active ? "text-violet-400" : "text-[rgb(75,75,90)] group-hover:text-[rgb(140,140,155)]"
                    )}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Sign out ── */}
      <div className="px-4 py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 h-10 px-4 w-full rounded-xl text-[13.5px] text-[rgb(95,95,110)] hover:text-red-400 hover:bg-red-500/[0.07] transition-all duration-100"
        >
          <LogOut size={15} strokeWidth={1.8} className="flex-shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Target, Dumbbell, Code2, MoreHorizontal } from "lucide-react";
import { useState } from "react";

const primary = [
  { href: "/dashboard", label: "Home",  icon: LayoutDashboard },
  { href: "/goals",     label: "Goals", icon: Target },
  { href: "/gym",       label: "Gym",   icon: Dumbbell },
  { href: "/codeforces",label: "CF",    icon: Code2 },
];

const more = [
  { href: "/habits",        label: "Daily Habits" },
  { href: "/weight",        label: "Weight" },
  { href: "/steps",         label: "Steps" },
  { href: "/deep-work",     label: "Deep Work" },
  { href: "/learning",      label: "Learning Log" },
  { href: "/reading",       label: "Reading" },
  { href: "/screen-time",   label: "Screen Time" },
  { href: "/weekly-review", label: "Weekly Review" },
];

export function BottomNav() {
  const pathname   = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute bottom-[76px] left-4 right-4 rounded-2xl overflow-hidden animate-scale-in"
            style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {more.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-5 h-12 text-[14px] transition-colors",
                    "border-b last:border-0",
                    active
                      ? "text-violet-400 font-medium"
                      : "text-[rgb(180,180,195)] active:bg-white/[0.03]"
                  )}
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(9,9,11,0.92)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex h-16 items-center">
          {primary.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 2.2 : 1.6}
                  className={active ? "text-violet-400" : "text-[rgb(75,75,88)]"}
                />
                <span className={cn(
                  "text-[10px] font-medium",
                  active ? "text-violet-400" : "text-[rgb(75,75,88)]"
                )}>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
          >
            <MoreHorizontal
              size={21}
              strokeWidth={1.6}
              className={open ? "text-violet-400" : "text-[rgb(75,75,88)]"}
            />
            <span className={cn(
              "text-[10px] font-medium",
              open ? "text-violet-400" : "text-[rgb(75,75,88)]"
            )}>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

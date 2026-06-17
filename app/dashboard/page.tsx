import { AppShell } from "@/components/layout/app-shell";
import { db } from "@/lib/db";
import { format, startOfWeek, endOfWeek } from "date-fns";
import {
  Scale, Footprints, Dumbbell, Clock, Target, Code2,
  Flame, TrendingUp, ArrowRight, CheckCircle2, Circle,
} from "lucide-react";
import Link from "next/link";
import { cn, minutesToHours } from "@/lib/utils";

export const revalidate = 0;

export default async function DashboardPage() {
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(today,   { weekStartsOn: 1 });

  const [
    todayWeight, todaySteps, todayGym, todayGoals,
    todayDeepWork, todayCfProblems, weekGym, weekCf, streak,
  ] = await Promise.all([
    db.dailyWeight.findUnique({ where: { date: today } }),
    db.steps.findUnique({ where: { date: today } }),
    db.gymDay.findUnique({ where: { date: today } }),
    db.dailyGoal.findMany({ where: { date: today }, orderBy: { position: "asc" } }),
    db.deepWork.findUnique({ where: { date: today } }),
    db.cfProblem.findMany({ where: { date: today } }),
    db.gymDay.findMany({ where: { date: { gte: weekStart, lte: weekEnd }, didGo: true } }),
    db.cfProblem.findMany({ where: { date: { gte: weekStart, lte: weekEnd } } }),
    db.goalStreak.findFirst(),
  ]);

  const goalsDone = todayGoals.filter((g) => g.completed).length;
  const goalsPct  = todayGoals.length > 0 ? Math.round((goalsDone / todayGoals.length) * 100) : 0;
  const dateLabel = format(today, "EEEE, MMMM d");

  return (
    <AppShell>
      {/* ── Header ── */}
      <div className="mb-12">
        <p className="text-[13px] mb-2 font-medium" style={{ color: "rgb(90,90,108)" }}>
          {dateLabel}
        </p>
        <h1 className="text-[32px] font-bold text-white tracking-tight leading-none">
          Good {getGreeting()}, Vishrudh
        </h1>
      </div>

      {/* ── Streak + Quick metrics row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
        {/* Streak */}
        <div
          className="sm:col-span-1 rounded-2xl p-6 flex flex-col justify-between"
          style={{
            background: "linear-gradient(135deg, rgba(109,40,217,0.18), rgba(139,92,246,0.06))",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <Flame size={22} className="text-violet-400 mb-4" />
          <div>
            <p className="text-[36px] font-bold text-white leading-none tabular-nums">
              {streak?.currentStreak ?? 0}
            </p>
            <p className="text-[13px] font-medium mt-1.5" style={{ color: "rgb(150,130,210)" }}>
              day goal streak
            </p>
            <p className="text-[11.5px] mt-1" style={{ color: "rgb(100,90,140)" }}>
              best: {streak?.longestStreak ?? 0} days
            </p>
          </div>
        </div>

        {/* Gym this week */}
        <WeekMetric
          href="/gym"
          icon={<Dumbbell size={18} />}
          label="Gym this week"
          value={`${weekGym.length} / 5`}
          pct={Math.min((weekGym.length / 5) * 100, 100)}
          done={weekGym.length >= 5}
        />

        {/* CF this week */}
        <WeekMetric
          href="/codeforces"
          icon={<Code2 size={18} />}
          label="Problems solved"
          value={weekCf.length.toString()}
          pct={Math.min((weekCf.length / 7) * 100, 100)}
          done={weekCf.length >= 7}
        />
      </div>

      {/* ── Today ── */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <SectionLabel>Today</SectionLabel>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <TodayCard href="/weight"     icon={<Scale size={17} />}     label="Weight"
            value={todayWeight ? `${todayWeight.weightKg} kg` : "—"}
            logged={!!todayWeight} />
          <TodayCard href="/steps"      icon={<Footprints size={17} />} label="Steps"
            value={todaySteps ? todaySteps.count.toLocaleString() : "—"}
            logged={!!todaySteps} />
          <TodayCard href="/gym"        icon={<Dumbbell size={17} />}   label="Gym"
            value={todayGym ? (todayGym.didGo ? "Done" : "Rest day") : "—"}
            logged={!!todayGym} neutral={todayGym ? !todayGym.didGo : false} />
          <TodayCard href="/deep-work"  icon={<Clock size={17} />}      label="Deep Work"
            value={todayDeepWork ? minutesToHours(todayDeepWork.minutes) : "—"}
            logged={!!todayDeepWork} />
          <TodayCard href="/codeforces" icon={<Code2 size={17} />}      label="Codeforces"
            value={todayCfProblems.length > 0 ? `${todayCfProblems.length} solved` : "—"}
            logged={todayCfProblems.length >= 1} />
          <TodayCard href="/goals"      icon={<Target size={17} />}     label="Goals"
            value={todayGoals.length > 0 ? `${goalsDone} / ${todayGoals.length}` : "—"}
            logged={todayGoals.length > 0 && goalsDone === todayGoals.length}
            extra={todayGoals.length > 0 && (
              <div className="mt-4">
                <div className="h-1 rounded-full w-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${goalsPct}%`, background: "rgb(139,92,246)" }}
                  />
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: "rgb(90,90,110)" }}>{goalsPct}% complete</p>
              </div>
            )} />
        </div>
      </div>

      {/* ── Today's Goals ── */}
      {todayGoals.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <SectionLabel>Today&apos;s Goals</SectionLabel>
            <Link
              href="/goals"
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              All goals <ArrowRight size={12} />
            </Link>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgb(16,16,20)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {todayGoals.map((g, i) => (
              <div
                key={g.id}
                className="flex items-center gap-4 px-6 py-4"
                style={i < todayGoals.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}
              >
                {g.completed
                  ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                  : <Circle size={18} className="flex-shrink-0" style={{ color: "rgb(55,55,70)" }} />
                }
                <span
                  className={cn("text-[14px] leading-snug", g.completed && "line-through")}
                  style={{ color: g.completed ? "rgb(65,65,80)" : "rgb(210,210,225)" }}
                >
                  {g.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── This week extra stats ── */}
      <div>
        <SectionLabel>This Week</SectionLabel>
        <div className="grid grid-cols-3 gap-5">
          <MiniStat href="/gym"      label="Gym days"    value={`${weekGym.length}/5`}    done={weekGym.length >= 5} />
          <MiniStat href="/codeforces" label="CF solved" value={`${weekCf.length}`}       done={weekCf.length >= 7} />
          <MiniStat href="/goals"    label="Streak"      value={`${streak?.currentStreak ?? 0}d`} done={!!(streak?.currentStreak)} />
        </div>
      </div>
    </AppShell>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(65,65,82)" }}>
      {children}
    </p>
  );
}

function WeekMetric({ href, icon, label, value, pct, done }: {
  href: string; icon: React.ReactNode; label: string;
  value: string; pct: number; done: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl p-6 flex flex-col justify-between transition-all hover:brightness-110"
      style={{ background: "rgb(16,16,20)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-5"
        style={{ background: "rgba(255,255,255,0.05)", color: done ? "rgb(52,211,153)" : "rgb(120,120,140)" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[26px] font-bold text-white tabular-nums leading-none">{value}</p>
        <p className="text-[12px] mt-1.5 mb-3" style={{ color: "rgb(90,90,108)" }}>{label}</p>
        <div className="h-1 rounded-full w-full" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: done ? "rgb(52,211,153)" : "rgb(139,92,246)" }}
          />
        </div>
      </div>
    </Link>
  );
}

function TodayCard({ href, icon, label, value, logged, neutral, extra }: {
  href: string; icon: React.ReactNode; label: string; value: string;
  logged?: boolean; neutral?: boolean; extra?: React.ReactNode;
}) {
  const colors = logged && !neutral
    ? { bg: "rgba(52,211,153,0.05)", border: "rgba(52,211,153,0.12)", icon: "rgb(52,211,153)" }
    : neutral
      ? { bg: "rgba(96,165,250,0.04)", border: "rgba(96,165,250,0.1)",  icon: "rgb(96,165,250)" }
      : { bg: "rgb(16,16,20)",          border: "rgba(255,255,255,0.06)", icon: "rgb(65,65,82)"   };

  return (
    <Link
      href={href}
      className="block rounded-2xl p-5 transition-all duration-150 hover:brightness-105"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <div className="mb-4" style={{ color: colors.icon }}>{icon}</div>
      <p className="text-[12px] font-medium mb-2" style={{ color: "rgb(95,95,112)" }}>{label}</p>
      <p className="text-[18px] font-bold text-white tabular-nums tracking-tight leading-tight">{value}</p>
      {extra}
    </Link>
  );
}

function MiniStat({ href, label, value, done }: {
  href: string; label: string; value: string; done: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl p-5 transition-all hover:brightness-110"
      style={{ background: "rgb(16,16,20)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="text-[24px] font-bold tabular-nums tracking-tight" style={{ color: done ? "rgb(52,211,153)" : "white" }}>
        {value}
      </p>
      <p className="text-[12px] mt-1.5" style={{ color: "rgb(85,85,102)" }}>{label}</p>
    </Link>
  );
}

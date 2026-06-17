"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { todayStr, formatShortDate, minutesToHours } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { ActivityHeatmap, RED_COLORS } from "@/components/ui/activity-heatmap";
import { Monitor, Plus, Play } from "lucide-react";

interface ScreenTimeEntry {
  id: number;
  date: string;
  youtubeMinutes: number;
  socialMediaMinutes: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "white" }} className="px-4 py-3 text-sm">
        <p className="text-[rgb(120,120,135)] mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.fill }} className="font-medium">
            {p.name}: {minutesToHours(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ScreenTimePage() {
  const [entries, setEntries] = useState<ScreenTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [yt, setYt] = useState("");
  const [social, setSocial] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/screen-time");
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/screen-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        youtubeMinutes: parseInt(yt || "0"),
        socialMediaMinutes: parseInt(social || "0"),
      }),
    });
    setSaving(false);
    setShowModal(false);
    setYt(""); setSocial("");
    fetchData();
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last30 = sorted.slice(-30);
  const chartData = last30.map((e) => ({
    date: formatShortDate(parseISO(e.date)),
    YouTube: e.youtubeMinutes,
    "Social Media": e.socialMediaMinutes,
  }));

  const heatmapData: Record<string, number> = {};
  for (const e of entries) heatmapData[e.date] = e.youtubeMinutes + e.socialMediaMinutes;

  const todayEntry = entries.find((e) => e.date === todayStr());
  const avgYt = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.youtubeMinutes, 0) / entries.length) : 0;
  const avgSocial = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.socialMediaMinutes, 0) / entries.length) : 0;

  return (
    <AppShell>
      <PageHeader
        title="Screen Time"
        description="Track YouTube and social media usage"
        action={
          <Button variant="primary" onClick={() => setShowModal(true)} size="sm">
            <Plus size={14} /> Log Today
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 section-gap">
        <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl p-6">
          <Play size={16} className="text-red-400 mb-2" />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "rgb(70,70,85)" }}>YouTube Today</p>
          <p className="text-xl font-bold text-white tabular-nums tracking-tight">{todayEntry ? minutesToHours(todayEntry.youtubeMinutes) : "—"}</p>
        </div>
        <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl p-6">
          <Monitor size={16} className="text-violet-400 mb-2" />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "rgb(70,70,85)" }}>Social Today</p>
          <p className="text-xl font-bold text-white tabular-nums tracking-tight">{todayEntry ? minutesToHours(todayEntry.socialMediaMinutes) : "—"}</p>
        </div>
        <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl p-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "rgb(70,70,85)" }}>Avg YouTube</p>
          <p className="text-xl font-bold text-red-400 tabular-nums tracking-tight">{avgYt > 0 ? minutesToHours(avgYt) : "—"}</p>
        </div>
        <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl p-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "rgb(70,70,85)" }}>Avg Social</p>
          <p className="text-xl font-bold text-violet-400 tabular-nums tracking-tight">{avgSocial > 0 ? minutesToHours(avgSocial) : "—"}</p>
        </div>
      </div>

      <div className="section-gap">
        <ActivityHeatmap
          data={heatmapData}
          title="Screen Time Activity (more red = more time)"
          colors={RED_COLORS}
          getLevel={(v) => v === 0 ? 0 : v < 30 ? 1 : v < 60 ? 2 : v < 120 ? 3 : 4}
          tooltipLabel={(v, d) => v === 0 ? `${d}: not logged` : `${d}: ${minutesToHours(v)} total`}
        />
      </div>

      {chartData.length > 1 && (
        <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl section-gap">
          <div className="px-6 pt-5 pb-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>Daily Usage (last 30 days)</p>
          </div>
          <div className="px-4 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} />
                <YAxis tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} tickFormatter={(v) => `${Math.floor(v / 60)}h`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: "rgb(120,120,135)", fontSize: "12px" }}>{value}</span>}
                />
                <Bar dataKey="YouTube" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Social Media" stackId="a" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl">
        <div className="px-6 pt-5 pb-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>History</p>
        </div>
        <div className="px-6 pb-5">
          {loading ? (
            <p className="text-sm" style={{ color: "rgb(120,120,135)" }}>Loading...</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-10">
              <Monitor size={40} className="mx-auto mb-3" style={{ color: "rgb(50,50,62)" }} />
              <p className="text-sm" style={{ color: "rgb(80,80,95)" }}>No entries yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3.5 border-b border-white/[0.04] last:border-0">
                  <p className="text-sm text-[rgb(210,210,220)]">{format(parseISO(e.date), "EEE, MMM d yyyy")}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-red-400">{minutesToHours(e.youtubeMinutes)} YT</span>
                    <span className="text-violet-400">{minutesToHours(e.socialMediaMinutes)} SM</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Screen Time">
        <div className="space-y-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            label="YouTube (minutes)"
            type="number"
            placeholder="0"
            value={yt}
            onChange={(e) => setYt(e.target.value)}
          />
          <Input
            label="Social Media (minutes)"
            type="number"
            placeholder="0"
            value={social}
            onChange={(e) => setSocial(e.target.value)}
          />
          <p className="text-xs" style={{ color: "rgb(120,120,135)" }}>Include Instagram, Twitter, Reddit, TikTok, etc.</p>
          <Button variant="primary" onClick={handleSave} loading={saving} className="w-full">Save</Button>
        </div>
      </Modal>
    </AppShell>
  );
}

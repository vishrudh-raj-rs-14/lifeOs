"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityHeatmap } from "@/components/ui/activity-heatmap";
import { format, parseISO, differenceInDays, subDays } from "date-fns";
import { todayStr, formatShortDate } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Scale, Plus, Trash2, Camera, ImageIcon, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface WeightEntry { id: number; date: string; weightKg: number }
interface WeeklyAvg { weekStart: string; avg: number; count: number; end: string }
interface WeightPhoto { id: number; date: string; filename: string; url: string }

interface MilestonePhoto {
  label: string;
  sublabel: string;
  photo: WeightPhoto | null;
  weight: number | null;
}


function findClosest(photos: WeightPhoto[], targetDate: Date): WeightPhoto | null {
  if (!photos.length) return null;
  return photos.reduce((best, p) => {
    const bDiff = Math.abs(differenceInDays(parseISO(best.date), targetDate));
    const pDiff = Math.abs(differenceInDays(parseISO(p.date), targetDate));
    return pDiff < bDiff ? p : best;
  });
}

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weeklyAverages, setWeeklyAverages] = useState<WeeklyAvg[]>([]);
  const [photos, setPhotos] = useState<WeightPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<WeightPhoto | null>(null);
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [chartRange, setChartRange] = useState<"1W" | "1M" | "3M" | "6M" | "1Y" | "ALL">("3M");
  const [photoDate, setPhotoDate] = useState(todayStr());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    const [wRes, pRes] = await Promise.all([
      fetch("/api/weight"),
      fetch("/api/weight/photos"),
    ]);
    const wData = await wRes.json();
    const pData = await pRes.json();
    setEntries(wData.entries || []);
    setWeeklyAverages(wData.weeklyAverages || []);
    setPhotos(pData.photos || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSave() {
    if (!weight || !date) return;
    setSaving(true);
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, weightKg: parseFloat(weight) }),
    });
    setSaving(false);
    setShowModal(false);
    setWeight("");
    fetchData();
  }

  async function handleDelete(id: number) {
    await fetch("/api/weight", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle HEIC client-side conversion
    let processedFile = file;
    if (file.type === "image/heic" || file.type === "image/heif" || /\.heic$/i.test(file.name)) {
      try {
        const heic2any = (await import("heic2any")).default;
        const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 }) as Blob;
        processedFile = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
      } catch {
        // If conversion fails, let server handle it
      }
    }

    setPhotoFile(processedFile);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(processedFile);
  }

  async function handlePhotoUpload() {
    if (!photoFile) return;
    setUploadingPhoto(true);
    const form = new FormData();
    form.append("photo", photoFile);
    form.append("date", photoDate);
    await fetch("/api/weight/photos", { method: "POST", body: form });
    setUploadingPhoto(false);
    setShowPhotoModal(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    fetchData();
  }

  async function handleDeletePhoto(id: number) {
    await fetch("/api/weight/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  // Weight lookup by date
  const weightByDate: Record<string, number> = {};
  for (const e of entries) weightByDate[e.date] = e.weightKg;

  // Milestone comparison photos
  const today = new Date();
  const milestones: MilestonePhoto[] = [];
  if (photos.length >= 2) {
    const first = photos[0];
    const latest = photos[photos.length - 1];
    const daysOfData = differenceInDays(parseISO(latest.date), parseISO(first.date));

    milestones.push({
      label: "First",
      sublabel: format(parseISO(first.date), "MMM d, yyyy"),
      photo: first,
      weight: weightByDate[first.date] ?? null,
    });

    if (daysOfData >= 80) {
      const p90 = findClosest(photos, subDays(today, 90));
      if (p90 && p90.date !== first.date) {
        milestones.push({
          label: "90 days ago",
          sublabel: format(parseISO(p90.date), "MMM d, yyyy"),
          photo: p90,
          weight: weightByDate[p90.date] ?? null,
        });
      }
    }
    if (daysOfData >= 50) {
      const p60 = findClosest(photos, subDays(today, 60));
      if (p60 && p60.date !== first.date) {
        milestones.push({
          label: "60 days ago",
          sublabel: format(parseISO(p60.date), "MMM d, yyyy"),
          photo: p60,
          weight: weightByDate[p60.date] ?? null,
        });
      }
    }
    if (daysOfData >= 20) {
      const p30 = findClosest(photos, subDays(today, 30));
      if (p30 && p30.date !== first.date) {
        milestones.push({
          label: "30 days ago",
          sublabel: format(parseISO(p30.date), "MMM d, yyyy"),
          photo: p30,
          weight: weightByDate[p30.date] ?? null,
        });
      }
    }
    if (latest.date !== first.date) {
      milestones.push({
        label: "Latest",
        sublabel: format(parseISO(latest.date), "MMM d, yyyy"),
        photo: latest,
        weight: weightByDate[latest.date] ?? null,
      });
    }
  }

  const RANGE_DAYS: Record<string, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "ALL": Infinity };
  const cutoff = RANGE_DAYS[chartRange];
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = sortedEntries
    .filter((e) => differenceInDays(new Date(), parseISO(e.date)) <= cutoff)
    .map((e) => ({
      date: formatShortDate(parseISO(e.date)),
      weight: e.weightKg,
      fullDate: e.date,
    }));

  const latestWeight = entries[0]?.weightKg;

  // Week-over-week avg change
  const sortedWeeks = [...weeklyAverages].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const thisWeekAvg = sortedWeeks[0]?.avg ?? null;
  const prevWeekAvg = sortedWeeks[1]?.avg ?? null;
  const weeklyChange = thisWeekAvg !== null && prevWeekAvg !== null
    ? (thisWeekAvg - prevWeekAvg).toFixed(1) : null;

  const heatmapData: Record<string, number> = {};
  for (const e of entries) heatmapData[e.date.slice(0, 10)] = 1;

  return (
    <AppShell>
      <PageHeader
        title="Weight Tracker"
        description="Track daily weight and progress photos"
        action={
          <div className="flex gap-2">
            <Button onClick={() => setShowPhotoModal(true)} size="sm" variant="secondary">
              <Camera size={14} /> Add Photo
            </Button>
            <Button variant="primary" onClick={() => setShowModal(true)} size="sm">
              <Plus size={14} /> Log Weight
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 section-gap">
        <StatCard label="Current" value={latestWeight ? `${latestWeight} kg` : "—"} accent="violet" icon={<Scale size={16} />} />
        <div className="rounded-2xl p-6" style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[11.5px] font-medium mb-1.5" style={{ color: "rgb(100,100,115)" }}>Weekly Change</p>
          <p className={`text-[22px] font-semibold tabular-nums tracking-tight leading-tight ${
            weeklyChange === null ? "text-white" : parseFloat(weeklyChange) <= 0 ? "text-emerald-400" : "text-red-400"
          }`}>
            {weeklyChange !== null ? `${parseFloat(weeklyChange) > 0 ? "+" : ""}${weeklyChange} kg` : "—"}
          </p>
          <p className="text-[11.5px] mt-1" style={{ color: "rgb(70,70,85)" }}>
            {thisWeekAvg && prevWeekAvg
              ? `${prevWeekAvg} → ${thisWeekAvg} kg avg`
              : "vs prev week avg"}
          </p>
        </div>
        <StatCard label="Entries" value={entries.length.toString()} accent="neutral" />
      </div>

      {/* Progress photo comparison */}
      {milestones.length >= 2 && (
        <div className="section-gap">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>
            Progress Comparison
          </p>
          <div
            className={`grid gap-4 ${
              milestones.length >= 4 ? "grid-cols-2 sm:grid-cols-4" :
              milestones.length === 3 ? "grid-cols-3" : "grid-cols-2"
            }`}
          >
            {milestones.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl overflow-hidden border border-white/[0.07] cursor-pointer hover:border-violet-500/40 transition-colors"
                style={{ background: "rgb(22,22,26)" }}
                onClick={() => m.photo && setLightboxPhoto(m.photo)}
              >
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.photo.url}
                    alt={m.label}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <ImageIcon size={32} style={{ color: "rgb(50,50,62)" }} />
                  </div>
                )}
                <div className="px-3 py-2.5">
                  <p className="text-xs font-semibold text-white">{m.label}</p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: "rgb(100,100,115)" }}>{m.sublabel}</p>
                  {m.weight && (
                    <p className="text-xs text-violet-400 font-medium tabular-nums mt-0.5">{m.weight} kg</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend chart */}
      <div className="section-gap">
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Header + range tabs */}
          <div className="px-6 pt-5 pb-4 flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>Weight Trend</p>
              {chartData.length > 0 && (
                <p className="text-xs mt-1" style={{ color: "rgb(100,100,115)" }}>
                  {chartData[0]?.weight} kg → {chartData[chartData.length - 1]?.weight} kg
                  {chartData.length > 1 && (() => {
                    const delta = chartData[chartData.length - 1].weight - chartData[0].weight;
                    return (
                      <span className={delta <= 0 ? " text-emerald-400" : " text-red-400"}>
                        {" "}{delta > 0 ? "+" : ""}{delta.toFixed(1)} kg
                      </span>
                    );
                  })()}
                </p>
              )}
            </div>
            <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: "rgb(16,16,20)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {(["1W","1M","3M","6M","1Y","ALL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150"
                  style={chartRange === r
                    ? { background: "rgba(139,92,246,0.2)", color: "rgb(167,139,250)" }
                    : { color: "rgb(90,90,105)" }
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center pb-10 pt-4">
              <p className="text-sm" style={{ color: "rgb(70,70,85)" }}>No data for this range</p>
            </div>
          ) : (
            <div className="px-2 pb-5">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="rgb(139,92,246)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "rgb(80,80,95)" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "rgb(80,80,95)" }}
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: "rgb(28,28,34)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "8px 12px" }}>
                            <p style={{ fontSize: 11, color: "rgb(120,120,135)", marginBottom: 2 }}>{d.fullDate}</p>
                            <p style={{ fontSize: 15, fontWeight: 600, color: "white" }}>{d.weight} kg</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="rgb(139,92,246)"
                    strokeWidth={2}
                    fill="url(#weightGrad)"
                    dot={chartData.length === 1 ? { fill: "rgb(139,92,246)", r: 4, strokeWidth: 0 } : false}
                    activeDot={{ r: 5, fill: "rgb(167,139,250)", strokeWidth: 2, stroke: "rgba(139,92,246,0.4)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Logging consistency heatmap */}
      <div className="section-gap">
        <ActivityHeatmap
          data={heatmapData}
          title="Logging Consistency"
          getLevel={(v) => v === 0 ? 0 : 4}
          tooltipLabel={(v, d) => v === 0 ? `${d}: not logged` : `${d}: logged`}
          hideLegend
        />
      </div>

      {/* All photos gallery */}
      {photos.length > 0 && (
        <div className="section-gap">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>
            All Photos ({photos.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {[...photos].reverse().map((p) => (
              <div
                key={p.id}
                className="relative group rounded-xl overflow-hidden border border-white/[0.07] cursor-pointer hover:border-violet-500/40 transition-colors"
                onClick={() => setLightboxPhoto(p)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.date} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                  <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white font-medium">{format(parseISO(p.date), "MMM d")}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p.id); }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly averages */}
      {weeklyAverages.length > 0 && (
        <div className="section-gap">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>Weekly Averages</p>
          <Card>
            <CardContent className="pt-5">
              <div className="space-y-3">
                {[...weeklyAverages].reverse().map((w) => {
                  const idx = weeklyAverages.findIndex((x) => x.weekStart === w.weekStart);
                  const prev = idx > 0 ? weeklyAverages[idx - 1] : null;
                  const change = prev ? w.avg - prev.avg : null;
                  return (
                    <div key={w.weekStart} className="flex items-center justify-between py-2 border-b border-white/[0.07] last:border-0">
                      <div>
                        <p className="text-sm text-[rgb(210,210,220)]">
                          {formatShortDate(parseISO(w.weekStart))} – {formatShortDate(parseISO(w.end))}
                        </p>
                        <p className="text-xs" style={{ color: "rgb(90,90,105)" }}>{w.count} entries</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-violet-400">{w.avg} kg</p>
                        {change !== null && (
                          <p className={`text-xs ${change <= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {change > 0 ? "+" : ""}{change.toFixed(1)} kg
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All entries log */}
      <div className="section-gap">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>All Entries</p>
        <Card>
          <CardContent className="pt-5">
            {loading ? (
              <p className="text-sm" style={{ color: "rgb(90,90,105)" }}>Loading...</p>
            ) : entries.length === 0 ? (
              <div className="text-center py-8">
                <Scale size={40} className="mx-auto mb-2" style={{ color: "rgb(50,50,62)" }} />
                <p className="text-sm" style={{ color: "rgb(80,80,95)" }}>No entries yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.07] last:border-0 group">
                    <p className="text-sm text-[rgb(210,210,220)]">{format(parseISO(e.date), "EEE, MMM d yyyy")}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-violet-400 tabular-nums">{e.weightKg} kg</p>
                      <button onClick={() => handleDelete(e.id)} className="text-[rgb(80,80,95)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Weight Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Weight">
        <div className="space-y-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Weight (kg)" type="number" step="0.1" placeholder="e.g. 75.5" value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          <Button variant="primary" onClick={handleSave} loading={saving} className="w-full">Save</Button>
        </div>
      </Modal>

      {/* Add Photo Modal */}
      <Modal open={showPhotoModal} onClose={() => { setShowPhotoModal(false); setPhotoPreview(null); setPhotoFile(null); }} title="Add Progress Photo">
        <div className="space-y-4">
          <Input label="Date" type="date" value={photoDate} onChange={(e) => setPhotoDate(e.target.value)} />

          {/* Upload area */}
          <div
            className="relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-violet-500/50"
            style={{ borderColor: "rgba(255,255,255,0.12)", minHeight: 180, background: "rgb(16,16,20)" }}
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="preview" className="max-h-64 rounded-xl object-contain" />
            ) : (
              <div className="text-center px-6 py-8">
                <Camera size={32} className="mx-auto mb-3" style={{ color: "rgb(80,80,95)" }} />
                <p className="text-sm font-medium text-white mb-1">Tap to choose photo</p>
                <p className="text-xs" style={{ color: "rgb(80,80,95)" }}>JPG, PNG, HEIC, WebP supported</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {photoPreview && (
            <button
              className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
              onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
            >
              Remove photo
            </button>
          )}

          <Button
            variant="primary"
            onClick={handlePhotoUpload}
            loading={uploadingPhoto}
            disabled={!photoFile}
            className="w-full"
          >
            {uploadingPhoto ? "Uploading..." : "Save Photo"}
          </Button>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors"
              onClick={() => setLightboxPhoto(null)}
            >
              <X size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.date}
              className="w-full rounded-2xl"
              style={{ maxHeight: "80vh", objectFit: "contain" }}
            />
            <div className="mt-3 text-center">
              <p className="text-sm text-white font-medium">{format(parseISO(lightboxPhoto.date), "EEEE, MMMM d yyyy")}</p>
              {weightByDate[lightboxPhoto.date] && (
                <p className="text-xs text-violet-400 mt-1">{weightByDate[lightboxPhoto.date]} kg</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

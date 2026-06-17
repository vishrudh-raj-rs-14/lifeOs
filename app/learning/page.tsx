"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, todayStr } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Brain, Search, ChevronDown, ChevronUp, Edit3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LearningEntry {
  id: number;
  date: string;
  content: string;
  tags: string[];
}

export default function LearningPage() {
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editDate, setEditDate] = useState(todayStr());
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [preview, setPreview] = useState(true);

  async function fetchData(q?: string) {
    const url = q ? `/api/learning?search=${encodeURIComponent(q)}` : "/api/learning";
    const res = await fetch(url);
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const todayEntry = entries.find((e) => e.date === todayStr());
    if (todayEntry) {
      setContent(todayEntry.content);
      setTags(todayEntry.tags.join(", "));
    }
  }, [entries]);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    await fetch("/api/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: editDate,
        content,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    fetchData();
  }

  function toggleExpand(id: number) {
    const s = new Set(expanded);
    if (s.has(id)) s.delete(id); else s.add(id);
    setExpanded(s);
  }

  const otherEntries = entries.filter((e) => e.date !== editDate || !content);

  return (
    <AppShell>
      <PageHeader title="Learning Log" description="Daily notes on what you learned" />

      {/* Editor */}
      <Card className="mb-10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit3 size={14} className="text-violet-400" />
              {editDate === todayStr() ? "Today's Log" : format(parseISO(editDate), "MMM d")}
            </CardTitle>
            <div className="flex gap-2">
              <Input
                type="date"
                value={editDate}
                onChange={(e) => {
                  setEditDate(e.target.value);
                  const entry = entries.find((x) => x.date === e.target.value);
                  setContent(entry?.content || "");
                  setTags(entry?.tags.join(", ") || "");
                }}
                className="text-xs py-1 px-2 w-36"
              />
              <button
                onClick={() => setPreview(!preview)}
                className="text-xs text-violet-500 hover:text-violet-400 px-2 py-1 rounded bg-violet-500/10"
              >
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {preview && content ? (
            <div className="prose prose-sm prose-invert max-w-none min-h-[120px] bg-[rgb(16,16,20)] rounded-xl p-5 border border-white/[0.06]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <Textarea
              placeholder="What did you learn today? Supports **markdown**..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          )}
          <div className="mt-4 flex gap-4">
            <Input
              placeholder="Tags: algo, math, system-design"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="text-xs"
            />
            <Button onClick={handleSave} loading={saving} className="flex-shrink-0">Save</Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative mb-8">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(75,75,88)] pointer-events-none" />
        <input
          className="w-full h-10 bg-[rgb(16,16,20)] border border-white/[0.08] text-white placeholder-[rgb(75,75,88)] rounded-xl pl-9 pr-4 text-[13.5px] focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 hover:border-white/[0.13] transition-all duration-150"
          placeholder="Search learning logs..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchData(e.target.value);
          }}
        />
      </div>

      {/* Archive */}
      <div>
        <p
          className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4"
          style={{ color: "rgb(70,70,85)" }}
        >
          Past Entries
        </p>
        <div className="space-y-4">
          {loading ? (
            <p className="text-[13.5px]" style={{ color: "rgb(120,120,135)" }}>Loading...</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Brain size={40} className="mx-auto mb-3" style={{ color: "rgb(50,50,62)" }} />
              <p className="text-sm" style={{ color: "rgb(80,80,95)" }}>No entries yet. Start logging what you learn!</p>
            </div>
          ) : (
            entries.map((e) => {
              const isExpanded = expanded.has(e.id);
              const entryPreview = e.content.slice(0, 150);
              return (
                <Card key={e.id}>
                  <button onClick={() => toggleExpand(e.id)} className="w-full text-left">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[rgb(210,210,220)]">
                            {format(parseISO(e.date), "EEE, MMMM d yyyy")}
                            {e.date === todayStr() && <span className="ml-2 text-xs text-violet-400">Today</span>}
                          </p>
                          {!isExpanded && (
                            <p className="text-xs mt-1 line-clamp-2" style={{ color: "rgb(120,120,135)" }}>{entryPreview}{e.content.length > 150 ? "..." : ""}</p>
                          )}
                          {e.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {e.tags.map((t) => <Badge key={t} variant="muted">{t}</Badge>)}
                            </div>
                          )}
                        </div>
                        {isExpanded
                          ? <ChevronUp size={14} className="text-[rgb(110,113,125)] flex-shrink-0 mt-0.5" />
                          : <ChevronDown size={14} className="text-[rgb(110,113,125)] flex-shrink-0 mt-0.5" />}
                      </div>
                    </CardHeader>
                  </button>
                  {isExpanded && (
                    <CardContent>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{e.content}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => {
                          setEditDate(e.date);
                          setContent(e.content);
                          setTags(e.tags.join(", "));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="mt-3 text-xs text-violet-500 hover:text-violet-400"
                      >
                        Edit this entry
                      </button>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}

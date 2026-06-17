"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { cn, todayStr, formatDisplayDate } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { BookOpen, Plus, Edit2 } from "lucide-react";

interface Book {
  id: number;
  title: string;
  author: string;
  totalPages: number | null;
  currentPage: number | null;
  startDate: string;
  endDate: string | null;
  status: "READING" | "COMPLETED" | "PAUSED";
  summaryNotes: string | null;
  genre: string | null;
}

const STATUS_OPTIONS = [
  { value: "READING", label: "Reading" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PAUSED", label: "Paused" },
];

const STATUS_BADGE: Record<string, "success" | "muted" | "warning"> = {
  READING: "success",
  COMPLETED: "muted",
  PAUSED: "warning",
};

export default function ReadingPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [genre, setGenre] = useState("");

  const [editPage, setEditPage] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  async function fetchData() {
    const res = await fetch("/api/reading");
    const data = await res.json();
    setBooks(data.books || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleAdd() {
    if (!title || !author) return;
    setSaving(true);
    await fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, totalPages, startDate, genre }),
    });
    setSaving(false);
    setShowAddModal(false);
    setTitle(""); setAuthor(""); setTotalPages(""); setGenre("");
    fetchData();
  }

  async function handleUpdate() {
    if (!editBook) return;
    setSaving(true);
    await fetch("/api/reading", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editBook.id,
        currentPage: editPage ? parseInt(editPage) : undefined,
        status: editStatus || undefined,
        summaryNotes: editNotes || undefined,
        ...(editStatus === "COMPLETED" && { endDate: todayStr() }),
      }),
    });
    setSaving(false);
    setEditBook(null);
    fetchData();
  }

  function openEdit(book: Book) {
    setEditBook(book);
    setEditPage(book.currentPage?.toString() || "");
    setEditStatus(book.status);
    setEditNotes(book.summaryNotes || "");
  }

  const reading = books.filter((b) => b.status === "READING");
  const completed = books.filter((b) => b.status === "COMPLETED");
  const paused = books.filter((b) => b.status === "PAUSED");

  function BookCard({ book }: { book: Book }) {
    const progress = book.totalPages && book.currentPage
      ? (book.currentPage / book.totalPages) * 100
      : null;

    return (
      <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-colors">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white line-clamp-1">{book.title}</h3>
            <p className="text-xs mt-0.5" style={{ color: "rgb(120,120,135)" }}>{book.author}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={STATUS_BADGE[book.status]}>{book.status.toLowerCase()}</Badge>
            <button
              onClick={() => openEdit(book)}
              className="p-1 transition-colors"
              style={{ color: "rgb(80,80,95)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgb(139,92,246)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgb(80,80,95)")}
            >
              <Edit2 size={12} />
            </button>
          </div>
        </div>

        {book.genre && (
          <p className="text-xs mb-3" style={{ color: "rgb(80,80,95)" }}>{book.genre}</p>
        )}

        {progress !== null && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: "rgb(120,120,135)" }}>
              <span>Page {book.currentPage} of {book.totalPages}</span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", book.status === "COMPLETED" ? "bg-emerald-400" : "bg-violet-500")}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-[10px]" style={{ color: "rgb(80,80,95)" }}>
          Started {formatDisplayDate(parseISO(book.startDate))}
          {book.endDate && ` · Finished ${formatDisplayDate(parseISO(book.endDate))}`}
        </p>

        {book.summaryNotes && (
          <p className="text-xs mt-3 pt-3 border-t border-white/[0.05] line-clamp-3" style={{ color: "rgb(160,163,175)" }}>
            {book.summaryNotes}
          </p>
        )}
      </div>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Reading Log"
        description="Non-fiction books, progress and notes"
        action={
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus size={14} /> Add Book
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 section-gap">
        <StatCard label="Reading" value={String(reading.length)} accent="violet" />
        <StatCard label="Completed" value={String(completed.length)} accent="green" />
        <StatCard label="Total" value={String(books.length)} accent="neutral" />
      </div>

      {loading ? (
        <p className="text-[13.5px]" style={{ color: "rgb(120,120,135)" }}>Loading...</p>
      ) : books.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3" style={{ color: "rgb(50,50,62)" }} />
          <p className="text-sm" style={{ color: "rgb(80,80,95)" }}>No books yet. Add your first non-fiction book!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {reading.length > 0 && (
            <div>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4"
                style={{ color: "rgb(70,70,85)" }}
              >
                Currently Reading
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {reading.map((b) => <BookCard key={b.id} book={b} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4"
                style={{ color: "rgb(70,70,85)" }}
              >
                Completed
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {completed.map((b) => <BookCard key={b.id} book={b} />)}
              </div>
            </div>
          )}

          {paused.length > 0 && (
            <div>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4"
                style={{ color: "rgb(70,70,85)" }}
              >
                Paused
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {paused.map((b) => <BookCard key={b.id} book={b} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Book">
        <div className="space-y-4">
          <Input label="Title" placeholder="Book title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Author" placeholder="Author name" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Pages (opt)" type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} />
            <Input label="Genre (opt)" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Non-fiction" />
          </div>
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Button onClick={handleAdd} loading={saving} className="w-full">Add Book</Button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editBook} onClose={() => setEditBook(null)} title={editBook?.title || ""}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Current Page${editBook?.totalPages ? ` / ${editBook.totalPages}` : ""}`}
              type="number"
              value={editPage}
              onChange={(e) => setEditPage(e.target.value)}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            />
          </div>
          <Textarea
            label="Summary / Notes"
            placeholder="Key ideas, quotes, takeaways..."
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={5}
          />
          <Button onClick={handleUpdate} loading={saving} className="w-full">Update</Button>
        </div>
      </Modal>
    </AppShell>
  );
}

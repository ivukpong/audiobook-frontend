"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import FileUpload from "@/components/FileUpload";
import ConfirmModal from "@/components/ui/ConfirmModal";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";
import type { Book } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Users,
  BookOpen,
  ShoppingCart,
  TrendingUp,
  ClipboardCheck,
  ExternalLink,
  X,
} from "lucide-react";

interface Stats {
  users: number;
  books: number;
  purchases: number;
  totalRevenue: number;
}

interface FindawayReadiness {
  ready: boolean;
  submitted: boolean;
  checks: Record<string, boolean>;
  missing: string[];
  nextSteps: string[];
  book: {
    title: string;
    findawayUrl?: string | null;
  };
}

const EMPTY_FORM = {
  title: "",
  author: "",
  description: "",
  coverStorageKey: "",
  price: 0,
  currency: "NGN",
  mediaStorageKey: "",
  published: false,
  featured: false,
  durationSec: 0,
  isChaptered: false,
};

type ChapterDraft = {
  id: string;
  title: string;
  mediaStorageKey: string;
  durationSec: number;
};

export default function AdminPage() {
  const { user, fetchMe, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [chapters, setChapters] = useState<ChapterDraft[]>([]);
  const [useChapterMode, setUseChapterMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [findawayLoadingId, setFindawayLoadingId] = useState<string | null>(
    null,
  );
  const [findawayReadiness, setFindawayReadiness] =
    useState<FindawayReadiness | null>(null);
  const [showFindawayModal, setShowFindawayModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showUnpublishAll, setShowUnpublishAll] = useState(false);
  const [unpublishingAll, setUnpublishingAll] = useState(false);
  const [chapterToRemove, setChapterToRemove] = useState<ChapterDraft | null>(
    null,
  );

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    load();
  }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/books"),
      ]);
      setStats(s.data);
      setBooks(b.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setChapters([]);
    setUseChapterMode(false);
    setEditId(null);
    setShowForm(true);
  };
  const openEdit = (b: Book) => {
    const hasChapters = Boolean((b.chapters || []).length);
    setForm({
      title: b.title,
      author: b.author,
      description: b.description,
      coverStorageKey: (b as any).coverStorageKey || "",
      price: b.price,
      currency: b.currency,
      durationSec: b.durationSec,
      mediaStorageKey: (b as any).mediaStorageKey || "",
      published: b.published,
      featured: b.featured,
      isChaptered: hasChapters,
    });
    setChapters(
      (b.chapters || []).map((chapter, index) => ({
        id: chapter.id || `${b.id}-${index}`,
        title: chapter.title || `Chapter ${index + 1}`,
        mediaStorageKey: chapter.mediaStorageKey || "",
        durationSec: chapter.durationSec || 0,
      })),
    );
    setUseChapterMode(hasChapters);
    setEditId(b.id);
    setShowForm(true);
  };

  const recalculateDuration = (nextChapters: ChapterDraft[]) => {
    const sum = nextChapters.reduce(
      (total, chapter) => total + Number(chapter.durationSec || 0),
      0,
    );
    if (sum > 0) {
      setForm((f) => ({ ...f, durationSec: sum }));
    }
  };

  const addChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: `Chapter ${prev.length + 1}`,
        mediaStorageKey: "",
        durationSec: 0,
      },
    ]);
  };

  const removeChapter = (chapterId: string) => {
    setChapters((prev) => {
      const next = prev.filter((chapter) => chapter.id !== chapterId);
      recalculateDuration(next);
      return next;
    });
  };

  const requestRemoveChapter = (chapter: ChapterDraft) => {
    if (chapter.mediaStorageKey) {
      setChapterToRemove(chapter);
    } else {
      removeChapter(chapter.id);
    }
  };

  const confirmRemoveChapter = () => {
    if (!chapterToRemove) return;
    removeChapter(chapterToRemove.id);
    setChapterToRemove(null);
  };

  const updateChapter = (
    chapterId: string,
    updater: (chapter: ChapterDraft) => ChapterDraft,
  ) => {
    setChapters((prev) => {
      const next = prev.map((chapter) =>
        chapter.id === chapterId ? updater(chapter) : chapter,
      );
      recalculateDuration(next);
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.coverStorageKey) {
      toast.error("Book cover is required");
      return;
    }
    if (useChapterMode) {
      if (chapters.length === 0) {
        toast.error("Add at least one chapter");
        return;
      }
      const invalidChapter = chapters.find(
        (chapter) => !chapter.mediaStorageKey || !chapter.title.trim(),
      );
      if (invalidChapter) {
        toast.error("Each chapter needs a title and uploaded audio");
        return;
      }
    } else if (!form.mediaStorageKey) {
      toast.error("Media file is required for single-file books");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        durationSec: Number(form.durationSec),
        isChaptered: useChapterMode,
        chapters: useChapterMode
          ? chapters.map((chapter) => ({
              title: chapter.title.trim(),
              mediaStorageKey: chapter.mediaStorageKey,
              durationSec: Number(chapter.durationSec || 0),
            }))
          : [],
      };
      if (editId) {
        await api.patch(`/admin/books/${editId}`, payload);
        toast.success("Book updated");
      } else {
        await api.post("/admin/books", payload);
        toast.success("Book created");
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/books/${deleteTarget.id}`);
      toast.success("Book deleted");
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete book");
    } finally {
      setDeleting(false);
    }
  };

  const confirmUnpublishAll = async () => {
    setUnpublishingAll(true);
    try {
      const { data } = await api.patch("/admin/books/unpublish-all");
      toast.success(`Unpublished ${data.count} book${data.count === 1 ? "" : "s"}`);
      setShowUnpublishAll(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to unpublish books");
    } finally {
      setUnpublishingAll(false);
    }
  };

  const togglePublish = async (b: Book) => {
    await api.patch(`/admin/books/${b.id}`, { published: !b.published });
    toast.success(b.published ? "Unpublished" : "Published");
    load();
  };

  const checkFindawayReadiness = async (bookId: string) => {
    try {
      setFindawayLoadingId(bookId);
      const { data } = await api.get(
        `/admin/books/${bookId}/findaway-readiness`,
      );
      setFindawayReadiness(data);
      setShowFindawayModal(true);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to load Findaway readiness",
      );
    } finally {
      setFindawayLoadingId(null);
    }
  };

  const field = (
    key: keyof typeof EMPTY_FORM,
    label: string,
    type = "text",
    opts?: { textarea?: boolean; rows?: number },
  ) => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {opts?.textarea ? (
        <textarea
          rows={opts.rows || 3}
          value={String(form[key])}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
        />
      ) : (
        <input
          type={type}
          value={String(form[key])}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              [key]:
                type === "checkbox"
                  ? (e.target as any).checked
                  : e.target.value,
            }))
          }
          {...(type === "checkbox" ? { checked: Boolean(form[key]) } : {})}
          className={
            type === "checkbox"
              ? "w-4 h-4 accent-brand"
              : "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          }
        />
      )}
    </div>
  );

  const renderBookActions = (b: Book) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => togglePublish(b)}
        title={b.published ? "Unpublish" : "Publish"}
        className="p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-brand-light/60 transition-colors"
      >
        {b.published ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
      <button
        onClick={() => openEdit(b)}
        title="Edit"
        className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={() => checkFindawayReadiness(b.id)}
        title="Findaway readiness"
        className="p-2 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-colors"
        disabled={findawayLoadingId === b.id}
      >
        <ClipboardCheck size={15} />
      </button>
      <button
        onClick={() => requestDelete(b.id, b.title)}
        title="Delete"
        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  const statCards = stats
    ? [
        {
          label: "Users",
          value: stats.users,
          icon: <Users size={18} />,
          color: "blue",
        },
        {
          label: "Books",
          value: stats.books,
          icon: <BookOpen size={18} />,
          color: "green",
        },
        {
          label: "Purchases",
          value: stats.purchases,
          icon: <ShoppingCart size={18} />,
          color: "purple",
        },
        {
          label: "Revenue",
          value: `₦${stats.totalRevenue.toLocaleString()}`,
          icon: <TrendingUp size={18} />,
          color: "amber",
        },
      ]
    : [];

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowUnpublishAll(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              <EyeOff size={16} /> Unpublish all
            </button>
            <button
              onClick={openCreate}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors text-sm"
            >
              <Plus size={16} /> Add book
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4"
            >
              <div className="text-gray-400 mb-2">{s.icon}</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Books table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">All Books</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-300 text-sm">
              Loading...
            </div>
          ) : books.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No books yet. Click "Add book" to create your first title.
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-gray-50">
                {books.map((b) => (
                  <div key={b.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {b.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {b.author}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${b.published ? "bg-brand-light text-brand" : "bg-gray-100 text-gray-400"}`}
                      >
                        {b.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-700">
                        ₦{b.price.toLocaleString()}
                      </span>
                      {renderBookActions(b)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                    <tr>
                      {["Title", "Author", "Price", "Status", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-3 font-medium"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {books.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-gray-900 max-w-[180px] truncate">
                          {b.title}
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {b.author}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          ₦{b.price.toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${b.published ? "bg-brand-light text-brand" : "bg-gray-100 text-gray-400"}`}
                          >
                            {b.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-5 py-3">{renderBookActions(b)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false);
            }}
          >
            <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                {editId ? "Edit book" : "Add book"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field("title", "Title")}
                  {field("author", "Author")}
                </div>
                {field("description", "Description", "text", {
                  textarea: true,
                  rows: 3,
                })}

                {/* File Uploads */}
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <FileUpload
                    type="cover"
                    isUploading={uploading}
                    onUploadComplete={(key) => {
                      setForm((f) => ({ ...f, coverStorageKey: key }));
                      toast.success("Cover uploaded");
                    }}
                  />
                  {form.coverStorageKey && (
                    <p className="text-xs text-green-600">
                      ✓ Cover uploaded: {form.coverStorageKey}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="audioMode"
                        checked={!useChapterMode}
                        onChange={() => setUseChapterMode(false)}
                        className="w-4 h-4 accent-brand"
                      />
                      Single audio file
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="audioMode"
                        checked={useChapterMode}
                        onChange={() => setUseChapterMode(true)}
                        className="w-4 h-4 accent-brand"
                      />
                      Multiple chapters
                    </label>
                  </div>

                  {!useChapterMode ? (
                    <>
                      <FileUpload
                        type="media"
                        isUploading={uploading}
                        onUploadComplete={(key, duration) => {
                          setForm((f) => ({
                            ...f,
                            mediaStorageKey: key,
                            durationSec: duration || 0,
                          }));
                          toast.success("Media file uploaded");
                        }}
                      />
                      {form.mediaStorageKey && (
                        <p className="text-xs text-green-600">
                          ✓ Media uploaded: {form.mediaStorageKey}
                          {form.durationSec > 0 &&
                            ` (${Math.floor(form.durationSec / 60)}m ${form.durationSec % 60}s)`}
                        </p>
                      )}
                    </>
                  ) : null}
                </div>

                {useChapterMode ? (
                  <div className="border-t border-gray-100 pt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Chapters
                    </p>
                    <p className="text-xs text-gray-500">
                      Upload chapter-by-chapter audio for better navigation.
                    </p>
                  </div>

                  {chapters.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No chapters yet. You can still use a single full-book media
                      file above.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {chapters.map((chapter, index) => (
                        <div
                          key={chapter.id}
                          className="border border-gray-200 rounded-lg p-3 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={chapter.title}
                              onChange={(e) =>
                                updateChapter(chapter.id, (current) => ({
                                  ...current,
                                  title: e.target.value,
                                }))
                              }
                              placeholder={`Chapter ${index + 1} title`}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                            />
                            <button
                              type="button"
                              onClick={() => requestRemoveChapter(chapter)}
                              className="text-gray-400 hover:text-red-500"
                              title="Remove chapter"
                            >
                              <X size={15} />
                            </button>
                          </div>

                          <FileUpload
                            type="media"
                            isUploading={uploading}
                            onUploadComplete={(key, duration) => {
                              updateChapter(chapter.id, (current) => ({
                                ...current,
                                mediaStorageKey: key,
                                durationSec: duration || 0,
                              }));
                              toast.success("Chapter uploaded");
                            }}
                          />

                          {chapter.mediaStorageKey ? (
                            <p className="text-xs text-green-600">
                              ✓ Uploaded: {chapter.mediaStorageKey}
                              {chapter.durationSec > 0
                                ? ` (${Math.floor(chapter.durationSec / 60)}m ${chapter.durationSec % 60}s)`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addChapter}
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Add chapter
                  </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field("price", "Price", "number")}
                  {field("currency", "Currency")}
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    {field("published", "", "checkbox")} Published
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    {field("featured", "", "checkbox")} Featured
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex-1 bg-brand text-white py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editId
                        ? "Update book"
                        : "Create book"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showFindawayModal && findawayReadiness && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFindawayModal(false);
            }}
          >
            <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Findaway Readiness
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${findawayReadiness.ready ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {findawayReadiness.ready
                    ? "Ready to submit"
                    : "Needs updates"}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {findawayReadiness.book.title}
              </p>

              {findawayReadiness.missing.length > 0 ? (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Required fixes
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {findawayReadiness.missing.map((item) => (
                      <li
                        key={item}
                        className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mb-5 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                  All metadata checks passed. This title is ready for Findaway
                  submission.
                </div>
              )}

              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Operational next steps
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  {findawayReadiness.nextSteps.map((item) => (
                    <li
                      key={item}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {findawayReadiness.book.findawayUrl ? (
                <a
                  href={findawayReadiness.book.findawayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-violet-700 hover:text-violet-800 font-medium"
                >
                  Open existing Findaway URL <ExternalLink size={14} />
                </a>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowFindawayModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={showUnpublishAll}
          title="Unpublish all books"
          message="This will hide every currently published book from the storefront. You can re-publish books individually afterwards. Continue?"
          confirmLabel="Unpublish all"
          loading={unpublishingAll}
          onConfirm={confirmUnpublishAll}
          onCancel={() => setShowUnpublishAll(false)}
        />

        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete book"
          message={
            deleteTarget
              ? `Delete "${deleteTarget.title}"? This cannot be undone.`
              : ""
          }
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        <ConfirmModal
          open={Boolean(chapterToRemove)}
          title="Remove chapter"
          message={
            chapterToRemove
              ? `Remove "${chapterToRemove.title}"? Its uploaded audio reference will be discarded.`
              : ""
          }
          confirmLabel="Remove"
          onConfirm={confirmRemoveChapter}
          onCancel={() => setChapterToRemove(null)}
        />
      </main>
    </>
  );
}

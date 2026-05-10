"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BookCard from "@/components/book/BookCard";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import type { Purchase } from "@/types";
import { Download, Library, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  listOfflineAudioMeta,
  removeOfflineAudio,
  type OfflineAudioMeta,
} from "@/lib/offlineAudio";

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const kb = sizeBytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function LibraryPage() {
  const { user, loading: authLoading, fetchMe } = useAuthStore();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineMetaByBook, setOfflineMetaByBook] = useState<
    Record<string, OfflineAudioMeta>
  >({});
  const [removingBookId, setRemovingBookId] = useState<string | null>(null);

  const hydrateOfflineMeta = async () => {
    try {
      const meta = await listOfflineAudioMeta();
      const byBook = meta.reduce<Record<string, OfflineAudioMeta>>(
        (acc, item) => {
          acc[item.bookId] = item;
          return acc;
        },
        {},
      );
      setOfflineMetaByBook(byBook);
    } catch {
      setOfflineMetaByBook({});
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    api
      .get("/purchases/library")
      .then(({ data }) => setPurchases(data))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  useEffect(() => {
    hydrateOfflineMeta();
  }, []);

  const downloadedPurchases = purchases.filter((p) =>
    Boolean(offlineMetaByBook[p.bookId]),
  );
  const downloadedTotalBytes = downloadedPurchases.reduce(
    (sum, purchase) =>
      sum + (offlineMetaByBook[purchase.bookId]?.sizeBytes || 0),
    0,
  );

  const removeDownload = async (bookId: string) => {
    try {
      setRemovingBookId(bookId);
      await removeOfflineAudio(bookId);
      await hydrateOfflineMeta();
      toast.success("Removed offline download");
    } catch {
      toast.error("Could not remove download");
    } finally {
      setRemovingBookId(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-8">
          <Library size={22} className="text-brand" />
          <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
          {!loading && (
            <span className="ml-2 bg-brand-light text-brand text-sm font-medium px-2.5 py-0.5 rounded-full">
              {purchases.length} {purchases.length === 1 ? "book" : "books"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-64 animate-pulse"
              />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Your library is empty
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Purchase audiobooks to listen to them here
            </p>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors"
            >
              <ShoppingBag size={16} /> Browse store
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {downloadedPurchases.length > 0 && (
              <section className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 md:p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Download size={18} className="text-emerald-700" />
                    <h2 className="text-base font-semibold text-emerald-900">
                      Downloaded for Offline
                    </h2>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {downloadedPurchases.length}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    {formatBytes(downloadedTotalBytes)} used
                  </p>
                </div>

                <div className="space-y-2">
                  {downloadedPurchases.map((purchase) => {
                    const meta = offlineMetaByBook[purchase.bookId];
                    return (
                      <div
                        key={`offline-${purchase.id}`}
                        className="bg-white border border-emerald-100 rounded-lg p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {purchase.book.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatBytes(meta.sizeBytes)} • Saved{" "}
                            {new Date(meta.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeDownload(purchase.bookId)}
                          disabled={removingBookId === purchase.bookId}
                          className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={13} />{" "}
                          {removingBookId === purchase.bookId
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                All Purchased Books
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {purchases.map((p) => (
                  <BookCard key={p.id} book={p.book} owned />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}

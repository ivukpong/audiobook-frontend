"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import BookCard from "@/components/book/BookCard";
import api from "@/lib/api";
import type { Book } from "@/types";

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/books")
      .then(({ data }) => {
        setBooks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const featured = books.filter((b) => b.featured);
  const rest = books.filter((b) => !b.featured);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <section className="mb-8 sm:mb-10 rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-6 py-10 sm:px-10 sm:py-14 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold max-w-xl">
            Premium audiobooks, priced in Naira
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/80 max-w-xl">
            Stream instantly or download for offline listening — own your
            favorite titles for life.
          </p>
        </section>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse"
              />
            ))}
          </div>
        ) : books.length === 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">No audiobooks yet</h2>
            <p className="mt-2 text-sm text-gray-600">
              The store is currently empty. Please check back later.
            </p>
          </section>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  Featured
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {featured.map((b) => (
                    <BookCard key={b.id} book={b} />
                  ))}
                </div>
              </section>
            )}
            {rest.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  All titles
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {rest.map((b) => (
                    <BookCard key={b.id} book={b} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

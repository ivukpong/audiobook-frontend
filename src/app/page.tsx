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
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Audiobook Store
        </h1>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-64 animate-pulse"
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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

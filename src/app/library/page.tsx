'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import BookCard from '@/components/book/BookCard';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Purchase } from '@/types';
import { Library, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function LibraryPage() {
  const { user, loading: authLoading, fetchMe } = useAuthStore();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    api.get('/purchases/library')
      .then(({ data }) => setPurchases(data))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-8">
          <Library size={22} className="text-brand" />
          <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
          {!loading && (
            <span className="ml-2 bg-brand-light text-brand text-sm font-medium px-2.5 py-0.5 rounded-full">
              {purchases.length} {purchases.length === 1 ? 'book' : 'books'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Your library is empty</h2>
            <p className="text-gray-400 text-sm mb-6">Purchase audiobooks to listen to them here</p>
            <Link href="/store"
              className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors">
              <ShoppingBag size={16} /> Browse store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {purchases.map((p) => (
              <BookCard key={p.id} book={p.book} owned />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

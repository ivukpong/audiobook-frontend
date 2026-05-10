'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import AudioPlayer from '@/components/player/AudioPlayer';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import type { Book } from '@/types';
import { Clock, ExternalLink, ShoppingCart, Headphones } from 'lucide-react';

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

const deviceId = typeof window !== 'undefined'
  ? (localStorage.getItem('deviceId') || (() => { const id = crypto.randomUUID(); localStorage.setItem('deviceId', id); return id; })())
  : 'ssr';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    api.get(`/books/${id}`).then(({ data }) => setBook(data)).catch(() => router.push('/store'));
    if (user) {
      api.get('/purchases/library').then(({ data }) => {
        setOwned(data.some((p: any) => p.bookId === id && p.status === 'COMPLETED'));
      }).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [id, user]);

  const handleBuy = async () => {
    if (!user) { router.push('/login'); return; }
    setBuying(true);
    try {
      const callbackUrl = `${window.location.origin}/payment-callback`;
      const { data } = await api.post('/purchases/initiate', { bookId: id, callbackUrl });
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not initiate payment');
      setBuying(false);
    }
  };

  const platforms = book ? [
    { url: book.spotifyUrl, label: 'Spotify', bg: '#1DB954', color: 'white' },
    { url: book.appleBooksUrl, label: 'Apple Books', bg: '#111', color: 'white' },
    { url: book.googlePlayUrl, label: 'Google Play', bg: '#4285F4', color: 'white' },
    { url: book.audibleUrl, label: 'Audible', bg: '#F47A1F', color: 'white' },
  ].filter((p) => p.url) : [];

  if (!book) return <><Navbar /><div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">Loading...</div></>;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-brand-light shadow-md">
              {book.coverUrl
                ? <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
                : <div className="h-full flex items-center justify-center text-6xl">📖</div>}
            </div>
          </div>
          <div className="md:col-span-2">
            <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
            <p className="text-gray-500 mt-1 mb-4">{book.author}</p>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-5">
              <span className="flex items-center gap-1"><Clock size={14} />{formatDuration(book.durationSec)}</span>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">{book.description}</p>

            {owned ? (
              <div className="bg-brand-light border border-brand/20 rounded-xl p-4 mb-6">
                <p className="text-brand font-medium flex items-center gap-2 mb-3"><Headphones size={18} /> You own this book — listen below</p>
                <AudioPlayer bookId={id} title={book.title} author={book.author} coverUrl={book.coverUrl} deviceId={deviceId} />
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: book.currency || 'NGN', maximumFractionDigits: 0 }).format(book.price)}
                  </span>
                  <span className="text-sm text-gray-400">Pay with Paystack</span>
                </div>
                <button onClick={handleBuy} disabled={buying}
                  className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <ShoppingCart size={18} /> {buying ? 'Redirecting...' : 'Buy now'}
                </button>
              </div>
            )}

            {platforms.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Also available on</p>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => (
                    <a key={p.label} href={p.url!} target="_blank" rel="noopener noreferrer"
                      style={{ background: p.bg, color: p.color }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                      <ExternalLink size={13} /> {p.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

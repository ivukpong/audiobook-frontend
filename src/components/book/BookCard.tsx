"use client";
import Image from "next/image";
import Link from "next/link";
import { Clock, Star } from "lucide-react";
import type { Book } from "@/types";

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function BookCard({
  book,
  owned,
}: {
  book: Book;
  owned?: boolean;
}) {
  const hasPlatforms =
    book.spotifyUrl ||
    book.appleBooksUrl ||
    book.googlePlayUrl ||
    book.audibleUrl;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-brand/40 hover:shadow-sm transition-all">
      <Link href={`/book/${book.id}`}>
        <div className="relative h-48 bg-brand-light overflow-hidden">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-5xl">
              📖
            </div>
          )}
          {book.featured && (
            <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star size={10} fill="currentColor" /> Featured
            </span>
          )}
          {owned && (
            <span className="absolute top-2 right-2 bg-brand text-white text-xs font-medium px-2 py-0.5 rounded-full">
              Owned
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="font-medium text-gray-900 line-clamp-1">{book.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-brand font-semibold">
              {formatPrice(book.price, book.currency)}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} />
              {formatDuration(book.durationSec)}
            </span>
          </div>
        </div>
      </Link>
      {hasPlatforms && (
        <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
          {book.spotifyUrl && (
            <a
              href={book.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-[#1DB954] text-white px-2 py-0.5 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Spotify
            </a>
          )}
          {book.appleBooksUrl && (
            <a
              href={book.appleBooksUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium hover:opacity-80 transition-opacity"
            >
              Apple Books
            </a>
          )}
          {book.googlePlayUrl && (
            <a
              href={book.googlePlayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Google Play
            </a>
          )}
          {book.audibleUrl && (
            <a
              href={book.audibleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Audible
            </a>
          )}
        </div>
      )}
    </div>
  );
}

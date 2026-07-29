"use client";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Book } from "@/types";

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
  const isCloudinaryCover = book.coverUrl?.includes("res.cloudinary.com/");

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-brand/40 hover:shadow-sm transition-all">
      <Link href={`/book/${book.id}`}>
        <div className="relative aspect-[3/4] bg-brand-light overflow-hidden">
          {isCloudinaryCover ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-4xl sm:text-5xl">
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
        <div className="p-3 sm:p-4">
          <p className="font-medium text-sm sm:text-base text-gray-900 line-clamp-1">
            {book.title}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
            {book.author}
          </p>
          <div className="flex items-center justify-between mt-2 sm:mt-3">
            <span className="text-brand font-semibold text-sm sm:text-base">
              {formatPrice(book.price, book.currency)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

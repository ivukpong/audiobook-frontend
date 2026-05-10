export interface User {
  id: string; name: string; email: string;
  role: 'ADMIN' | 'BUYER'; createdAt: string;
}
export interface Book {
  id: string; title: string; author: string; description: string;
  coverUrl: string; price: number; currency: string; durationSec: number;
  featured: boolean; published: boolean;
  spotifyUrl?: string; appleBooksUrl?: string;
  googlePlayUrl?: string; audibleUrl?: string; findawayUrl?: string;
  createdAt: string;
}
export interface Purchase {
  id: string; bookId: string; book: Book;
  amountPaid: number; currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'; createdAt: string;
}
export interface AuthTokens { accessToken: string; refreshToken: string; }

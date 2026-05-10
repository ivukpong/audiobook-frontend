'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Headphones, Library, ShoppingBag, LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => { fetchMe(); }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand">
          <Headphones size={20} />
          <span>Audora</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/store" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
            <ShoppingBag size={15} /> Store
          </Link>
          {user ? (
            <>
              <Link href="/library" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                <Library size={15} /> Library
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                  <Settings size={15} /> Admin
                </Link>
              )}
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1">
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">Login</Link>
              <Link href="/register" className="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

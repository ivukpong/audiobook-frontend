"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Headphones, Library, LogOut, Settings, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout, fetchMe } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    toast.success("Logged out");
    router.push("/");
  };

  const navLinkClass =
    "flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-brand"
        >
          <Headphones size={20} />
          <span>Audora</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {user ? (
            <>
              <Link href="/library" className={navLinkClass}>
                <Library size={15} /> Library
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className={navLinkClass}>
                  <Settings size={15} /> Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1"
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-3 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="sm:hidden flex items-center justify-center w-10 h-10 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {user ? (
            <>
              <Link href="/library" className={navLinkClass}>
                <Library size={16} /> Library
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className={navLinkClass}>
                  <Settings size={16} /> Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={navLinkClass}>
                Login
              </Link>
              <Link
                href="/register"
                className="px-3 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-center"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

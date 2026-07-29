import Link from "next/link";
import { Headphones } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mb-5">
          <Headphones size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors text-sm"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

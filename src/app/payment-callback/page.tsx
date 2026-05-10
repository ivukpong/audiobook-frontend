"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "success" | "failed";

function PaymentCallbackFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
        <Loader2 size={48} className="animate-spin text-brand mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-800">
          Verifying payment...
        </h1>
        <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [bookId, setBookId] = useState("");

  useEffect(() => {
    const reference =
      searchParams.get("reference") || searchParams.get("trxref");
    if (!reference) {
      setStatus("failed");
      return;
    }

    api
      .post(`/purchases/verify/${reference}`)
      .then(({ data }) => {
        setBookId(data.bookId);
        setStatus("success");
        setTimeout(() => router.push("/library"), 3000);
      })
      .catch(() => setStatus("failed"));
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2
              size={48}
              className="animate-spin text-brand mx-auto mb-4"
            />
            <h1 className="text-xl font-semibold text-gray-800">
              Verifying payment...
            </h1>
            <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={56} className="text-brand mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-800">
              Payment successful!
            </h1>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              Your book has been added to your library. Redirecting you now...
            </p>
            <Link
              href="/library"
              className="bg-brand text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors"
            >
              Go to library
            </Link>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle size={56} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-800">
              Payment could not be verified
            </h1>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              If money was deducted, please contact us — it will be resolved.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/store"
                className="bg-brand text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors"
              >
                Back to store
              </Link>
              <Link
                href="/library"
                className="border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                My library
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackFallback />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}

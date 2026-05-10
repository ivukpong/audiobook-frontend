"use client";
import { useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function PWAInstallBanner() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  const handleInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-50 flex items-start gap-3">
      <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center shrink-0">
        <Smartphone size={20} className="text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">Install Audora</p>
        {isIOS ? (
          <p className="text-xs text-gray-500 mt-0.5">
            Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>{" "}
            to install
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-0.5">
            Add to your home screen for quick access — works offline too
          </p>
        )}
        {!isIOS && (
          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-2 flex items-center gap-1.5 bg-brand text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            <Download size={13} />
            {installing ? "Installing..." : "Install app"}
          </button>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

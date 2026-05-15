"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import {
  getOfflineAudio,
  hasOfflineAudio,
  saveOfflineAudio,
} from "@/lib/offlineAudio";

interface Props {
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string;
  deviceId: string;
}

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export default function AudioPlayer({
  bookId,
  title,
  author,
  coverUrl,
  deviceId,
}: Props) {
  const isCloudinaryCover = coverUrl?.includes("res.cloudinary.com/");

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const urlRefreshTimer = useRef<NodeJS.Timeout>();
  const saveTimer = useRef<NodeJS.Timeout>();
  const offlineObjectUrlRef = useRef<string | null>(null);

  const clearOfflineObjectUrl = useCallback(() => {
    if (offlineObjectUrlRef.current) {
      URL.revokeObjectURL(offlineObjectUrlRef.current);
      offlineObjectUrlRef.current = null;
    }
  }, []);

  const refreshDownloadedState = useCallback(async () => {
    try {
      const available = await hasOfflineAudio(bookId);
      setIsDownloaded(available);
    } catch {
      setIsDownloaded(false);
    }
  }, [bookId]);

  const loadOffline = useCallback(
    async (seekTo?: number) => {
      const blob = await getOfflineAudio(bookId);
      if (!blob) return false;

      const audio = audioRef.current;
      if (!audio) return false;

      setLoading(true);
      setError("");
      setOfflineMode(true);
      clearTimeout(urlRefreshTimer.current);
      clearOfflineObjectUrl();

      const objectUrl = URL.createObjectURL(blob);
      offlineObjectUrlRef.current = objectUrl;
      const wasPlaying = !audio.paused;

      audio.src = objectUrl;
      audio.load();
      if (seekTo !== undefined) audio.currentTime = seekTo;
      if (wasPlaying) await audio.play().catch(() => undefined);

      setLoading(false);
      return true;
    },
    [bookId, clearOfflineObjectUrl],
  );

  const loadStream = useCallback(
    async (seekTo?: number) => {
      try {
        setLoading(true);
        setOfflineMode(false);
        const { data } = await api.get(`/playback/stream/${bookId}`, {
          headers: { "x-device-id": deviceId },
        });
        const audio = audioRef.current;
        if (!audio) return;
        const wasPlaying = !audio.paused;
        clearOfflineObjectUrl();
        audio.src = data.url;
        audio.load();
        if (seekTo !== undefined) audio.currentTime = seekTo;
        if (wasPlaying) await audio.play().catch(() => undefined);
        setLoading(false);
        // Refresh signed URL every 100s (before 120s TTL expires)
        clearTimeout(urlRefreshTimer.current);
        urlRefreshTimer.current = setTimeout(
          () => loadStream(audioRef.current?.currentTime),
          100_000,
        );
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load audio");
        setLoading(false);
      }
    },
    [bookId, deviceId, clearOfflineObjectUrl],
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await refreshDownloadedState();

      let savedProgress = 0;
      try {
        const { data } = await api.get(`/playback/progress/${bookId}`, {
          headers: { "x-device-id": deviceId },
        });
        savedProgress = data.progressSec || 0;
      } catch {
        savedProgress = 0;
      }

      if (cancelled) return;

      const loadedOffline = await loadOffline(savedProgress);
      if (!loadedOffline) {
        await loadStream(savedProgress);
      }
    };

    init();

    return () => {
      cancelled = true;
      clearTimeout(urlRefreshTimer.current);
      clearTimeout(saveTimer.current);
      clearOfflineObjectUrl();
    };
  }, [
    bookId,
    deviceId,
    loadStream,
    loadOffline,
    refreshDownloadedState,
    clearOfflineObjectUrl,
  ]);

  const downloadForOffline = async () => {
    try {
      setDownloading(true);
      setError("");
      const { data } = await api.get(`/playback/download/${bookId}`, {
        headers: { "x-device-id": deviceId },
        responseType: "blob",
      });

      const blob = data instanceof Blob ? data : new Blob([data]);
      await saveOfflineAudio(bookId, blob);
      setIsDownloaded(true);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Failed to download for offline use",
      );
    } finally {
      setDownloading(false);
    }
  };

  const saveProgress = useCallback(() => {
    const t = audioRef.current?.currentTime;
    if (t && t > 0) {
      api
        .post(
          `/playback/progress/${bookId}`,
          { progressSec: Math.floor(t) },
          { headers: { "x-device-id": deviceId } },
        )
        .catch(() => {});
    }
  }, [bookId, deviceId]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      saveProgress();
    } else {
      await audio.play();
      setPlaying(true);
    }
  };

  const skip = (sec: number) => {
    if (audioRef.current) audioRef.current.currentTime += sec;
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
    } else {
      setVolume(prevVolume);
      if (audioRef.current) audioRef.current.volume = prevVolume;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const toggleFullscreen = () => {
    if (!fullscreen && playerRef.current?.requestFullscreen) {
      playerRef.current.requestFullscreen();
      setFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const playerContent = (
    <div className="flex flex-col h-full gap-4">
      {error ? (
        <div
          className={`rounded-lg p-4 text-sm border ${
            fullscreen
              ? "bg-red-900/30 border-red-700 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {error}
        </div>
      ) : (
        <>
          {/* Cover and Info Section */}
          {fullscreen ? (
            <div className="grid grid-cols-[auto_1fr] gap-6 items-start">
              <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-purple-800/40 to-blue-800/40 flex items-center justify-center text-4xl shrink-0 overflow-hidden shadow-md">
                {isCloudinaryCover ? (
                  <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "📚"
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="font-bold text-2xl text-white">{title}</h3>
                <p className="text-lg text-gray-300">{author}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-base text-gray-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 bg-blue-900/40 text-blue-300">
                    {offlineMode ? "📥 Offline" : "🔒 Stream"}
                  </span>
                  <button
                    onClick={downloadForOffline}
                    disabled={downloading || isDownloaded}
                    className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed bg-white/10 text-gray-300 hover:bg-white/20"
                  >
                    {isDownloaded ? (
                      <>
                        <CheckCircle2 size={13} /> Saved
                      </>
                    ) : (
                      <>
                        <Download size={13} />{" "}
                        {downloading ? "Saving..." : "Download"}
                      </>
                    )}
                  </button>
                </div>
                {isDownloaded && (
                  <p className="text-sm font-medium text-emerald-400">
                    Available offline
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-4xl shrink-0 overflow-hidden shadow-md transition-all duration-200">
                {isCloudinaryCover ? (
                  <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "📚"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg text-gray-900 truncate">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 truncate">{author}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
                {isDownloaded && (
                  <p className="mt-1 font-medium text-xs text-emerald-600">
                    Available offline
                  </p>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <span className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 bg-blue-100 text-blue-700">
                  {offlineMode ? "📥 Offline" : "🔒 Stream"}
                </span>
                <button
                  onClick={downloadForOffline}
                  disabled={downloading || isDownloaded}
                  className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  {isDownloaded ? (
                    <>
                      <CheckCircle2 size={13} /> Saved
                    </>
                  ) : (
                    <>
                      <Download size={13} />{" "}
                      {downloading ? "Saving..." : "Download"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="flex-1 flex flex-col justify-center gap-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={seek}
              className={`w-full rounded-full appearance-none cursor-pointer accent-blue-600 ${
                fullscreen ? "h-3" : "h-2"
              }`}
              style={{
                background: fullscreen
                  ? `linear-gradient(to right, #2563eb 0%, #2563eb ${pct}%, #4b5563 ${pct}%, #4b5563 100%)`
                  : `linear-gradient(to right, #2563eb 0%, #2563eb ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
              }}
            />
          </div>

          {/* Playback Controls */}
          <div
            className={`flex items-center justify-center ${fullscreen ? "gap-6" : "gap-3"}`}
          >
            <button
              onClick={() => skip(-15)}
              className={`transition-colors p-2 rounded-full ${
                fullscreen
                  ? "text-gray-300 hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title="Back 15s"
            >
              <RotateCcw size={fullscreen ? 28 : 20} />
            </button>

            <button
              onClick={togglePlay}
              disabled={loading}
              className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 ${
                fullscreen ? "w-16 h-16" : "w-12 h-12"
              }`}
            >
              {loading ? (
                <span className="animate-spin text-xl">⏳</span>
              ) : playing ? (
                <Pause size={fullscreen ? 28 : 20} />
              ) : (
                <Play size={fullscreen ? 28 : 20} className="ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skip(30)}
              className={`transition-colors p-2 rounded-full ${
                fullscreen
                  ? "text-gray-300 hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title="Forward 30s"
            >
              <RotateCw size={fullscreen ? 28 : 20} />
            </button>
          </div>

          {/* Volume and Playback Speed Controls */}
          <div
            className={`flex items-center justify-between ${fullscreen ? "gap-6" : "gap-3"}`}
          >
            {/* Volume Control */}
            <div className="flex items-center gap-2 min-w-max">
              <button
                onClick={toggleMute}
                className={`p-1 rounded transition ${
                  fullscreen
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (audioRef.current) audioRef.current.volume = v;
                }}
                className={`w-20 h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 ${
                  fullscreen ? "bg-gray-600" : "bg-gray-200"
                }`}
              />
            </div>

            {/* Playback Speed Control */}
            <div className="flex items-center gap-2">
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    playbackRate === rate
                      ? "bg-blue-600 text-white"
                      : fullscreen
                        ? "bg-white/10 text-gray-300 hover:bg-white/20"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className={`p-1 rounded transition ${
                fullscreen
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      ref={playerRef}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 ${
        fullscreen
          ? "fixed inset-0 w-screen h-screen rounded-none border-0 z-50 flex flex-col justify-center p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "p-5"
      }`}
    >
      <audio
        ref={audioRef}
        controlsList="nodownload noplaybackrate"
        onTimeUpdate={() => {
          setCurrentTime(audioRef.current?.currentTime ?? 0);
          clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(saveProgress, 5000);
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => {
          setPlaying(false);
          saveProgress();
        }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {fullscreen ? (
        <div className="max-w-md mx-auto w-full text-white">
          {playerContent}
        </div>
      ) : (
        playerContent
      )}
    </div>
  );
}

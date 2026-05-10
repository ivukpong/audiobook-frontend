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
} from "lucide-react";
import api from "@/lib/api";

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
  const playerRef = useRef<HTMLDivElement>(null);
  const urlRefreshTimer = useRef<NodeJS.Timeout>();
  const saveTimer = useRef<NodeJS.Timeout>();

  const loadStream = useCallback(
    async (seekTo?: number) => {
      try {
        setLoading(true);
        const { data } = await api.get(`/playback/stream/${bookId}`, {
          headers: { "x-device-id": deviceId },
        });
        const audio = audioRef.current;
        if (!audio) return;
        const wasPlaying = playing;
        audio.src = data.url;
        audio.load();
        if (seekTo !== undefined) audio.currentTime = seekTo;
        if (wasPlaying) audio.play();
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
    [bookId, deviceId, playing],
  );

  useEffect(() => {
    // Load saved progress then stream
    api
      .get(`/playback/progress/${bookId}`, {
        headers: { "x-device-id": deviceId },
      })
      .then(({ data }) => loadStream(data.progressSec || 0))
      .catch(() => loadStream(0));
    return () => {
      clearTimeout(urlRefreshTimer.current);
      clearTimeout(saveTimer.current);
    };
  }, []);

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

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const playerContent = (
    <div className="flex flex-col h-full gap-4">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Cover and Info Section */}
          <div className="flex items-center gap-4">
            <div
              className={`${fullscreen ? "w-32 h-32" : "w-16 h-16"} rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-4xl shrink-0 overflow-hidden shadow-md transition-all duration-200`}
            >
              {coverUrl ? (
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
              <h3
                className={`font-bold text-gray-900 truncate ${fullscreen ? "text-2xl" : "text-lg"}`}
              >
                {title}
              </h3>
              <p
                className={`text-gray-600 truncate ${fullscreen ? "text-lg" : "text-sm"}`}
              >
                {author}
              </p>
              <p
                className={`text-gray-500 ${fullscreen ? "text-base" : "text-xs"} mt-1`}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium flex items-center gap-1 shrink-0">
              🔒 Stream
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 flex flex-col justify-center gap-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={seek}
              className={`w-full bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600 ${
                fullscreen ? "h-3" : "h-2"
              }`}
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
              }}
            />
          </div>

          {/* Playback Controls */}
          <div
            className={`flex items-center justify-center gap-${fullscreen ? 6 : 3}`}
          >
            <button
              onClick={() => skip(-15)}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors p-2 rounded-full"
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
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors p-2 rounded-full"
              title="Forward 30s"
            >
              <RotateCw size={fullscreen ? 28 : 20} />
            </button>
          </div>

          {/* Volume and Playback Speed Controls */}
          <div
            className={`flex items-center justify-between gap-${fullscreen ? 6 : 3}`}
          >
            {/* Volume Control */}
            <div className="flex items-center gap-2 min-w-max">
              <button
                onClick={toggleMute}
                className="text-gray-600 hover:text-gray-900 p-1 rounded transition"
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
                className="w-20 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
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
              className="text-gray-600 hover:text-gray-900 p-1 rounded transition"
            >
              <Maximize2 size={18} />
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

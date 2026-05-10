"use client";

import React, { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface FileUploadProps {
  type: "cover" | "media";
  onUploadComplete: (storageKey: string, fileName: string) => void;
  isUploading?: boolean;
}

export default function FileUpload({
  type,
  onUploadComplete,
  isUploading = false,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = type === "cover" ? "image/*" : "audio/*";
  const endpoint =
    type === "cover" ? "/admin/upload/cover" : "/admin/upload/media";
  const label = type === "cover" ? "Book Cover (Image)" : "Audio Media File";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (500MB max)
    if (selectedFile.size > 500 * 1024 * 1024) {
      setError("File size exceeds 500MB limit");
      return;
    }

    // Validate file type
    if (type === "cover" && !selectedFile.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (type === "media" && !selectedFile.type.startsWith("audio/")) {
      setError("Please select an audio file");
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccess("");
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setError("");

      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });

      const { storageKey } = response.data;
      setSuccess(`✓ Uploaded ${file.name}`);
      onUploadComplete(storageKey, file.name);
      setFile(null);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const event = {
        target: { files: [droppedFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || isUploading}
        />

        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        {file ? (
          <div>
            <p className="font-semibold text-gray-700">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-gray-700">
              Drag & drop or click to select
            </p>
            <p className="text-xs text-gray-500">
              Max 500MB {type === "cover" ? "image" : "audio"} file
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 flex items-center text-green-600 text-sm">
          <CheckCircle className="w-4 h-4 mr-2" />
          {success}
        </div>
      )}

      {file && !success && (
        <>
          {progress > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}%</p>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading || isUploading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={uploading || isUploading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

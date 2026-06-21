import React, { useState, useRef } from "react";

export default function FileUpload({
  onFileSelect,
  preview = null,
  label = "Upload File",
  accept = "image/*",
  maxSize = 5, // MB
}) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type
    if (accept === "image/*") {
      if (
        !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
          file.type,
        )
      ) {
        setError("Only JPEG, PNG, GIF, and WebP images are allowed");
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleFile = (file) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-gray-300 text-sm font-bold">{label}</label>

      {/* Preview */}
      {preview && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border-2 border-green-600 mb-3">
          {typeof preview === "string" ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-400">📷 Image Preview</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`w-full p-8 rounded-lg border-2 border-dashed cursor-pointer transition ${
          dragActive
            ? "border-red-600 bg-red-900 bg-opacity-20"
            : "border-gray-600 bg-gray-800 hover:border-red-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={handleChange}
          accept={accept}
        />

        <div className="text-center">
          <div className="text-4xl mb-2">📁</div>
          <p className="text-gray-300 font-bold mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-gray-400 text-sm">
            {accept === "image/*"
              ? "JPEG, PNG, GIF, WebP"
              : "Supported formats"}{" "}
            • Max {maxSize}MB
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 p-3 rounded text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

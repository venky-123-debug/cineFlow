import React from "react";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}

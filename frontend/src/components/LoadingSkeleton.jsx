import React from "react";

export default function LoadingSkeleton({ type = "card" }) {
  if (type === "table") {
    return (
      <div className="glass-panel rounded-3xl p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-800 rounded-lg w-1/4" />
        <div className="space-y-3 pt-4">
          <div className="grid grid-cols-6 gap-4 border-b border-gray-800 pb-2">
            <div className="h-4 bg-gray-800 rounded col-span-2" />
            <div className="h-4 bg-gray-800 rounded" />
            <div className="h-4 bg-gray-800 rounded" />
            <div className="h-4 bg-gray-800 rounded" />
            <div className="h-4 bg-gray-800 rounded" />
          </div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="grid grid-cols-6 gap-4 py-2 border-b border-gray-800/40">
              <div className="h-4 bg-gray-850 rounded col-span-2" />
              <div className="h-4 bg-gray-850 rounded" />
              <div className="h-4 bg-gray-850 rounded" />
              <div className="h-4 bg-gray-850 rounded" />
              <div className="h-4 bg-gray-850 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-800 rounded w-1/3" />
        <div className="h-8 bg-gray-800 rounded-lg w-8" />
      </div>
      <div className="h-8 bg-gray-800 rounded w-1/2" />
      <div className="h-3 bg-gray-800 rounded w-2/3" />
    </div>
  );
}

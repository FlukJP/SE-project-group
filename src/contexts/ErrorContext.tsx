"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ErrorContextValue {
  showError: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextValue>({ showError: () => {} });

export function useError() {
  return useContext(ErrorContext);
}

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showError = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {message && (
        <ErrorModal message={message} onClose={() => setMessage(null)} />
      )}
    </ErrorContext.Provider>
  );
}

function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col items-center gap-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-zinc-800 text-center">เกิดข้อผิดพลาด</h2>

        {/* Message */}
        <p className="text-sm text-zinc-600 text-center leading-relaxed">{message}</p>

        {/* OK Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition text-sm"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}

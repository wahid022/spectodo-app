"use client";

type Props = { message: string; onRetry: () => void };

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
      <span className="flex-1">{message}</span>
      <button
        onClick={onRetry}
        className="shrink-0 rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}

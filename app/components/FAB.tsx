"use client";
import { motion } from "framer-motion";

type Props = {
  onClick: () => void;
};

export default function FAB({ onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      aria-label="Add new task"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-300 dark:shadow-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
      whileHover={{ scale: 1.08, backgroundColor: "#4f46e5" }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </motion.button>
  );
}

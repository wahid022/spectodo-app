"use client";
import { useEffect } from "react";
import { registerSW } from "@/lib/notificationService";
import { initAudio } from "@/lib/reminderAudio";

export default function ClientInit() {
  useEffect(() => {
    initAudio();
    registerSW();
  }, []);
  return null;
}

"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isConnected = useAppStore((state) => state.isConnected);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && !isConnected) {
      router.push("/");
    }
  }, [isConnected, router, mounted]);

  if (!mounted || !isConnected) return null; // Avoid flicker before redirect

  return <AppLayout>{children}</AppLayout>;
}

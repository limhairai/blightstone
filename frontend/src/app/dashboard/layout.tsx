"use client";

import { AppShell } from "@/components/app-shell";
import type React from "react";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
} 
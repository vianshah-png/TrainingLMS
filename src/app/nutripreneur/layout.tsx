"use client";

import { ViewProvider } from "@/components/nutripreneur/ViewProvider";

export default function NutripreneurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewProvider>
      {children}
    </ViewProvider>
  );
}

"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export const AppNavbar = () => {
  return (
    <header className="w-full border-b-2 border-black bg-white dark:bg-zinc-900 flex items-center justify-between px-6 py-3">
      <SidebarTrigger className="p-2 border-2 border-black hover:scale-105 transition-transform bg-[#0ea5a4] text-white font-bold" />

      <h1 className="text-xl font-extrabold uppercase tracking-wide text-black dark:text-white">
        FitConquer
      </h1>

      <div className="flex items-center gap-4">
      </div>
    </header>
  );
};

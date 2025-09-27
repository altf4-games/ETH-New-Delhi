"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const AppNavbar = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    auth.disconnect();
    navigate('/');
  };

  return (
    <header className="w-full border-b-2 border-black bg-white dark:bg-zinc-900 flex items-center justify-between px-6 py-3">
      <SidebarTrigger className="p-2 border-2 border-black hover:scale-105 transition-transform bg-[#0ea5a4] text-white font-bold" />

      <h1 className="text-xl font-extrabold uppercase tracking-wide text-black dark:text-white">
        FitConquer
      </h1>

      <div className="flex items-center gap-4">
        {auth.isBothConnected && (
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="font-bold text-green-600">✓</span> Wallet & Strava Connected
            </div>
            <Button
              variant="neutral"
              size="sm"
              onClick={handleDisconnect}
              className="border-2 border-black font-bold hover:bg-gray-100"
            >
              Disconnect
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const AppNavbar = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    auth.disconnect();
    navigate("/");
  };

  return (
    <header className="w-full border-b-2 border-black bg-white dark:bg-zinc-900 flex items-center justify-between px-4 sm:px-6 py-3 flex-wrap gap-3">
      <SidebarTrigger className="p-2 border-2 border-black hover:scale-105 transition-transform bg-[#0ea5a4] text-white font-bold" />

      <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-black dark:text-white">
        FitConquer
      </h1>

      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
        {auth.isBothConnected && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="truncate max-w-[120px] sm:max-w-none">
              <span className="font-bold text-green-600">✓</span>{" "}
              <span className="hidden sm:inline">Wallet & Strava Connected</span>
              <span className="sm:hidden">Wallet & Strava Connected</span>
            </div>
            <Button
              size="sm"
              onClick={handleDisconnect}
              className="border-2 border-black bg-transparent font-bold hover:bg-gray-100 px-2 sm:px-3"
            >
              Disconnect
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { Home, Images, LogOut, DollarSign } from "lucide-react";

export const AppSidebar = () => {
  const [activeTab, setActiveTab] = useState<"home" | "gallery" | "leaderboard">("home");
  const navigate = useNavigate();

  const handleNavigate = (tab: typeof activeTab, route: string) => {
    setActiveTab(tab);
    navigate(route);
  };

  const handleLogout = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({
          method: "eth_accounts",
          params: []
        });

        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }]
        });
      }
    } catch (error) {
      console.error('Error disconnecting from MetaMask:', error);
    } finally {
      localStorage.removeItem('walletAddress');
      navigate('/');
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="bg-white dark:bg-zinc-900 text-black dark:text-white border-r-4 border-black"
    >
      <SidebarHeader className="p-[10px] flex justify-center">
        <h1 className="text-2xl font-extrabold uppercase tracking-tighter">
          <span className="hidden group-data-[state=expanded]:block">FitConquer</span>
          <span className="block group-data-[state=collapsed]:block item group-data-[state=expanded]:hidden">
            FC
          </span>
        </h1>
      </SidebarHeader>

      <SidebarContent className="mt-6 px-2">
        <SidebarMenu className="space-y-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigate("home", "/user/home")}
              isActive={activeTab === "home"}
              className={`px-4 py-3 text-lg border-4 border-black    font-bold uppercase 
                transition-transform hover:scale-100
                ${
                  activeTab === "home"
                    ? "bg-[#0ea5a4] text-white"
                    : "bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                }`}
            >
              <Home className="w-6 h-6" />
              <span>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigate("gallery", "/user/nft-gallery")}
              isActive={activeTab === "gallery"}
              className={`px-4 py-3 text-lg border-4 border-black    font-bold uppercase 
                transition-transform hover:scale-100
                ${
                  activeTab === "gallery"
                    ? "bg-[#0ea5a4] text-white"
                    : "bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                }`}
            >
              <Images className="w-6 h-6" />
              <span>NFT Gallery</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigate("leaderboard", "/user/market-place")}
              isActive={activeTab === "leaderboard"}
              className={`px-4 py-3 text-lg border-4 border-black    font-bold uppercase 
                transition-transform hover:scale-100
                ${
                  activeTab === "leaderboard"
                    ? "bg-[#0ea5a4] text-white"
                    : "bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                }`}
            >
              <DollarSign  className="w-6 h-6" />
              <span>Market Place</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="px-4 py-3 text-lg border-4 border-black    font-bold uppercase bg-white hover:bg-red-500 hover:text-white transition-transform hover:scale-100"
            >
              <LogOut className="w-6 h-6" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

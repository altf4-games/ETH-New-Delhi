import { useState } from "react";
import { Home, Wallet, CircleHelp, Blocks, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const auth = useAuth();

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsOpen(false);
    }
  };

  return (
    <nav className="w-full border-b-4 border-black bg-white z-50 top-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => scrollToSection("home")}
        >
          <h1 className="text-2xl font-extrabold">
            Fit<span className="text-[#111]">Conquer</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button
            className="flex items-center gap-2 bg-white hover:bg-[#fef3c7] border-4 border-black font-bold rounded-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            onClick={() => scrollToSection("home")}
          >
            <Home className="w-4 h-4" /> Home
          </Button>
          <Button
            className="flex items-center gap-2 bg-white border-4 border-black font-bold rounded-md hover:bg-[#fef3c7] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            onClick={() => scrollToSection("features")}
          >
            <Blocks className="w-4 h-4" /> Features
          </Button>
          <Button
            className="flex items-center gap-2 bg-white hover:bg-[#fef3c7] border-4 border-black font-bold rounded-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            onClick={() => scrollToSection("faq")}
          >
            <CircleHelp className="w-4 h-4" /> FAQ
          </Button>
        </div>

        {auth.isWalletConnected && auth.walletAddress ? (
          <div className="hidden md:flex items-center gap-2 bg-green-100 text-green-800 border-4 border-black font-bold rounded-md px-4 py-2">
            <Wallet className="w-4 h-4" />
            <span className="font-mono text-sm">{auth.formatWalletAddress(auth.walletAddress)}</span>
            <button
              onClick={auth.disconnect}
              className="ml-2 text-red-600 hover:text-red-800 text-xs"
              title="Disconnect wallet"
            >
              ×
            </button>
          </div>
        ) : (
          <Button 
            className="hidden md:flex items-center gap-2 bg-[#ec4899] text-white border-4 border-black font-bold rounded-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            onClick={auth.connectWallet}
          >
            <Wallet className="w-4 h-4" /> Connect Wallet
          </Button>
        )}

        <button
          className="md:hidden p-2 border-2 border-black rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t-4 border-black flex flex-col items-start px-6 py-4 gap-3">
          <Button
            className="w-full justify-start gap-2 bg-white border-4 border-black font-bold rounded-md hover:bg-[#fef3c7]"
            onClick={() => scrollToSection("home")}
          >
            <Home className="w-4 h-4" /> Home
          </Button>
          <Button
            className="w-full justify-start gap-2 bg-white border-4 border-black font-bold rounded-md hover:bg-[#fef3c7]"
            onClick={() => scrollToSection("features")}
          >
            <Blocks className="w-4 h-4" /> Features
          </Button>
          <Button
            className="w-full justify-start gap-2 bg-white border-4 border-black font-bold rounded-md hover:bg-[#fef3c7]"
            onClick={() => scrollToSection("faq")}
          >
            <CircleHelp className="w-4 h-4" /> FAQ
          </Button>
          {auth.isWalletConnected && auth.walletAddress ? (
            <div className="w-full flex items-center justify-between gap-2 bg-green-100 text-green-800 border-4 border-black font-bold rounded-md px-4 py-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="font-mono text-sm">{auth.formatWalletAddress(auth.walletAddress)}</span>
              </div>
              <button
                onClick={auth.disconnect}
                className="text-red-600 hover:text-red-800 text-xs"
                title="Disconnect wallet"
              >
                ×
              </button>
            </div>
          ) : (
            <Button 
              className="w-full justify-start gap-2 bg-[#ec4899] text-white border-4 border-black font-bold rounded-md"
              onClick={auth.connectWallet}
            >
              <Wallet className="w-4 h-4" /> Connect Wallet
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}

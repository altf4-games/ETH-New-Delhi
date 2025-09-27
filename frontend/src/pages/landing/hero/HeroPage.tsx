import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroPage() {

    const navigate=useNavigate();

  return (
    <section className="min-h-screen bg-[#a5f3fc] py-20 flex items-center">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 text-[#155e75] leading-none">
          CONQUER YOUR CITY.
          <br />
          EARN <span className="text-[#ec4899]">NFTS</span>
        </h1>

        <p className="text-xl md:text-2xl font-bold mb-12 text-[#155e75] max-w-3xl mx-auto p-4 border-[#155e75]">
          Connect Strava, capture real-world zones, and mint them as NFTs. Own
          the streets you run and compete for territory dominance.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <Button className="bg-gray-800 text-white font-extrabold text-lg px-8 py-4   hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            onClick={()=>navigate("/user/home")}
          >
            🦊 CONNECT WALLET (METAMASK)
          </Button>

          <Button className="bg-[#ec4899] text-white font-extrabold text-lg px-8 py-4   hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
            <Link/> CONNECT STRAVA
          </Button>
        </div>
      </div>
    </section>
  );
}

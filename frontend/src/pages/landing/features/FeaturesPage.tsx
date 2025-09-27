import { MapIcon, TrophyIcon, ImagesIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FeaturesPage() {
  return (
    <section className="min-h-screen bg-white py-20 px-6 flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-6xl font-black uppercase text-center mb-16 text-black">
          HOW IT <span className="text-[#ec4899]">WORKS</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 text-center border-4 border-black  ">
            <CardContent>
              <MapIcon className="mx-auto mb-6 h-16 w-16 text-black" />
              <h3 className="text-2xl font-black uppercase mb-4">MAP ZONES</h3>
              <p className="text-lg font-bold">
                Explore your city.
                <br />
                Each zone can be captured and owned.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 text-center border-4 border-black   bg-[#ec4899]/10">
            <CardContent>
              <TrophyIcon className="mx-auto mb-6 h-16 w-16 text-black" />
              <h3 className="text-2xl font-black uppercase mb-4">LEADERBOARD</h3>
              <p className="text-lg font-bold">
                Compete with runners worldwide.
                <br />
                Climb the ranks and become the ultimate territory owner.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 text-center border-4 border-black   bg-[#0ea5a4]/10">
            <CardContent>
              <ImagesIcon className="mx-auto mb-6 h-16 w-16 text-black" />
              <h3 className="text-2xl font-black uppercase mb-4">NFT GALLERY</h3>
              <p className="text-lg font-bold">
                View, trade, and showcase your captured zones.
                <br />
                Each zone is a unique NFT with decay mechanics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function Home() {

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="grid lg:grid-cols-3 gap-8 h-[800px]">
        <div className="lg:col-span-1 flex flex-col gap-8 h-full">
          <Card className="border-4  flex-1">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-[#ec4899] border-4 border-black rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl font-black text-white">C</span>
              </div>
              <CardTitle className="text-2xl font-black uppercase">
                Runner Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-4 border-black bg-white p-3 font-mono text-sm">
                0x1234...5678
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-4 border-black bg-[#0ea5a4] p-3 text-center">
                  <div className="text-2xl font-black">247</div>
                  <div className="text-sm font-bold uppercase">Total KM</div>
                </div>
                <div className="border-4 border-black bg-[#fbbf24] p-3 text-center">
                  <div className="text-2xl font-black">12</div>
                  <div className="text-sm font-bold uppercase">Zones Owned</div>
                </div>
              </div>
              <div className="border-4 border-black bg-[#ec4899] p-3 text-center text-white">
                <div className="text-2xl font-black">#7</div>
                <div className="text-sm font-bold uppercase">Global Rank</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-[#fef3c7] flex-1">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase">
                Latest Run
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-bold">Distance:</span>
                <span className="font-black">8.5 KM</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Points:</span>
                <span className="font-black">+450</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Elevation:</span>
                <span className="font-black">127m</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Time:</span>
                <span className="font-black">42:15</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="default" className="w-full font-extrabold">
                    Capture Zone: Mint NFT
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col h-full">
          <Card className="border-4 border-black flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-3xl font-black uppercase">
                Zone Map
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-full bg-white border-4 border-black relative">
                

                <div className="absolute bottom-4 right-4 bg-white border-4 border-black p-3 text-left">
                  <h4 className="font-bold uppercase text-sm mb-2">Legend</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#0ea5a4] border-2 border-black"></div>
                      <span className="font-bold">Your Zones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#d1d5db] border-2 border-black"></div>
                      <span className="font-bold">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#ec4899] border-2 border-black"></div>
                      <span className="font-bold">Others</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button className="font-extrabold">Explore All Zones</Button>
              <Button variant="default" className="font-extrabold">
                View Leaderboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

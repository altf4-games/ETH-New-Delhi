import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth"; // <-- Strava hook
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonRunning } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const { address, formatAddress, isConnected, isLoading } = useWallet();
  const auth = useAuth();

  const displayAddress =
    isConnected && address ? formatAddress(address) : "0x1234...5678";

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase mb-4">
          MY <span className="text-[#0ea5a4]">DASHBOARD</span>
        </h1>
        <p className="text-xl font-bold text-gray-700">
          View your latest stats, recent run, and captured zones on the map.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          {/* Runner Stats */}
          <Card className="border-4 flex-1">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-[#ec4899] border-4 border-black rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {auth.stravaAthlete?.profile_picture ? (
                  <img
                    src={auth.stravaAthlete.profile_picture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-white">
                    {auth.stravaAthlete?.name?.[0] || "R"}
                  </span>
                )}
              </div>
              <CardTitle className="text-2xl font-black uppercase">
                Runner Stats
              </CardTitle>
              {auth.stravaAthlete?.name && (
                <p className="mt-2 text-lg font-bold text-gray-700">
                  {auth.stravaAthlete.name}
                  {auth.stravaAthlete.username && (
                    <span className="text-sm text-gray-500 ml-2">
                      @{auth.stravaAthlete.username}
                    </span>
                  )}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Wallet Info */}
              <div className="border-4 border-black bg-white p-3 font-mono text-sm">
                {isLoading ? (
                  <div className="animate-pulse">Loading wallet...</div>
                ) : isConnected ? (
                  <div className="flex items-center justify-between">
                    <span>{displayAddress}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border">
                      Connected
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Not connected</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border">
                      Disconnected
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border-4 border-black bg-[#0ea5a4] p-3 text-center">
                  <div className="text-2xl font-black">42</div>
                  <div className="text-sm font-bold uppercase">Total KM</div>
                </div>
                <div className="border-4 border-black bg-[#fbbf24] p-3 text-center">
                  <div className="text-2xl font-black">4</div>
                  <div className="text-sm font-bold uppercase">Zones Owned</div>
                </div>
              </div>

              {/* CTA Button */}
              <Button className="w-full border-4 border-black bg-[#ec4899] text-white py-4 flex items-center justify-center gap-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <FontAwesomeIcon className="text-2xl" icon={faPersonRunning} />
                <span className="text-lg font-extrabold uppercase">
                  Start New Run
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Latest Run */}
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
              <Button
                variant="default"
                className="w-full font-extrabold"
                disabled={!isConnected}
              >
                {isConnected
                  ? "Capture Zone: Mint NFT"
                  : "Connect Wallet to Mint"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Zone Map */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="border-4 border-black flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-3xl font-black uppercase">
                Zone Map
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[500px]">
              <div className="h-full bg-white border-4 border-black relative">
                {/* Legend */}
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

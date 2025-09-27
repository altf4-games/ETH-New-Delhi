import React, { useState, useEffect } from "react";
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
import { useStravaStats } from "@/hooks/useStravaStats"; // <-- New Strava stats hook
import { StravaService } from "@/services/stravaService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonRunning, faStop, faRefresh } from "@fortawesome/free-solid-svg-icons";
import EnhancedTomTomMap from "@/components/custom/map/EnhancedTomTomMap";
import type { ZoneMarker } from "@/components/custom/map/EnhancedTomTomMap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Timer component to prevent full page re-renders
const RunTimer = ({ onTick }: { onTick: React.Dispatch<React.SetStateAction<number>> }) => {
  useEffect(() => {
    const interval = setInterval(() => {
      onTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [onTick]);

  return null;
};

// Memoized map container to prevent re-renders
const MapContainer = React.memo(() => {
  const handleZoneClick = React.useCallback((zone: ZoneMarker) => {
    console.log('Zone clicked:', zone);
    if (zone.type === 'available') {
      alert(`Start running to capture ${zone.title}! You'll earn ${zone.points} points.`);
    } else if (zone.type === 'owned') {
      alert(`You own ${zone.title}! Points earned: ${zone.points}`);
    } else {
      alert(`${zone.title} is owned by another runner.`);
    }
  }, []);

  return (
    <div className="h-full relative">
      <EnhancedTomTomMap 
        className="w-full h-full"
        center={[77.2090, 28.6139]}
        zoom={12}
        onZoneClick={handleZoneClick}
      />

      <div className="absolute bottom-4 right-4 bg-white border-4 border-black p-3 text-left z-10">
        <h4 className="font-bold uppercase text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#0ea5a4] border-2 border-black"></div>
            <span className="font-bold">Your Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#10b981] border-2 border-black"></div>
            <span className="font-bold">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ec4899] border-2 border-black"></div>
            <span className="font-bold">Others</span>
          </div>
        </div>
      </div>
    </div>
  );
}, () => true); // Always return true to prevent any re-renders

MapContainer.displayName = 'MapContainer';

export default function Home() {
  const { address, formatAddress, isConnected, isLoading } = useWallet();
  const auth = useAuth();
  
  // Get access token from localStorage when Strava is connected
  const stravaAccessToken = auth.isStravaConnected ? localStorage.getItem('stravaAccessToken') : null;
  
  const { stats: stravaStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useStravaStats(stravaAccessToken);
  const [isRunning, setIsRunning] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [timer, setTimer] = useState(0);
  const [startLoading, setStartLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Array<{lat: number, lng: number}>>([]);

  // Check for existing running activity on component mount
  useEffect(() => {
    const checkRunningStatus = async () => {
      if (!address) return;
      
      try {
        const status = await StravaService.getCurrentRunStatus(address);
        if (status.isRunning && status.activity) {
          setIsRunning(true);
          setActivityId(status.activity.activityId || null);
          
          // Calculate elapsed time from start time
          const startTime = new Date(status.activity.startTime);
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          setTimer(elapsedSeconds);
          
          if (status.activity.startLocation) {
            setStartLocation(status.activity.startLocation);
          }
        }
      } catch (error) {
        console.error('Failed to check running status:', error);
      }
    };

    checkRunningStatus();
  }, [address]);

  const startRun = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    setStartLoading(true);
    try {
      // Get current location if available
      let location: {lat: number, lng: number} | undefined;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            });
          });
          
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setStartLocation(location);
        } catch (geoError) {
          console.warn('Could not get location:', geoError);
        }
      }

      // Start the run via API
      const result = await StravaService.startRun(address, location);
      
      setIsRunning(true);
      setShowConfirmDialog(false);
      setActivityId(result.activityId);
      setTimer(0);
      setCurrentRoute(location ? [location] : []);
      
      console.log('Run started:', result);
    } catch (error) {
      console.error('Failed to start run:', error);
      alert(`Failed to start run: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setStartLoading(false);
    }
  };

  const [lastRunTime, setLastRunTime] = useState("42:15");

  const endRun = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    setEndLoading(true);
    try {
      // Get current location if available
      let endLocation: {lat: number, lng: number} | undefined;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            });
          });
          
          endLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (geoError) {
          console.warn('Could not get end location:', geoError);
        }
      }

      // End the run via API
      const result = await StravaService.endRun(address, {
        endLocation,
        totalDuration: timer,
        routeData: currentRoute.length > 0 ? currentRoute : undefined
      });

      setIsRunning(false);
      setLastRunTime(formatTime(timer));
      setTimer(0);
      setActivityId(null);
      setStartLocation(null);
      setCurrentRoute([]);
      
      // Refresh stats to show the new activity
      if (refetchStats) {
        refetchStats();
      }
      
      console.log('Run ended:', result);
      alert(`Run completed! ${result.message}`);
    } catch (error) {
      console.error('Failed to end run:', error);
      alert(`Failed to end run: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEndLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Map click handling is now in the MapContainer component

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
                  <div className="text-2xl font-black">
                    {statsLoading ? (
                      <div className="animate-pulse">...</div>
                    ) : statsError ? (
                      <span className="text-sm">Error</span>
                    ) : (
                      stravaStats?.totalKilometers?.toFixed(1) || '0'
                    )}
                  </div>
                  <div className="text-sm font-bold uppercase">Total KM</div>
                </div>
                <div className="border-4 border-black bg-[#fbbf24] p-3 text-center">
                  <div className="text-2xl font-black">
                    {statsLoading ? (
                      <div className="animate-pulse">...</div>
                    ) : (
                      stravaStats?.totalActivities || 4
                    )}
                  </div>
                  <div className="text-sm font-bold uppercase">Total Runs</div>
                </div>
                <div className="border-4 border-black bg-[#ec4899] p-3 text-center">
                  <div className="text-2xl font-black">
                    {statsLoading ? (
                      <div className="animate-pulse">...</div>
                    ) : (
                      stravaStats?.recentKilometers?.toFixed(1) || '0'
                    )}
                  </div>
                  <div className="text-sm font-bold uppercase">Recent KM</div>
                  <div className="text-xs font-normal">(30 days)</div>
                </div>
                <div className="border-4 border-black bg-[#10b981] p-3 text-center">
                  <div className="text-2xl font-black">
                    {statsLoading ? (
                      <div className="animate-pulse">...</div>
                    ) : (
                      Math.round(stravaStats?.totalElevationGain || 0)
                    )}
                  </div>
                  <div className="text-sm font-bold uppercase">Elevation</div>
                  <div className="text-xs font-normal">(meters)</div>
                </div>
              </div>

              {/* Refresh Stats Button */}
              {auth.isStravaConnected && (
                <Button 
                  variant="neutral"
                  className="w-full border-2 border-gray-300 text-gray-700 font-bold text-sm py-2 hover:bg-gray-100"
                  onClick={refetchStats}
                  disabled={statsLoading}
                >
                  <FontAwesomeIcon 
                    icon={faRefresh} 
                    className={`mr-2 ${statsLoading ? 'animate-spin' : ''}`} 
                  />
                  {statsLoading ? 'Updating...' : 'Refresh Stats'}
                </Button>
              )}

              {/* Error Display */}
              {statsError && auth.isStravaConnected && (
                <div className="border-2 border-red-300 bg-red-50 p-3 text-center">
                  <div className="text-red-700 text-sm font-bold mb-2">
                    ⚠️ Strava Token Issue
                  </div>
                  <div className="text-red-600 text-xs mb-2">
                    {statsError.includes('expired') || statsError.includes('reconnect') ? 
                      'Your Strava access token has expired or is invalid. Strava tokens expire every 6 hours for security.' :
                      'There was an issue connecting to Strava. This might be due to network issues or API limits.'
                    }
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-orange-500 text-white font-bold text-xs py-2"
                      onClick={() => refetchStats()}
                      disabled={statsLoading}
                    >
                      {statsLoading ? '⏳ Refreshing...' : '🔄 Try Again'}
                    </Button>
                    {(statsError.includes('expired') || statsError.includes('reconnect')) && (
                      <Button
                        className="flex-1 bg-red-500 text-white font-bold text-xs py-2"
                        onClick={() => {
                          // Clear all Strava data and prompt for reconnection
                          StravaService.clearTokens();
                          window.location.reload();
                        }}
                      >
                        � Reconnect Strava
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Running Timer */}
              {isRunning && (
                <div className="border-4 border-black bg-black p-3 text-center text-orange-400">
                  <div className="text-3xl font-black font-mono">{formatTime(timer)}</div>
                  <div className="text-sm font-bold uppercase mt-2">Current Run</div>
                </div>
              )}

              {/* CTA Button */}
              {isRunning ? (
                <Button 
                  className="w-full border-4 border-black bg-red-500 text-white py-4 flex items-center justify-center gap-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={endRun}
                  disabled={endLoading}
                >
                  {endLoading ? (
                    <div className="animate-spin text-2xl">⏳</div>
                  ) : (
                    <FontAwesomeIcon className="text-2xl" icon={faStop} />
                  )}
                  <span className="text-lg font-extrabold uppercase">
                    {endLoading ? 'Ending Run...' : 'End Run'}
                  </span>
                </Button>
              ) : (
                <Button 
                  className="w-full border-4 border-black bg-[#ec4899] text-white py-4 flex items-center justify-center gap-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={startLoading || !isConnected}
                >
                  {startLoading ? (
                    <div className="animate-spin text-2xl">⏳</div>
                  ) : (
                    <FontAwesomeIcon className="text-2xl" icon={faPersonRunning} />
                  )}
                  <span className="text-lg font-extrabold uppercase">
                    {startLoading ? 'Starting...' : !isConnected ? 'Connect Wallet First' : 'Start New Run'}
                  </span>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Latest Run */}
          <Card className="border-4 border-black bg-[#fef3c7] flex-1">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase">
                {isRunning ? "Current Run" : "Latest Run"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {auth.isStravaConnected && stravaStats?.lastActivity ? (
                <>
                  <div className="flex justify-between">
                    <span className="font-bold">Activity:</span>
                    <span className="font-black text-right flex-1 ml-2 truncate">
                      {stravaStats.lastActivity.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Distance:</span>
                    <span className="font-black">{stravaStats.lastActivity.distance} KM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Time:</span>
                    <span className="font-black">
                      {isRunning 
                        ? formatTime(timer) 
                        : `${Math.floor(stravaStats.lastActivity.movingTime / 60)}:${String(stravaStats.lastActivity.movingTime % 60).padStart(2, '0')}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Date:</span>
                    <span className="font-black">
                      {new Date(stravaStats.lastActivity.date).toLocaleDateString()}
                    </span>
                  </div>
                </>
              ) : (
                <>
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
                    <span className="font-black">{isRunning ? formatTime(timer) : lastRunTime}</span>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="default"
                className="w-full font-extrabold"
                disabled={!isConnected || isRunning}
              >
                {!isConnected
                  ? "Connect Wallet to Mint"
                  : isRunning
                  ? "Finish Run to Mint"
                  : "Capture Zone: Mint NFT"}
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
            <CardContent className="flex-1">
              <MapContainer />
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

      {/* Timer Component */}
      {isRunning && <RunTimer onTick={setTimer} />}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Start New Run</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-lg font-bold text-center mb-2">Are you sure you want to start your run?</p>
            <p className="text-sm text-gray-600 text-center">
              Your location will be tracked to capture zones and calculate points.
            </p>
          </div>
          <DialogFooter className="flex gap-4">
            <Button
              className="flex-1 border-4 border-black bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setShowConfirmDialog(false)}
              disabled={startLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 border-4 border-black bg-[#ec4899] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={startRun}
              disabled={startLoading}
            >
              {startLoading ? 'Starting...' : 'Start Run'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

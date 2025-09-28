import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { useFitnessRuns } from '../../../hooks/useFitnessRuns';
import { useAuth } from '../../../hooks/useAuth';
import { StravaService } from '../../../services/stravaService';
import NFTService from '../../../services/nftService';
import { Loader2, Timer, Target, DollarSign, CheckCircle, RefreshCw, Trophy } from 'lucide-react';

export const ActiveRun: React.FC = () => {
  const { activeRun, completeRun, loading } = useFitnessRuns();
  const auth = useAuth();
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [actualDistance, setActualDistance] = useState('');
  const [actualTime, setActualTime] = useState('');
  const [completing, setCompleting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loadingStravaData, setLoadingStravaData] = useState(false);
  const [stravaDataLoaded, setStravaDataLoaded] = useState(false);

  // Update elapsed time every second
  useEffect(() => {
    if (!activeRun || activeRun.completed) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeRun.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRun]);

  // Function to load latest Strava activity data
  const loadLatestStravaActivity = async () => {
    if (!auth.isStravaConnected) {
      alert('Please connect to Strava first to auto-populate run data.');
      return;
    }

    setLoadingStravaData(true);
    try {
      console.log('Loading Strava stats...');
      const stats = await StravaService.getStats();
      console.log('Received Strava stats:', stats);
      
      if (stats.lastActivity) {
        console.log('Processing last activity:', stats.lastActivity);
        
        // Convert distance from km to meters and time from seconds to seconds
        const distanceInMeters = Math.round(stats.lastActivity.distance * 1000);
        const timeInSeconds = stats.lastActivity.movingTime;
        
        console.log('Converted values:', {
          originalDistance: stats.lastActivity.distance,
          convertedDistance: distanceInMeters,
          originalTime: stats.lastActivity.movingTime,
          convertedTime: timeInSeconds
        });
        
        if (distanceInMeters > 0 && timeInSeconds > 0) {
          setActualDistance(distanceInMeters.toString());
          setActualTime(timeInSeconds.toString());
          setStravaDataLoaded(true);
          
          console.log('Successfully loaded Strava activity data');
          alert(`Loaded data from "${stats.lastActivity.name}": ${(distanceInMeters/1000).toFixed(1)}km in ${Math.floor(timeInSeconds/60)}:${(timeInSeconds%60).toString().padStart(2,'0')}`);
        } else {
          alert(`The latest Strava activity "${stats.lastActivity.name}" has no distance or time data. This might be an incomplete activity. Please enter your data manually or complete a full run on Strava first.`);
          console.error('Invalid Strava data:', { distanceInMeters, timeInSeconds });
        }
      } else {
        alert('No recent Strava activities found. Make sure you have completed at least one activity on Strava.');
        console.log('No lastActivity in stats');
      }
    } catch (error: any) {
      console.error('Error loading Strava data:', error);
      alert(`Failed to load Strava data: ${error.message}`);
    } finally {
      setLoadingStravaData(false);
    }
  };

  // Auto-load Strava data when dialog opens if user is connected
  useEffect(() => {
    if (isCompleteDialogOpen && auth.isStravaConnected && !stravaDataLoaded) {
      loadLatestStravaActivity();
    }
  }, [isCompleteDialogOpen, auth.isStravaConnected, stravaDataLoaded]);

  const handleCompleteRun = async () => {
    if (!activeRun || !actualDistance || !actualTime) {
      alert('Please enter both actual distance and time');
      return;
    }

    const distanceValue = parseInt(actualDistance);
    const timeValue = parseInt(actualTime);

    if (distanceValue <= 0 || timeValue <= 0) {
      alert('Distance and time must be greater than 0');
      return;
    }

    console.log('Completing run with:', {
      runId: activeRun.runId,
      actualDistance: distanceValue,
      actualTime: timeValue
    });

    setCompleting(true);
    try {
      const result = await completeRun(
        activeRun.runId,
        distanceValue,
        timeValue
      );
      
      setIsCompleteDialogOpen(false);
      setActualDistance('');
      setActualTime('');
      setStravaDataLoaded(false);
      
      // If run was successful, mint NFT
      if (result.success) {
        console.log('Run successful, preparing to mint NFT...');
        
        try {
          // Calculate points based on distance and performance
          const targetDistance = parseInt(activeRun.targetDistance);
          const basePoints = Math.floor(distanceValue / 100); // 1 point per 100m
          const performanceBonus = distanceValue >= targetDistance ? 50 : 0;
          const totalPoints = basePoints + performanceBonus;
          
          // Determine zone name based on location (simplified)
          const zoneName = 'Fitness Zone'; // You could make this dynamic based on GPS location
          const zoneCoordinates = '28.6139,77.2090'; // Default to Delhi coordinates
          
          // Mint NFT directly by user
          const tokenId = await NFTService.mintNFTForUser(
            distanceValue.toString(),
            timeValue.toString(),
            zoneName,
            zoneCoordinates,
            totalPoints.toString()
          );
          
          if (tokenId) {
            alert(`🎉 Run completed successfully! You earned your reward and minted NFT #${tokenId}! 🏆\n\nRun Details:\n- Distance: ${(distanceValue/1000).toFixed(2)}km\n- Time: ${Math.floor(timeValue/60)}:${(timeValue%60).toString().padStart(2,'0')}\n- Points: ${totalPoints}\n- NFT Token ID: ${tokenId}\n\nYour NFT is now available in your gallery!`);
          } else {
            alert(`Run completed successfully! You earned your reward! 🎉\n\nRun Details:\n- Distance: ${(distanceValue/1000).toFixed(2)}km\n- Time: ${Math.floor(timeValue/60)}:${(timeValue%60).toString().padStart(2,'0')}`);
          }
        } catch (nftError: any) {
          console.error('NFT minting failed:', nftError);
          alert(`Run completed successfully! You earned your reward! 🎉\n\nRun Details:\n- Distance: ${(distanceValue/1000).toFixed(2)}km\n- Time: ${Math.floor(timeValue/60)}:${(timeValue%60).toString().padStart(2,'0')}\n\nNote: NFT minting failed: ${nftError?.message || 'Unknown error'}`);
        }
      } else {
        alert(`Run completed! Better luck next time! 💪\n\nRun Details:\n- Distance: ${(distanceValue/1000).toFixed(2)}km\n- Time: ${Math.floor(timeValue/60)}:${(timeValue%60).toString().padStart(2,'0')}`);
      }
      
      console.log('Run completed:', result);
    } catch (err: any) {
      console.error('Failed to complete run:', err);
      alert(`Failed to complete run: ${err.message || 'Unknown error'}`);
    } finally {
      setCompleting(false);
    }
  };

  // Reset state when dialog closes
  const handleDialogClose = (open: boolean) => {
    setIsCompleteDialogOpen(open);
    if (!open) {
      setActualDistance('');
      setActualTime('');
      setStravaDataLoaded(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={32} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeRun) {
    return null;
  }

  const targetDistance = parseInt(activeRun.targetDistance);
  const estimatedTime = parseInt(activeRun.estimatedTime);
  const progress = Math.min((elapsedTime / estimatedTime) * 100, 100);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="text-blue-600" size={20} />
          Active Run
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Target Distance</Label>
              <div className="flex items-center gap-2">
                <Target size={16} className="text-gray-400" />
                <span className="font-semibold">{formatDistance(targetDistance)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Stake Amount</Label>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-400" />
                <span className="font-semibold">{activeRun.stakeAmount} ETH</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Progress</Label>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Elapsed: {formatTime(elapsedTime)}</span>
                <span>Target: {formatTime(estimatedTime)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {progress.toFixed(1)}% of estimated time
              </div>
            </div>
          </div>

          {activeRun.completed ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle size={20} />
              <span className="font-medium">Run completed!</span>
            </div>
          ) : (
            <Dialog open={isCompleteDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <CheckCircle className="mr-2" size={16} />
                  Complete Run
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    Complete Your Run
                    {auth.isStravaConnected && (
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={loadLatestStravaActivity}
                        disabled={loadingStravaData}
                        className="ml-2"
                      >
                        {loadingStravaData ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Load from Strava
                      </Button>
                    )}
                  </DialogTitle>
                </DialogHeader>
                
                {!auth.isStravaConnected && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Connect to Strava to automatically populate your run data from your latest activity!
                      <div className="mt-2 text-xs">
                        Or manually enter: Distance in meters (e.g., 5000 for 5km) and time in seconds (e.g., 1800 for 30 minutes)
                      </div>
                      <Button 
                        variant="neutral" 
                        size="sm" 
                        onClick={() => {
                          setActualDistance('2000');
                          setActualTime('600');
                        }}
                        className="mt-2 text-xs"
                      >
                        Use Example: 2km in 10min
                      </Button>
                    </div>
                  </div>
                )}
                
                {stravaDataLoaded && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="text-sm text-green-800">
                      ✅ Data loaded from your latest Strava activity! You can modify the values below if needed.
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="actualDistance">
                      Actual Distance (meters)
                      {stravaDataLoaded && <span className="text-green-600 text-sm ml-1">• From Strava</span>}
                    </Label>
                    <Input
                      id="actualDistance"
                      type="number"
                      value={actualDistance}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        // Only allow positive numbers
                        if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                          setActualDistance(value);
                          // Clear the loaded flag if user manually edits
                          if (stravaDataLoaded) setStravaDataLoaded(false);
                        }
                      }}
                      placeholder={auth.isStravaConnected ? "Will auto-load from Strava (e.g., 5000 for 5km)" : "Enter distance in meters (e.g., 5000 for 5km)"}
                      min="1"
                      step="1"
                    />
                    {actualDistance && (
                      <p className="text-sm text-gray-500">
                        {formatDistance(parseInt(actualDistance))} - 
                        {((parseInt(actualDistance) / targetDistance) * 100).toFixed(1)}% of target
                      </p>
                    )}
                    {!actualDistance && (
                      <p className="text-xs text-gray-400">
                        Tip: 1km = 1000 meters, so enter 5000 for a 5km run
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actualTime">
                      Actual Time (seconds)
                      {stravaDataLoaded && <span className="text-green-600 text-sm ml-1">• From Strava</span>}
                    </Label>
                    <Input
                      id="actualTime"
                      type="number"
                      value={actualTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        // Only allow positive numbers
                        if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                          setActualTime(value);
                          // Clear the loaded flag if user manually edits
                          if (stravaDataLoaded) setStravaDataLoaded(false);
                        }
                      }}
                      placeholder={auth.isStravaConnected ? "Will auto-load from Strava (e.g., 1800 for 30min)" : "Enter time in seconds (e.g., 1800 for 30min)"}
                      min="1"
                      step="1"
                    />
                    {actualTime && (
                      <p className="text-sm text-gray-500">
                        {formatTime(parseInt(actualTime))}
                      </p>
                    )}
                    {!actualTime && (
                      <p className="text-xs text-gray-400">
                        Tip: 30 minutes = 1800 seconds, 1 hour = 3600 seconds
                      </p>
                    )}
                  </div>

                  {actualDistance && actualTime && (
                    <Card className={`border-2 ${
                      parseInt(actualDistance) >= (targetDistance * 0.8) 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <CardContent className="pt-4">
                        <div className="text-sm">
                          {parseInt(actualDistance) >= (targetDistance * 0.8) ? (
                            <div className="text-green-800">
                              <p className="font-medium">✅ Success! You'll earn your stake + 10% bonus</p>
                              <p>You completed {((parseInt(actualDistance) / targetDistance) * 100).toFixed(1)}% of your target</p>
                            </div>
                          ) : (
                            <div className="text-red-800">
                              <p className="font-medium">❌ Not quite there. You'll lose 30% of your stake</p>
                              <p>You need at least 80% (only completed {((parseInt(actualDistance) / targetDistance) * 100).toFixed(1)}%)</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={handleCompleteRun}
                    disabled={completing || !actualDistance || !actualTime || parseInt(actualDistance) <= 0 || parseInt(actualTime) <= 0}
                    className="w-full"
                  >
                    {completing ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Completing Run...
                      </>
                    ) : (
                      'Complete & Claim Reward'
                    )}
                  </Button>

                  {(!actualDistance || !actualTime || parseInt(actualDistance || '0') <= 0 || parseInt(actualTime || '0') <= 0) && (
                    <div className="text-sm text-gray-500 text-center">
                      Please enter valid distance (meters) and time (seconds) values greater than 0
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
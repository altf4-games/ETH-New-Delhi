import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { useFitnessRuns } from '../../../hooks/useFitnessRuns';
import { Loader2, Timer, Target, DollarSign, CheckCircle } from 'lucide-react';

export const ActiveRun: React.FC = () => {
  const { activeRun, completeRun, loading } = useFitnessRuns();
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [actualDistance, setActualDistance] = useState('');
  const [actualTime, setActualTime] = useState('');
  const [completing, setCompleting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!activeRun || activeRun.completed) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeRun.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRun]);

  const handleCompleteRun = async () => {
    if (!activeRun || !actualDistance || !actualTime) return;

    setCompleting(true);
    try {
      const result = await completeRun(
        activeRun.runId,
        parseInt(actualDistance),
        parseInt(actualTime)
      );
      
      setIsCompleteDialogOpen(false);
      setActualDistance('');
      setActualTime('');
      
      // Show success/failure message (you could add toast notifications here)
      console.log('Run completed:', result);
    } catch (err: any) {
      console.error('Failed to complete run:', err);
    } finally {
      setCompleting(false);
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
            <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <CheckCircle className="mr-2" size={16} />
                  Complete Run
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Complete Your Run</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="actualDistance">Actual Distance (meters)</Label>
                    <Input
                      id="actualDistance"
                      type="number"
                      value={actualDistance}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActualDistance(e.target.value)}
                      placeholder="Enter actual distance covered"
                      min="0"
                    />
                    {actualDistance && (
                      <p className="text-sm text-gray-500">
                        {formatDistance(parseInt(actualDistance))} - 
                        {((parseInt(actualDistance) / targetDistance) * 100).toFixed(1)}% of target
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actualTime">Actual Time (seconds)</Label>
                    <Input
                      id="actualTime"
                      type="number"
                      value={actualTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActualTime(e.target.value)}
                      placeholder="Enter actual time taken"
                      min="0"
                    />
                    {actualTime && (
                      <p className="text-sm text-gray-500">
                        {formatTime(parseInt(actualTime))}
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
                    disabled={completing || !actualDistance || !actualTime}
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
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent } from '../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { useFitnessRuns } from '../../../hooks/useFitnessRuns';
import { useWeb3 } from '../../../hooks/useWeb3';
import web3Service from '../../../services/web3Service';
import { Loader2, Play, AlertTriangle, TestTube } from 'lucide-react';

interface RunStarterProps {
  onRunStarted?: (runId: string) => void;
}

export const RunStarter: React.FC<RunStarterProps> = ({ onRunStarted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [distance, setDistance] = useState('1000'); // Default 1km
  const [estimatedTime, setEstimatedTime] = useState('420'); // Default 7 minutes
  const [suggestedStake, setSuggestedStake] = useState('0');
  const [starting, setStarting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showRateLimitWarning, setShowRateLimitWarning] = useState(false);

  const { isConnected, connect, loading: web3Loading } = useWeb3();
  const { startRun, getSuggestedStake, activeRun, loading } = useFitnessRuns();

  // Calculate suggested stake when distance changes
  useEffect(() => {
    const calculateOfflineStake = (distanceMeters: number): string => {
      // Offline fallback calculation matching the contract logic
      const baseStake = (distanceMeters * 0.001) / 1000; // 0.001 ETH per km
      const withMotivation = baseStake * 1.5; // Add 50% motivation factor
      const finalStake = Math.max(withMotivation, 0.001); // Minimum 0.001 ETH
      return finalStake.toFixed(6);
    };

    const updateSuggestedStake = async () => {
      if (distance && parseInt(distance) > 0) {
        const distanceNum = parseInt(distance);
        
        // Always set a fallback calculation first
        const fallbackStake = calculateOfflineStake(distanceNum);
        setSuggestedStake(fallbackStake);
        
        // Try to get the actual stake from contract if connected
        if (isConnected) {
          try {
            console.log('Calculating suggested stake for distance:', distance);
            const stake = await getSuggestedStake(distanceNum);
            console.log('Got suggested stake from contract:', stake);
            setSuggestedStake(stake);
          } catch (err) {
            console.error('Error getting suggested stake from contract, using fallback:', err);
            // Keep the fallback stake that was already set
          }
        }
      } else {
        setSuggestedStake('0');
      }
    };

    // Debounce the API call to prevent rate limiting
    const timeoutId = setTimeout(() => {
      updateSuggestedStake();
    }, 500); // Wait 500ms before making the call

    return () => clearTimeout(timeoutId);
  }, [distance, isConnected]); // Remove getSuggestedStake from dependencies to prevent loops

  // Auto-calculate estimated time based on distance (7 minutes per km)
  useEffect(() => {
    if (distance) {
      const distanceInKm = parseInt(distance) / 1000;
      const estimatedMinutes = distanceInKm * 7;
      const estimatedSeconds = Math.round(estimatedMinutes * 60);
      setEstimatedTime(estimatedSeconds.toString());
    }
  }, [distance]);

  const handleStartRun = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    setStarting(true);
    setStatusMessage('Preparing transaction...');
    
    try {
      console.log('Starting run with distance:', distance, 'estimated time:', estimatedTime);
      
      // Update status during the process
      setStatusMessage('Getting suggested stake...');
      const result = await startRun(parseInt(distance), parseInt(estimatedTime));
      
      setStatusMessage('Transaction confirmed!');
      onRunStarted?.(result.runId);
      setIsOpen(false);
      
      // Reset form
      setDistance('1000');
      setEstimatedTime('420');
      setStatusMessage('');
      
      // Show success message
      alert(`Run started successfully! Transaction: ${result.transactionHash?.slice(0, 10)}...`);
    } catch (err: any) {
      console.error('Failed to start run:', err);
      
      let errorMessage = 'Failed to start run: ';
      let isRateLimit = false;
      
      if (err.code === -32005) {
        errorMessage = 'MetaMask is rate limiting requests. The system will automatically retry.';
        isRateLimit = true;
      } else if (err.message?.includes('rate limit')) {
        errorMessage = 'Network is busy. The system will automatically retry.';
        isRateLimit = true;
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled.';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance to cover the stake and gas fees.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setShowRateLimitWarning(isRateLimit);
      setStatusMessage('');
      alert(errorMessage);
    } finally {
      setStarting(false);
      setStatusMessage('');
    }
  };

  const testContractConnection = async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    
    try {
      console.log('Testing contract connection...');
      await web3Service.initialize();
      
      // Try a simple calculation first
      const testDistance = 1000;
      const stake = await web3Service.getSuggestedStake(testDistance);
      console.log('Test successful! Suggested stake:', stake);
      alert(`Contract connection successful! Suggested stake for 1km: ${stake} ETH`);
    } catch (error: any) {
      console.error('Contract test failed:', error);
      
      // Show different messages based on error type
      if (error.message?.includes('rate limit') || error.code === -32005) {
        alert('MetaMask is rate limiting requests. Using offline calculation for now. Try again in a few seconds.');
      } else {
        alert('Contract test failed: ' + error.message);
      }
    }
  };
  
  const forceRecalculate = () => {
    if (distance && parseInt(distance) > 0) {
      const distanceNum = parseInt(distance);
      // Offline calculation
      const baseStake = (distanceNum * 0.001) / 1000; // 0.001 ETH per km
      const withMotivation = baseStake * 1.5; // Add 50% motivation factor
      const finalStake = Math.max(withMotivation, 0.001); // Minimum 0.001 ETH
      setSuggestedStake(finalStake.toFixed(6));
      console.log('Manual calculation completed:', finalStake.toFixed(6));
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Don't show if there's already an active run
  if (activeRun && !activeRun.completed) {
    return (
      <Card className="mb-4 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle size={20} />
            <span>You have an active run in progress. Complete it before starting a new one.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Play className="mr-2" size={20} />
          Start New Run
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Fitness Run</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="distance">Target Distance (meters)</Label>
            <Input
              id="distance"
              type="number"
              value={distance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistance(e.target.value)}
              placeholder="1000"
              min="100"
              step="100"
            />
            <p className="text-sm text-gray-500">
              {distance ? `${(parseInt(distance) / 1000).toFixed(1)} km` : ''}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Estimated Time (seconds)</Label>
            <Input
              id="time"
              type="number"
              value={estimatedTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstimatedTime(e.target.value)}
              placeholder="420"
              min="60"
              step="30"
            />
            <p className="text-sm text-gray-500">
              {estimatedTime ? formatTime(parseInt(estimatedTime)) : ''}
            </p>
          </div>

          {isConnected && suggestedStake && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-blue-800">Suggested Stake</p>
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={forceRecalculate}
                      className="text-xs"
                    >
                      Recalc
                    </Button>
                  </div>
                  <p className="text-lg font-bold text-blue-900">{suggestedStake} ETH</p>
                  <p className="text-blue-700">
                    Complete 80%+ of your target distance to earn back your stake plus 10% bonus!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {showRateLimitWarning && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="text-sm space-y-1">
                  <p className="font-medium text-yellow-800">⚠️ Network Busy</p>
                  <p className="text-yellow-700">
                    The system is automatically retrying with delays to handle rate limits.
                    Your transaction will go through, please be patient.
                  </p>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => setShowRateLimitWarning(false)}
                    className="mt-2"
                  >
                    Got it
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {/* Debug test button */}
            {isConnected && (
              <Button
                variant="neutral"
                onClick={testContractConnection}
                className="w-full"
                size="sm"
              >
                <TestTube className="mr-2" size={14} />
                Test Contract Connection
              </Button>
            )}
            
            {!isConnected ? (
              <Button
                onClick={connect}
                disabled={web3Loading}
                className="w-full"
              >
                {web3Loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleStartRun}
                disabled={starting || loading || !distance || !estimatedTime}
                className="w-full"
              >
                {starting ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    {statusMessage || 'Starting Run...'}
                  </>
                ) : (
                  <>
                    <Play className="mr-2" size={16} />
                    Start Run & Stake {suggestedStake} ETH
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Complete at least 80% of your target distance to succeed</p>
            <p>• Success: Get your stake back + 10% bonus</p>
            <p>• Failure: Lose 30% of your stake as motivation</p>
            <p>• Algorithm: ~0.0015 ETH per km + motivation factor</p>
            <p>• Stake calculated offline if network is busy</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { RunStarter } from './RunStarter';
import { ActiveRun } from './ActiveRun';
import { useWeb3 } from '../../../hooks/useWeb3';
import { useFitnessRuns } from '../../../hooks/useFitnessRuns';
import { Wallet, Activity, TrendingUp, DollarSign } from 'lucide-react';

export const FitnessDashboard: React.FC = () => {
  const { isConnected, userAddress, balance } = useWeb3();
  const { runHistory } = useFitnessRuns();

  const completedRuns = runHistory.filter(run => run.completed);
  const successfulRuns = completedRuns.filter(run => {
    const completionRate = parseInt(run.actualDistance || '0') / parseInt(run.targetDistance);
    return completionRate >= 0.8;
  });

  const totalStaked = runHistory.reduce((sum, run) => sum + parseFloat(run.stakeAmount), 0);
  // const totalEarned = successfulRuns.length * 0.1; // Approximate bonus earnings

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Fitness Challenge</h1>
        <p className="text-gray-600">
          Stake ETH on your fitness goals and earn rewards for completing them!
        </p>
      </div>

      {/* Wallet Status */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="text-blue-600" size={20} />
              Wallet Connected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-mono font-semibold">{formatAddress(userAddress!)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="font-semibold">{parseFloat(balance).toFixed(4)} ETH</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {isConnected && runHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Total Runs</p>
                  <p className="text-2xl font-bold">{runHistory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {completedRuns.length > 0 
                      ? Math.round((successfulRuns.length / completedRuns.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="text-purple-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Total Staked</p>
                  <p className="text-2xl font-bold">{totalStaked.toFixed(3)} ETH</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Run */}
      <ActiveRun />

      {/* Run Starter */}
      <RunStarter />

      {/* Recent Runs */}
      {isConnected && runHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {runHistory.slice(0, 5).map((run) => {
                const targetDistance = parseInt(run.targetDistance);
                const actualDistance = parseInt(run.actualDistance || '0');
                const completionRate = run.actualDistance ? (actualDistance / targetDistance) * 100 : 0;
                const isSuccess = completionRate >= 80;

                return (
                  <div
                    key={run.runId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        !run.completed ? 'bg-yellow-400' :
                        isSuccess ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {(targetDistance / 1000).toFixed(1)} km target
                        </p>
                        <p className="text-sm text-gray-500">
                          {run.startTime.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{run.stakeAmount} ETH</p>
                      {run.completed && (
                        <p className={`text-sm ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                          {isSuccess ? '✅ Success' : '❌ Failed'} ({completionRate.toFixed(1)}%)
                        </p>
                      )}
                      {!run.completed && (
                        <p className="text-sm text-yellow-600">🏃 In Progress</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm space-y-2 md:space-y-0">
            <div>
              <h4 className="font-semibold mb-2">🎯 Set Your Goal</h4>
              <p className="text-gray-600">
                Choose your target distance (in meters). The algorithm suggests an optimal stake based on distance (≈0.0015 ETH per km).
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">💰 Stake ETH</h4>
              <p className="text-gray-600">
                Put your money where your goals are. Your stake is locked in a smart contract until you complete your run.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🏃 Complete the Challenge</h4>
              <p className="text-gray-600">
                Run your target distance! Complete at least 80% to be considered successful.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🎉 Earn Rewards</h4>
              <p className="text-gray-600">
                Success: Get your stake back + 10% bonus. Failure: Lose 30% of your stake as motivation to do better next time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
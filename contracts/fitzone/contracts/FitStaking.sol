// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FitStaking
 * @dev Simple staking contract for fitness runs
 * Users stake ETH before starting a run and get rewards/penalties based on completion
 */
contract FitStaking is ReentrancyGuard, Ownable {
    struct RunStake {
        address runner;
        uint256 stakeAmount;
        uint256 targetDistance; // in meters
        uint256 estimatedTime; // in seconds
        uint256 startTime;
        uint256 endTime;
        bool completed;
        bool claimed;
        uint256 actualDistance;
        uint256 actualTime;
    }

    mapping(uint256 => RunStake) public runStakes;
    mapping(address => uint256[]) public userRuns;
    uint256 public nextRunId = 1;

    // Platform fee percentage (5%)
    uint256 public constant PLATFORM_FEE = 5;
    
    // Reward multipliers (as percentages)
    uint256 public constant SUCCESS_REWARD = 110; // 10% bonus
    uint256 public constant FAILURE_PENALTY = 70;  // 30% loss

    // Minimum stake amount (0.001 ETH)
    uint256 public constant MIN_STAKE = 0.001 ether;

    event RunStarted(
        uint256 indexed runId,
        address indexed runner,
        uint256 stakeAmount,
        uint256 targetDistance,
        uint256 estimatedTime
    );

    event RunCompleted(
        uint256 indexed runId,
        address indexed runner,
        bool success,
        uint256 actualDistance,
        uint256 actualTime,
        uint256 reward
    );

    constructor() {}

    /**
     * @dev Start a new run with stake
     * @param targetDistance Target distance in meters
     * @param estimatedTime Estimated time in seconds
     */
    function startRun(
        uint256 targetDistance,
        uint256 estimatedTime
    ) external payable nonReentrant {
        require(msg.value >= MIN_STAKE, "Stake too low");
        require(targetDistance > 0, "Invalid distance");
        require(estimatedTime > 0, "Invalid time");

        uint256 runId = nextRunId++;
        
        runStakes[runId] = RunStake({
            runner: msg.sender,
            stakeAmount: msg.value,
            targetDistance: targetDistance,
            estimatedTime: estimatedTime,
            startTime: block.timestamp,
            endTime: 0,
            completed: false,
            claimed: false,
            actualDistance: 0,
            actualTime: 0
        });

        userRuns[msg.sender].push(runId);

        emit RunStarted(
            runId,
            msg.sender,
            msg.value,
            targetDistance,
            estimatedTime
        );
    }

    /**
     * @dev Complete a run and claim rewards/penalties
     * @param runId The run ID
     * @param actualDistance Actual distance covered in meters
     * @param actualTime Actual time taken in seconds
     */
    function completeRun(
        uint256 runId,
        uint256 actualDistance,
        uint256 actualTime
    ) external nonReentrant {
        RunStake storage run = runStakes[runId];
        
        require(run.runner == msg.sender, "Not your run");
        require(!run.completed, "Run already completed");
        require(actualDistance > 0, "Invalid distance");
        require(actualTime > 0, "Invalid time");

        run.endTime = block.timestamp;
        run.completed = true;
        run.actualDistance = actualDistance;
        run.actualTime = actualTime;

        // Simple success criteria: completed at least 80% of target distance
        bool success = actualDistance >= (run.targetDistance * 80) / 100;
        
        uint256 reward;
        if (success) {
            // Success: return stake + 10% bonus
            reward = (run.stakeAmount * SUCCESS_REWARD) / 100;
        } else {
            // Failure: return 70% of stake
            reward = (run.stakeAmount * FAILURE_PENALTY) / 100;
        }

        // Deduct platform fee from any rewards above the original stake
        uint256 platformFee = 0;
        if (reward > run.stakeAmount) {
            platformFee = ((reward - run.stakeAmount) * PLATFORM_FEE) / 100;
            reward -= platformFee;
        }

        run.claimed = true;

        // Transfer reward to runner
        if (reward > 0) {
            payable(msg.sender).transfer(reward);
        }

        emit RunCompleted(
            runId,
            msg.sender,
            success,
            actualDistance,
            actualTime,
            reward
        );
    }

    /**
     * @dev Calculate suggested stake amount based on distance
     * @param distanceInMeters Target distance in meters
     * @return suggestedStake Suggested stake amount in wei
     */
    function calculateSuggestedStake(
        uint256 distanceInMeters
    ) external pure returns (uint256 suggestedStake) {
        // Base algorithm: 0.001 ETH per km + 50% for motivation
        uint256 baseStake = (distanceInMeters * 1e15) / 1000; // 0.001 ETH per km
        suggestedStake = (baseStake * 150) / 100; // Add 50% motivation factor
        
        // Ensure minimum stake
        if (suggestedStake < MIN_STAKE) {
            suggestedStake = MIN_STAKE;
        }
    }

    /**
     * @dev Get user's run history
     * @param user User address
     * @return runIds Array of run IDs
     */
    function getUserRuns(address user) external view returns (uint256[] memory) {
        return userRuns[user];
    }

    /**
     * @dev Get run details
     * @param runId Run ID
     * @return run RunStake struct
     */
    function getRun(uint256 runId) external view returns (RunStake memory) {
        return runStakes[runId];
    }

    /**
     * @dev Get active (uncompleted) run for a user
     * @param user User address
     * @return runId Active run ID (0 if none)
     */
    function getActiveRun(address user) external view returns (uint256 runId) {
        uint256[] memory runs = userRuns[user];
        for (uint256 i = runs.length; i > 0; i--) {
            uint256 currentRunId = runs[i - 1];
            if (!runStakes[currentRunId].completed) {
                return currentRunId;
            }
        }
        return 0;
    }

    /**
     * @dev Emergency withdrawal by owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Get contract stats
     */
    function getStats() external view returns (
        uint256 totalRuns,
        uint256 totalStaked,
        uint256 totalRewards,
        uint256 contractBalance
    ) {
        totalRuns = nextRunId - 1;
        
        for (uint256 i = 1; i < nextRunId; i++) {
            totalStaked += runStakes[i].stakeAmount;
        }
        
        contractBalance = address(this).balance;
        totalRewards = totalStaked > contractBalance ? totalStaked - contractBalance : 0;
    }
}
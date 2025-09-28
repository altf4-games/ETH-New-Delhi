import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CometCard } from "@/components/ui/comet-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import NFTService from "@/services/nftService";
import type { NFTData, MarketplaceListing } from "@/services/web3Service";
import { Loader2, Trophy, TrendingUp, Timer, MapPin, Award, Eye, ShoppingCart, DollarSign, Calendar } from "lucide-react";

export function NFTGallery() {
  const [userNFTs, setUserNFTs] = useState<NFTData[]>([]);
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceListing[]>([]);
  const [selectedNft, setSelectedNft] = useState<NFTData | null>(null);
  const [selectedMarketNft, setSelectedMarketNft] = useState<MarketplaceListing | null>(null);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showCometView, setShowCometView] = useState(false);
  const [sellPrice, setSellPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'owned' | 'marketplace'>('owned');
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();

  // Load NFTs on component mount
  useEffect(() => {
    if (isConnected && address) {
      loadNFTs();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const loadNFTs = async () => {
    setLoading(true);
    try {
      const [owned, marketplace] = await Promise.all([
        NFTService.getUserNFTs(),
        NFTService.getMarketplaceNFTs()
      ]);
      
      setUserNFTs(owned);
      setMarketplaceNFTs(marketplace);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSell = (nft: NFTData) => {
    setSelectedNft(nft);
    setSellPrice("");
    setPriceError("");
    setShowSellDialog(true);
  };

  const handleBuy = (nft: MarketplaceListing) => {
    setSelectedMarketNft(nft);
    setShowBuyDialog(true);
  };

  const validatePrice = (price: string) => {
    const numberPrice = parseFloat(price);
    if (isNaN(numberPrice) || numberPrice <= 0) {
      setPriceError("Please enter a valid price greater than 0");
      return false;
    }
    setPriceError("");
    return true;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSellPrice(value);
      if (value !== "") validatePrice(value);
    }
  };

  const confirmSell = async () => {
    if (!selectedNft || !validatePrice(sellPrice)) return;

    try {
      const success = await NFTService.listNFT(selectedNft.tokenId, sellPrice);
      if (success) {
        alert(`NFT listed for sale at ${sellPrice} ETH!`);
        setShowSellDialog(false);
        setSelectedNft(null);
        setSellPrice("");
        await loadNFTs(); // Refresh the list
      }
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert('Failed to list NFT for sale. Please try again.');
    }
  };

  const confirmBuy = async () => {
    if (!selectedMarketNft) return;

    try {
      const success = await NFTService.buyNFT(selectedMarketNft.tokenId, selectedMarketNft.price);
      if (success) {
        alert(`Successfully purchased NFT for ${selectedMarketNft.price} ETH!`);
        setShowBuyDialog(false);
        setSelectedMarketNft(null);
        await loadNFTs(); // Refresh the list
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Failed to purchase NFT. Please try again.');
    }
  };

  const NFTCard = ({ nft, isMarketplace = false }: { nft: NFTData | MarketplaceListing, isMarketplace?: boolean }) => {
    const runData = NFTService.formatRunData(nft.runData);
    const rarityScore = NFTService.calculateRarityScore(nft.runData);
    
    return (
      <Card className="h-full border-4 border-black shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center p-4">
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-black mb-4 flex items-center justify-center overflow-hidden">
            {nft.runData.distance && (
              <div className="text-white text-center">
                <Trophy className="mx-auto mb-2" size={40} />
                <div className="text-2xl font-bold">{runData.distance}</div>
                <div className="text-sm opacity-90">{runData.duration}</div>
              </div>
            )}
          </div>
          <CardTitle className="text-lg font-black uppercase">
            {nft.runData.zoneName}
          </CardTitle>
          <div className="text-sm text-gray-600">
            Token #{nft.tokenId}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-gray-500" />
              <span>{runData.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-gray-500" />
              <span>{runData.pace}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={14} className="text-gray-500" />
              <span>{runData.points} pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-500" />
              <span>{runData.date}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-gray-500" />
            <span>{runData.zone}</span>
          </div>
          
          <div className="bg-gray-100 border-2 border-gray-300 p-2 text-center">
            <div className="text-xs text-gray-600">Rarity Score</div>
            <div className="font-bold text-lg">{rarityScore}</div>
          </div>
          
          {isMarketplace && 'price' in nft && (
            <div className="bg-green-100 border-2 border-green-300 p-2 text-center">
              <div className="text-xs text-green-600">Price</div>
              <div className="font-bold text-lg text-green-700">{nft.price} ETH</div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCometView(true)}
              className="border-2 border-gray-600"
            >
              <Eye size={14} className="mr-1" />
              View
            </Button>
            {isMarketplace && 'price' in nft ? (
              <Button
                size="sm"
                onClick={() => handleBuy(nft as MarketplaceListing)}
                className="bg-green-600 hover:bg-green-700 border-2 border-green-800"
              >
                <ShoppingCart size={14} className="mr-1" />
                Buy
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleSell(nft as NFTData)}
                className="bg-yellow-500 hover:bg-yellow-600 border-2 border-yellow-700"
              >
                <DollarSign size={14} className="mr-1" />
                Sell
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">Connect your wallet to view your NFT collection and access the marketplace.</p>
          <Button 
            onClick={() => navigate('/')} 
            className="mt-4 bg-blue-600 hover:bg-blue-700 border-2 border-blue-800"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-16 w-16 text-blue-600 animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading NFTs...</h3>
          <p className="text-gray-600">Fetching your collection from the blockchain.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase mb-4">
          NFT <span className="text-[#0ea5a4]">GALLERY</span>
        </h1>
        <p className="text-xl font-bold text-gray-700">
          Your fitness achievements immortalized as NFTs. Trade, collect, and showcase your runs!
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-1 border-4 border-black p-1 w-fit">
          <button
            onClick={() => setActiveTab('owned')}
            className={`px-6 py-3 font-bold text-sm uppercase transition-all duration-200 ${
              activeTab === 'owned'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Collection ({userNFTs.length})
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-6 py-3 font-bold text-sm uppercase transition-all duration-200 ${
              activeTab === 'marketplace'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Marketplace ({marketplaceNFTs.length})
          </button>
        </div>
      </div>

      {/* NFT Grid */}
      {activeTab === 'owned' ? (
        <div>
          {userNFTs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border-4 border-gray-200">
              <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No NFTs Yet</h3>
              <p className="text-gray-600 mb-4">
                Complete runs to earn NFTs that capture your fitness achievements!
              </p>
              <Button 
                onClick={() => navigate('/user/home')}
                className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-800"
              >
                Start Running
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userNFTs.map((nft) => (
                <NFTCard key={nft.tokenId} nft={nft} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {marketplaceNFTs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border-4 border-gray-200">
              <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Items Listed</h3>
              <p className="text-gray-600">
                No NFTs are currently listed for sale in the marketplace.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {marketplaceNFTs.map((nft) => (
                <NFTCard key={nft.tokenId} nft={nft} isMarketplace={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sell Dialog */}
      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="sm:max-w-md border-4 border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase">Sell NFT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="price" className="font-bold">Price (ETH)</Label>
              <Input
                id="price"
                placeholder="0.1"
                value={sellPrice}
                onChange={handlePriceChange}
                className="border-2 border-gray-300"
              />
              {priceError && (
                <p className="text-red-500 text-sm mt-1">{priceError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSellDialog(false)}
              className="border-2 border-gray-400"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSell}
              className="bg-yellow-500 hover:bg-yellow-600 border-2 border-yellow-700"
            >
              List for Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="sm:max-w-md border-4 border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase">Buy NFT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMarketNft && (
              <>
                <div>
                  <p className="font-bold">Token #{selectedMarketNft.tokenId}</p>
                  <p className="text-sm text-gray-600">{selectedMarketNft.runData.zoneName}</p>
                </div>
                <div>
                  <p className="font-bold text-lg">Price: {selectedMarketNft.price} ETH</p>
                </div>
                <p className="text-sm text-gray-600">
                  Are you sure you want to purchase this NFT?
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBuyDialog(false)}
              className="border-2 border-gray-400"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmBuy}
              className="bg-green-600 hover:bg-green-700 border-2 border-green-800"
            >
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comet View */}
      <CometCard
        isOpen={showCometView}
        onClose={() => setShowCometView(false)}
        title="NFT Details"
      >
        <div className="p-4">
          <p>Detailed NFT view coming soon...</p>
        </div>
      </CometCard>
    </div>
  );
}
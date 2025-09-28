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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import NFTService from "@/services/nftService";
import type { MarketplaceListing } from "@/services/web3Service";
import { 
  Loader2, 
  ShoppingCart, 
  Trophy, 
  Timer, 
  TrendingUp, 
  MapPin, 
  Award, 
  Calendar,
  Search,
  Filter,
  ArrowUpDown
} from "lucide-react";

export function Marketplace() {
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceListing[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<MarketplaceListing[]>([]);
  const [selectedNft, setSelectedNft] = useState<MarketplaceListing | null>(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'price_low' | 'price_high' | 'distance' | 'recent'>('recent');
  const [priceFilter, setPriceFilter] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const { isConnected } = useWallet();

  useEffect(() => {
    loadMarketplaceNFTs();
  }, []);

  useEffect(() => {
    filterAndSortNFTs();
  }, [marketplaceNFTs, searchQuery, sortBy, priceFilter]);

  const loadMarketplaceNFTs = async () => {
    setLoading(true);
    try {
      const nfts = await NFTService.getMarketplaceNFTs();
      setMarketplaceNFTs(nfts);
    } catch (error) {
      console.error('Error loading marketplace NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortNFTs = () => {
    let filtered = [...marketplaceNFTs];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(nft => 
        nft.runData.zoneName.toLowerCase().includes(query) ||
        nft.tokenId.includes(query)
      );
    }

    // Price filter
    if (priceFilter.min || priceFilter.max) {
      const min = parseFloat(priceFilter.min) || 0;
      const max = parseFloat(priceFilter.max) || Infinity;
      filtered = filtered.filter(nft => {
        const price = parseFloat(nft.price);
        return price >= min && price <= max;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price_high':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'distance':
          return parseInt(b.runData.distance) - parseInt(a.runData.distance);
        case 'recent':
        default:
          return b.listedAt.getTime() - a.listedAt.getTime();
      }
    });

    setFilteredNFTs(filtered);
  };

  const handleBuy = (nft: MarketplaceListing) => {
    setSelectedNft(nft);
    setShowBuyDialog(true);
  };

  const confirmBuy = async () => {
    if (!selectedNft) return;

    try {
      const success = await NFTService.buyNFT(selectedNft.tokenId, selectedNft.price);
      if (success) {
        alert(`Successfully purchased NFT for ${selectedNft.price} ETH!`);
        setShowBuyDialog(false);
        setSelectedNft(null);
        await loadMarketplaceNFTs(); // Refresh the list
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Failed to purchase NFT. Please try again.');
    }
  };

  const NFTMarketCard = ({ nft }: { nft: MarketplaceListing }) => {
    const runData = NFTService.formatRunData(nft.runData);
    const rarityScore = NFTService.calculateRarityScore(nft.runData);
    
    return (
      <Card className="h-full border-4 border-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <CardHeader className="text-center p-4">
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-black mb-4 flex items-center justify-center overflow-hidden relative">
            <div className="text-white text-center">
              <Trophy className="mx-auto mb-2" size={40} />
              <div className="text-2xl font-bold">{runData.distance}</div>
              <div className="text-sm opacity-90">{runData.duration}</div>
            </div>
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 text-xs font-bold rounded">
              FOR SALE
            </div>
          </div>
          <CardTitle className="text-lg font-black uppercase">
            {nft.runData.zoneName}
          </CardTitle>
          <div className="text-sm text-gray-600">
            Token #{nft.tokenId}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-3">
          <div className="bg-green-100 border-2 border-green-300 p-3 text-center mb-4">
            <div className="text-xs text-green-600 font-semibold">PRICE</div>
            <div className="text-2xl font-black text-green-700">{nft.price} ETH</div>
            <div className="text-xs text-green-600">
              Listed {nft.listedAt.toLocaleDateString()}
            </div>
          </div>

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

          <div className="text-xs text-gray-500">
            Seller: {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={() => handleBuy(nft)}
            className="w-full bg-green-600 hover:bg-green-700 border-2 border-green-800 text-white font-bold"
            disabled={!isConnected}
          >
            <ShoppingCart size={16} className="mr-2" />
            Buy Now
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-16 w-16 text-blue-600 animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Marketplace...</h3>
          <p className="text-gray-600">Fetching NFTs from the marketplace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase mb-4">
          NFT <span className="text-[#ec4899]">MARKETPLACE</span>
        </h1>
        <p className="text-xl font-bold text-gray-700">
          Buy and sell fitness NFTs from runners around the world.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 bg-white border-4 border-black p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label className="font-bold flex items-center gap-2">
              <Search size={16} />
              Search
            </Label>
            <Input
              placeholder="Search by zone or token ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-2 border-gray-300"
            />
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <Label className="font-bold flex items-center gap-2">
              <ArrowUpDown size={16} />
              Sort By
            </Label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 border-2 border-gray-300 bg-white"
            >
              <option value="recent">Recently Listed</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="distance">Distance: High to Low</option>
            </select>
          </div>

          {/* Price Filter - Min */}
          <div className="space-y-2">
            <Label className="font-bold flex items-center gap-2">
              <Filter size={16} />
              Min Price (ETH)
            </Label>
            <Input
              placeholder="0.0"
              value={priceFilter.min}
              onChange={(e) => setPriceFilter(prev => ({ ...prev, min: e.target.value }))}
              className="border-2 border-gray-300"
              type="number"
              step="0.001"
            />
          </div>

          {/* Price Filter - Max */}
          <div className="space-y-2">
            <Label className="font-bold">Max Price (ETH)</Label>
            <Input
              placeholder="1.0"
              value={priceFilter.max}
              onChange={(e) => setPriceFilter(prev => ({ ...prev, max: e.target.value }))}
              className="border-2 border-gray-300"
              type="number"
              step="0.001"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredNFTs.length} of {marketplaceNFTs.length} NFTs
          </div>
          <Button
            onClick={() => {
              setSearchQuery("");
              setSortBy('recent');
              setPriceFilter({ min: "", max: "" });
            }}
            className="bg-gray-600 hover:bg-gray-700 border-2 border-gray-800 text-white"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* NFT Grid */}
      {filteredNFTs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border-4 border-gray-200">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {marketplaceNFTs.length === 0 ? "No Items Listed" : "No Results Found"}
          </h3>
          <p className="text-gray-600">
            {marketplaceNFTs.length === 0 
              ? "No NFTs are currently listed for sale in the marketplace."
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNFTs.map((nft) => (
            <NFTMarketCard key={`${nft.tokenId}-${nft.seller}`} nft={nft} />
          ))}
        </div>
      )}

      {/* Buy Confirmation Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="sm:max-w-md border-4 border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase">Confirm Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedNft && (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-black mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="text-white" size={24} />
                  </div>
                  <h3 className="font-bold text-lg">{selectedNft.runData.zoneName}</h3>
                  <p className="text-sm text-gray-600">Token #{selectedNft.tokenId}</p>
                </div>

                <div className="bg-green-100 border-2 border-green-300 p-4 text-center">
                  <div className="text-sm text-green-600 font-semibold">TOTAL COST</div>
                  <div className="text-3xl font-black text-green-700">{selectedNft.price} ETH</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-semibold">{NFTService.formatRunData(selectedNft.runData).distance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-semibold">{NFTService.formatRunData(selectedNft.runData).duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points:</span>
                    <span className="font-semibold">{NFTService.formatRunData(selectedNft.runData).points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seller:</span>
                    <span className="font-mono text-xs">{selectedNft.seller.slice(0, 6)}...{selectedNft.seller.slice(-4)}</span>
                  </div>
                </div>

                {!isConnected && (
                  <div className="bg-red-100 border-2 border-red-300 p-3 text-center">
                    <p className="text-red-700 font-semibold">Please connect your wallet to purchase NFTs.</p>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowBuyDialog(false)}
              className="border-2 border-gray-400"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmBuy}
              disabled={!isConnected}
              className="bg-green-600 hover:bg-green-700 border-2 border-green-800"
            >
              <ShoppingCart size={16} className="mr-2" />
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
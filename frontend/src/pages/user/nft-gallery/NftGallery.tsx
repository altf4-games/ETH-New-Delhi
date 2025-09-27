import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export function NFTGallery() {
  const [selectedNft, setSelectedNft] = useState<typeof nfts[0] | null>(null);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [sellPrice, setSellPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const navigate = useNavigate();

  const handleSell = (nft: typeof nfts[0]) => {
    setSelectedNft(nft);
    setSellPrice("");
    setPriceError("");
    setShowSellDialog(true);
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

  const confirmSell = () => {
    if (!selectedNft || !validatePrice(sellPrice)) return;

    console.log('Selling NFT:', selectedNft.id, 'for', sellPrice, 'ETH');
    setShowSellDialog(false);
    setSelectedNft(null);
    setSellPrice("");
  };

  const nfts = [
    {
      id: "ZONE_001",
      dateCaptured: "2025-01-15",
      power: 85,
      color: "#0ea5a4",
      location: "KJSCE",
    },
    {
      id: "ZONE_007",
      dateCaptured: "2025-01-12",
      power: 92,
      color: "#fbbf24",
      location: "India Gate",
    },
    {
      id: "ZONE_023",
      dateCaptured: "2025-01-10",
      power: 67,
      color: "#ec4899",
      location: "Yashobhoomi Center",
    },
    {
      id: "ZONE_045",
      dateCaptured: "2025-01-08",
      power: 45,
      color: "#8b5cf6",
      location: "Gateway of India",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase mb-4">
          MY <span className="text-[#0ea5a4]">NFTS</span>
        </h1>
        <p className="text-xl font-bold text-gray-700">
          Your captured territories
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="border-4 border-black text-center p-6 bg-[#0ea5a4]/10">
          <CardContent>
            <div className="text-3xl font-black mb-2">4</div>
            <div className="font-bold uppercase">Total Zones</div>
          </CardContent>
        </Card>

        <Card className="border-4 border-black text-center p-6 bg-[#ec4899]/10">
          <CardContent>
            <div className="text-3xl font-black mb-2">73</div>
            <div className="font-bold uppercase">Average % mined</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-12 text-center">
        <Card className="border-4 border-black bg-[#f5cd69] max-w-2xl mx-auto p-8">
          <CardHeader>
            <CardTitle className="text-2xl font-black uppercase text-center">
              EXPAND YOUR EMPIRE
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-bold mb-6 text-center">
            Capture more zones to increase your territory and earn more rewards!
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <div className="space-y-2 space-x-2">
              <Button className="border-4 border-black shadow-md font-extrabold" onClick={() => navigate("/user/home")}>
                EXPLORE ZONES
              </Button>
              <Button className="border-4 border-black bg-[#ec4899] text-white shadow-md font-extrabold" onClick={() => navigate("/user/home")}>
                START NEW RUN
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {nfts.map((nft) => (
          <Card key={nft.id} className="border-4 border-black p-6">
            <div
              className="aspect-square mb-4 flex flex-col items-center justify-center text-center relative border-4 border-black"
              style={{ backgroundColor: nft.color }}
            >
              <div className="font-mono text-lg font-black text-black">{nft.id}</div>
              <div className="absolute bottom-2 left-2 right-2">
                <div className="text-xs font-bold text-black uppercase">
                  {nft.location}
                </div>
              </div>
            </div>

            <CardContent className="space-y-3 p-0">
              <div className="flex justify-between items-center">
                <span className="font-bold">Zone ID:</span>
                <span className="font-mono font-black">{nft.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Captured:</span>
                <span className="font-black">{nft.dateCaptured}</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Current Power:</span>
                  <span className="font-black">{nft.power}%</span>
                </div>
                <div className="w-full border-2 border-black bg-gray-200 h-3">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${nft.power}%`,
                      backgroundColor:
                        nft.power > 70
                          ? "#0ea5a4"
                          : nft.power > 40
                            ? "#fbbf24"
                            : "#ec4899",
                    }}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3 mt-6">
              <Button
                className="flex-1 border-4 border-black bg-[#d20d0d] text-white font-extrabold"
                onClick={() => handleSell(nft)}
              >
                SELL
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Confirm Sale</DialogTitle>
          </DialogHeader>
          {selectedNft && (
            <div className="py-4">
              <div className="mb-6">
                <div className="aspect-square w-32 mx-auto mb-4 flex flex-col items-center justify-center text-center relative border-4 border-black" style={{ backgroundColor: selectedNft.color }}>
                  <div className="font-mono text-lg font-black text-black">
                    {selectedNft.id}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-xs font-bold text-black uppercase">
                      {selectedNft.location}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-4 border-black p-4 bg-white/50">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Zone ID:</span>
                  <span className="font-mono font-black">{selectedNft.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">Location:</span>
                  <span className="font-black">{selectedNft.location}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">Captured:</span>
                  <span className="font-black">{selectedNft.dateCaptured}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">Power:</span>
                  <span className="font-black">{selectedNft.power}%</span>
                </div>
                <div className="flex items-center gap-4 border-t-2 border-black pt-3">
                  <span className="font-bold text-lg whitespace-nowrap">Sale Price:</span>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={sellPrice}
                      onChange={handlePriceChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border-4 border-black font-black text-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a4]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-lg">
                      ETH
                    </span>
                  </div>
                </div>
                {priceError && (
                  <div className="text-[#d20d0d] font-bold mt-2 text-sm">
                    {priceError}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-4">
            <Button
              className="flex-1 border-4 border-black bg-gray-200"
              onClick={() => setShowSellDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 border-4 border-black bg-[#d20d0d] text-white font-extrabold"
              onClick={confirmSell}
              disabled={!sellPrice || !!priceError}
            >
              Sell Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

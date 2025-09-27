import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export const Market: React.FC = () => {
    const [sortBy, setSortBy] = useState("price-low");
    const [filterBy, setFilterBy] = useState("all");

    const marketNFTs = [
        {
            id: "ZONE_089",
            seller: "speedster.eth",
            location: "Manhattan Bridge",
            price: 0.15,
            power: 78,
            dateCaptured: "2025-01-14",
            color: "#0ea5a4",
            rarity: "Common",
        },
        {
            id: "ZONE_034",
            seller: "marathoner.eth",
            location: "Central Park West",
            price: 0.45,
            power: 92,
            dateCaptured: "2025-01-10",
            color: "#fbbf24",
            rarity: "Rare",
        },
        {
            id: "ZONE_156",
            seller: "runner.eth",
            location: "Brooklyn Heights",
            price: 0.28,
            power: 85,
            dateCaptured: "2025-01-12",
            color: "#ec4899",
            rarity: "Epic",
        },
        {
            id: "ZONE_203",
            seller: "trailblazer.eth",
            location: "Williamsburg",
            price: 0.08,
            power: 45,
            dateCaptured: "2025-01-08",
            color: "#8b5cf6",
            rarity: "Common",
        },
        {
            id: "ZONE_098",
            seller: "jogger.eth",
            location: "High Line Park",
            price: 0.67,
            power: 96,
            dateCaptured: "2025-01-16",
            color: "#06b6d4",
            rarity: "Epic",
        },
        {
            id: "ZONE_077",
            seller: "fastfoot.eth",
            location: "Times Square",
            price: 1.25,
            power: 98,
            dateCaptured: "2025-01-15",
            color: "#ef4444",
            rarity: "Rare",
        },
    ];

    const rarityColors: Record<string, string> = {
        Common: "#6b7280",
        Rare: "#3b82f6",
        Epic: "#8b5cf6",
    };

    const sortedNFTs = [...marketNFTs].sort((a, b) => {
        switch (sortBy) {
            case "price-low":
                return a.price - b.price;
            case "price-high":
                return b.price - a.price;
            default:
                return a.price - b.price;
        }
    });

    const filteredNFTs = sortedNFTs.filter((nft) => {
        if (filterBy === "all") return true;
        return nft.rarity.toLowerCase() === filterBy;
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-5xl font-black uppercase mb-4">
                    NFT <span className="text-[#ec4899]">MARKETPLACE</span>
                </h1>
                <p className="text-xl font-bold text-gray-700">
                    Buy and sell zone NFTs from runners worldwide
                </p>
            </div>

            {/* Market Stats */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="border-4 border-black text-center p-6 bg-[#0ea5a4]/10">
                    <CardHeader>
                        <CardTitle className="text-3xl font-black">6</CardTitle>
                    </CardHeader>
                    <CardContent className="font-bold uppercase">
                        Listed NFTs
                    </CardContent>
                </Card>

                <Card className="border-4 border-black text-center p-6 bg-[#fbbf24]/10">
                    <CardHeader>
                        <CardTitle className="text-3xl font-black">3.1</CardTitle>
                    </CardHeader>
                    <CardContent className="font-bold uppercase">
                        ETH Volume
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Sorting */}
            <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex flex-wrap gap-2">
                    <span className="font-bold text-lg">FILTER:</span>
                    {["all", "common", "rare", "epic"].map((filter) => (
                        <Button
                            key={filter}
                            onClick={() => setFilterBy(filter)}
                            className={`px-4 py-2 font-bold uppercase tracking-wide border-4 border-black transition-all ${filterBy === filter
                                    ? "bg-[#fbbf24] text-black"
                                    : "bg-white text-black hover:bg-gray-100"
                                }`}
                        >
                            {filter}
                        </Button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    <span className="font-bold text-lg">SORT:</span>
                    {[{ value: "price-low", label: "Price ↑" }, { value: "price-high", label: "Price ↓" }].map((sort) => (
                        <Button
                            key={sort.value}
                            onClick={() => setSortBy(sort.value)}
                            className={`px-4 py-2 font-bold uppercase tracking-wide border-4 border-black transition-all ${sortBy === sort.value
                                    ? "bg-[#0ea5a4] text-black"
                                    : "bg-white text-black hover:bg-gray-100"
                                }`}
                        >
                            {sort.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* NFT Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNFTs.map((nft) => (
                    <Card
                        key={nft.id}
                        className="border-4 border-black p-4 flex flex-col justify-between"
                    >
                        {/* NFT Visual */}
                        <div
                            className="aspect-square border-4 border-black mb-4 flex flex-col items-center justify-center text-center relative"
                            style={{ backgroundColor: nft.color }}
                        >
                            <div className="text-3xl font-black text-black mb-2">🏃‍♂️</div>
                            <div className="font-mono text-sm font-black text-black">
                                {nft.id}
                            </div>

                            {/* Rarity Badge */}
                            <div
                                className="absolute top-2 right-2 px-2 py-1 border-2 border-black text-xs font-black uppercase text-white"
                                style={{ backgroundColor: rarityColors[nft.rarity] }}
                            >
                                {nft.rarity}
                            </div>
                        </div>

                        {/* NFT Details */}
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm">Seller:</span>
                                <span className="font-mono text-xs font-black">
                                    {nft.seller.length > 12
                                        ? `${nft.seller.slice(0, 8)}...`
                                        : nft.seller}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm">Power:</span>
                                <span className="font-black text-sm">{nft.power}%</span>
                            </div>
                        </div>

                        {/* Price + Buy */}
                        <div className="border-4 border-black bg-black text-white p-3 mb-4 text-center">
                            <div className="text-xs font-bold uppercase opacity-75">
                                Current Price
                            </div>
                            <div className="text-2xl font-black">{nft.price} ETH</div>
                            <div className="text-xs font-bold opacity-75">
                                ${(nft.price * 3200).toFixed(0)} USD
                            </div>
                        </div>

                        <Button className="border-4 border-black font-extrabold bg-[#0ea5a4] hover:bg-[#0ea5a4]/80">
                            BUY NOW
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    );
};

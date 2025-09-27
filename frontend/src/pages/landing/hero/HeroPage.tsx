import { Button } from "@/components/ui/button";
import { TextAnimate } from "@/components/ui/text-animate";
import { Link, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export function HeroPage() {
    const navigate = useNavigate();
    const auth = useAuth();
    const [isConnecting, setIsConnecting] = useState({ wallet: false, strava: false });

    const handleConnectWallet = async () => {
        setIsConnecting(prev => ({ ...prev, wallet: true }));
        const success = await auth.connectWallet();
        setIsConnecting(prev => ({ ...prev, wallet: false }));

        if (success && auth.isStravaConnected) {
            navigate("/user/home");
        }
    };

    const handleConnectStrava = async () => {
        setIsConnecting(prev => ({ ...prev, strava: true }));
        const success = await auth.connectStrava();
        setIsConnecting(prev => ({ ...prev, strava: false }));

        if (success && auth.isWalletConnected) {
            navigate("/user/home");
        }
    };

    return (
        <section id="home" className="min-h-screen bg-[#a5f3fc] py-20 flex items-center">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 text-[#155e75] leading-none">
                    <TextAnimate animation="blurInUp" by="word" className="m-0" once>
                        CONQUER YOUR CITY.
                    </TextAnimate>

                    <div className="flex justify-center gap-2">
                        <TextAnimate animation="blurInUp" by="word" className="mr-3" once>
                            EARN
                        </TextAnimate>
                        <span className="text-[#ec4899]">
                            <TextAnimate animation="blurInUp" by="word" once>
                                NFTS
                            </TextAnimate>
                        </span>
                    </div>
                </h1>


                <div className="text-xl md:text-2xl font-bold mb-12 text-[#155e75] max-w-3xl mx-auto p-4">
                    <TextAnimate animation="blurInUp" by="word" once>
                        Connect Strava, capture real-world zones, and mint them as NFTs. Own
                        the streets you run and compete for territory dominance.
                    </TextAnimate>
                </div>

                <motion.div
                    className="flex flex-col md:flex-row gap-6 justify-center items-center"
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <Button
                        className="bg-gray-800 text-white font-extrabold text-lg px-8 py-4 border-4 border-black shadow-[6px_6px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                        onClick={handleConnectWallet}
                    >
                        🦊 CONNECT WALLET (METAMASK)
                    </Button>

                    <Button
                        className={`${auth.isStravaConnected
                                ? 'bg-green-600 text-white'
                                : 'bg-[#ec4899] text-white'
                            } font-extrabold text-lg px-8 py-4 border-4 border-black shadow-[6px_6px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-70 disabled:cursor-not-allowed`}
                        onClick={handleConnectStrava}
                        disabled={auth.isStravaConnected || isConnecting.strava}
                    >
                        {isConnecting.strava ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                CONNECTING...
                            </>
                        ) : auth.isStravaConnected ? (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                STRAVA CONNECTED
                            </>
                        ) : (
                            <>
                                <Link className="mr-2" /> CONNECT STRAVA
                            </>
                        )}
                    </Button>
                </motion.div>

                {auth.isBothConnected && (
                    <motion.div
                        className="mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Button
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xl px-12 py-6 border-4 border-black shadow-[8px_8px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                            onClick={() => navigate("/user/home")}
                        >
                            🚀 START CONQUERING ZONES!
                        </Button>
                    </motion.div>
                )}

                {(auth.isWalletConnected || auth.isStravaConnected) && !auth.isBothConnected && (
                    <motion.div
                        className="mt-6 p-4 bg-yellow-100 border-4 border-yellow-400 rounded-lg max-w-md mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-yellow-800 font-bold">
                            {auth.isWalletConnected && !auth.isStravaConnected
                                ? "🏃‍♂️ Connect Strava to start capturing zones!"
                                : "🦊 Connect your wallet to mint zone NFTs!"
                            }
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    );
}

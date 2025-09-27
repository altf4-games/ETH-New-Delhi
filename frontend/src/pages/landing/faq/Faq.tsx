import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  return (
    <section className="min-h-screen bg-[#a5f3fc] py-20 px-6 flex items-center">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-6xl font-black uppercase text-center mb-16 text-[#155e75]">
          FREQUENTLY ASKED <span className="text-[#ec4899]">QUESTIONS</span>
        </h2>

        <Accordion type="single" collapsible className="space-y-6">
          <AccordionItem value="item-1">
            <div className="border-4 border-black bg-white rounded-lg">
              <AccordionTrigger className="text-xl font-bold px-6 py-4">
                What is FitConquer?
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-lg font-medium text-black">
                FitConquer lets you connect Strava, capture real-world zones, and
                mint them as NFTs. You can own the streets you run and compete for
                territory dominance.
              </AccordionContent>
            </div>
          </AccordionItem>

          <AccordionItem value="item-2">
            <div className="border-4 border-black   bg-white rounded-lg">
              <AccordionTrigger className="text-xl font-bold px-6 py-4">
                How do I connect my wallet?
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-lg font-medium text-black">
                You can connect your wallet using MetaMask. Simply click the
                "Connect Wallet" button on the homepage and approve the request in
                your MetaMask extension.
              </AccordionContent>
            </div>
          </AccordionItem>

          <AccordionItem value="item-3">
            <div className="border-4 border-black   bg-white rounded-lg">
              <AccordionTrigger className="text-xl font-bold px-6 py-4">
                Is this free to use?
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-lg font-medium text-black">
                Yes, the platform is free to explore. However, minting NFTs may
                require small blockchain transaction (gas) fees.
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { TextAnimate } from "@/components/ui/text-animate";

export default function FAQPage() {
  return (
    <section id="faq" className="min-h-screen bg-[#a5f3fc] py-20 px-6 flex items-center">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-6xl font-black uppercase text-center mb-16 text-[#155e75]">
          <TextAnimate animation="blurInUp" by="word" once>
            FREQUENTLY ASKED
          </TextAnimate>
          <span className="text-[#ec4899]">
            <TextAnimate animation="blurInUp" by="word" once>
              QUESTIONS
            </TextAnimate>
          </span>
        </h2>

        <Accordion type="single" collapsible className="space-y-6">
          {[
            {
              id: "item-1",
              question: "What is FitConquer?",
              answer:
                "FitConquer lets you connect Strava, capture real-world zones, and mint them as NFTs. You can own the streets you run and compete for territory dominance.",
            },
            {
              id: "item-2",
              question: "How do I connect my wallet?",
              answer:
                'You can connect your wallet using MetaMask. Simply click the "Connect Wallet" button on the homepage and approve the request in your MetaMask extension.',
            },
            {
              id: "item-3",
              question: "Is this free to use?",
              answer:
                "Yes, the platform is free to explore. However, minting NFTs may require small blockchain transaction (gas) fees.",
            },
          ].map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <AccordionItem value={faq.id}>
                <div className="border-4 border-black bg-white rounded-lg">
                  <AccordionTrigger className="text-xl font-bold px-6 py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 text-lg font-medium text-black">
                    {faq.answer}
                  </AccordionContent>
                </div>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

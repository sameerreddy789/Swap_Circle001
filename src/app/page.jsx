'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import HowItWorks from "@/components/how-it-works";
import { Hero } from "@/components/ui/animated-hero";
import dynamic from "next/dynamic";

const DottedSurface = dynamic(
  () => import("@/components/ui/dotted-surface").then(mod => ({ default: mod.DottedSurface })),
  { ssr: false }
);

export default function Home() {
  
  const faqs = [
    {
      question: "How does swapping work?",
      answer: "It's simple! List an item you'd like to trade, browse items from others, and propose a trade. If the other person accepts, you can chat to arrange an in-person exchange. It's a great way to find new treasures without spending money."
    },
    {
      question: "Is it free to use SwapCircle?",
      answer: "Yes, SwapCircle is completely free to use. Our goal is to build a community around sustainable consumption. There are no listing fees or transaction costs."
    },
    {
      question: "How do I arrange the exchange?",
      answer: "Once a trade is accepted, you can use our secure messaging system to chat with the other person. We recommend meeting in a public place, like a coffee shop or community center, to ensure a safe and comfortable swap."
    },
    {
      question: "What can I list for a swap?",
      answer: "You can list almost anything that's in good condition! Popular categories include books, clothing, electronics, and home goods. Please refrain from listing illegal items, services, or anything that violates our community guidelines."
    },
    {
      question: "What if I have a problem with a trade?",
      answer: "We encourage open communication between users to resolve any issues. If you can't reach a resolution, you can contact our support team through the contact form on our website. We're here to help ensure every swap is a positive experience."
    }
  ];

  return (
      <div className="relative">
        <DottedSurface />
        <div className="relative z-10">
          <main>
             <div className="relative">
                <Hero />
            </div>

            {/* How It Works Section */}
            <section className="py-24">
                <HowItWorks />
            </section>
            

            {/* FAQ Section */}
            <section id="faq" className="py-24 bg-transparent min-h-screen flex items-center">
              <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="space-y-4 text-center mb-12">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">Frequently Asked Questions</h2>
                  <p className="text-muted-foreground md:text-xl/relaxed">Have questions? We've got answers.</p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i + 1}`}>
                      <AccordionTrigger className="text-lg font-semibold text-left text-foreground">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-base text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          </main>
        </div>
      </div>
  );
}

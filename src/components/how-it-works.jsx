'use client';

import { useOnView } from "@/hooks/use-on-view";
import { List, Search, ArrowRightLeft, CheckCircle } from "lucide-react";
import React from "react";

export default function HowItWorks() {
  const setHeadingRef = useOnView((el) => {
    el.classList.remove('opacity-0');
    el.classList.add('animate-fade-in-up');
  });

  const steps = [
    {
      icon: List,
      title: "1. List Your Item",
      description: "Take a photo, add a description, and post something you're ready to part with."
    },
    {
      icon: Search,
      title: "2. Browse & Discover",
      description: "Explore a wide variety of items listed by others in the community."
    },
    {
      icon: ArrowRightLeft,
      title: "3. Propose a Trade",
      description: "Found something you like? Offer one of your items in exchange."
    },
    {
      icon: CheckCircle,
      title: "4. Chat & Swap",
      description: "If they accept, chat to arrange a safe and easy in-person exchange."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-transparent">
      <div className="container mx-auto px-4 md:px-6">
        <div 
          ref={setHeadingRef}
          className="space-y-4 text-center mb-12 opacity-0"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground hover-underline">How It Works</h2>
          <p className="md:text-xl/relaxed text-muted-foreground">Swapping made simple in four easy steps.</p>
        </div>
        <div className="cards-grid">
          {steps.map((step, index) => (
            <StepCard key={index} index={index} icon={step.icon} title={step.title} description={step.description} />
          ))}
        </div>
      </div>
    </section>
  );
}

const StepCard = ({ index, icon: Icon, title, description }) => {
    const cardRef = useOnView((el) => {
        el.style.animationDelay = `${index * 100}ms`;
        el.classList.remove('opacity-0');
        el.classList.add('animate-fade-in-up');
    });

  return (
     <div ref={cardRef} className="opacity-0 holographic-card">
        <div className="flow-border"></div>
        <div className="flex items-center justify-center h-16 w-16 mb-4 rounded-full bg-primary/10 text-primary z-10">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="holographic-card-title">{title}</h3>
        <p className="text-muted-foreground text-sm flex-1 z-10 mt-2">{description}</p>
     </div>
  )
}

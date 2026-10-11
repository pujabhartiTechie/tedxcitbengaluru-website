"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Hero from '@/components/sections/hero';
import AboutPreview from '@/components/sections/about-preview';
import EventsPreview from '@/components/sections/events-preview';
import Footer from '@/components/layout/footer';
import RecruitmentFAB from '@/components/sections/recruitment-fab';
import Preloader from '@/components/ui/preloader'; // Ensure you created this file from the previous step!

export default function Home() {
  // State to track if the loading sequence is active
  const [isLoading, setIsLoading] = useState(true);

  // Optional: Lock body scroll while loading so user can't scroll down behind the loader
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-black">
      
      {/* 1. The Preloader Layer */}
      {/* AnimatePresence handles the smooth 'Exit' animation of the loader */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <Preloader onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* 2. The Main Content Layer */}
      {/* We render this immediately so it's ready to be seen when the curtain lifts */}
      <div className="relative z-0">
        <main className="relative">
          <Hero />
          <AboutPreview />
          <EventsPreview />
        </main>
        <Footer />
      </div>

      {/* Floating "Join us" button that opens the apply form at /joinus */}
      {!isLoading && <RecruitmentFAB />}

    </div>
  );
}
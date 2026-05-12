"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const slides = [
    {
        id: 1,
        subtitle: "Super Delicious",
        title: "THE BEST WAY TO STUFF YOUR WALLET.",
        deal: "Today's Best Deal",
        discount: "50% OFF",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop", // High quality headphone
        accent: "#ff4d4d"
    },
    {
        id: 2,
        subtitle: "Premium Sound",
        title: "EXPERIENCE PURE AUDIO BLISS.",
        deal: "Limited Time Offer",
        discount: "30% OFF",
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto=format&fit=crop", // Another headphone/speaker
        accent: "#ff4d4d"
    }
];

export function Hero() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    const slide = slides[currentSlide];

    return (
        <section className="relative min-h-[670px] w-full overflow-hidden bg-[#f3f4f6] py-20 flex items-center z-10">
            {/* Background Image (Common for all slides) */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=2000&auto=format&fit=crop"
                    alt="Keyboard Background"
                    fill
                    className="object-cover opacity-20 grayscale brightness-125"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
            </div>

            <div className="container h-full mx-auto px-4 sm:px-6 lg:px-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col lg:flex-row items-center justify-between h-full py-12 lg:py-0"
                    >
                        {/* Text Content */}
                        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left pr-40">
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-[#ff4d4d] font-bold text-lg md:text-xl tracking-tight"
                            >
                                {slide.subtitle}
                            </motion.p>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-3xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter"
                            >
                                {slide.title.split(' ').map((word, i) => (
                                    <span key={i} className="inline-block mr-3">
                                        {word === "Buy" ? (
                                            <span className="text-slate-400 font-light flex items-center gap-2">
                                                <ShoppingCart className="w-8 h-8 md:w-12 md:h-12" /> Buy
                                            </span>
                                        ) : word}
                                    </span>
                                ))}
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col sm:flex-row items-center gap-6"
                            >
                                <div className="space-y-4">
                                    <p className="text-[#ff4d4d] font-medium text-lg italic">
                                        {slide.deal}
                                    </p>
                                    <Link href="/shop">
                                        <Button
                                            size="lg"
                                            className="h-14 px-10 text-sm font-bold rounded-full bg-[#ff4d4d] hover:bg-[#e6342a] text-white shadow-xl shadow-red-500/20 uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95"
                                        >
                                            Order Now
                                        </Button>
                                    </Link>
                                </div>

                                {/* Discount Badge */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
                                    className="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40"
                                >
                                    <svg viewBox="0 0 200 200" className="absolute w-full h-full text-slate-900 fill-none">
                                        <path
                                            d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
                                            className="stroke-2"
                                            stroke="currentColor"
                                            strokeDasharray="10 5"
                                        />
                                        <path
                                            d="M 100, 100 m -65, 0 a 65,65 0 1,0 130,0 a 65,65 0 1,0 -130,0"
                                            className="stroke-1"
                                            stroke="currentColor"
                                            strokeOpacity="0.2"
                                        />
                                    </svg>
                                    <div className="text-center z-10">
                                        <span className="block text-3xl md:text-4xl font-black text-[#ff4d4d] leading-none">50%</span>
                                        <span className="block text-lg md:text-xl font-bold text-slate-800 leading-none mt-1">OFF</span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Image Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 50 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="w-full lg:w-1/2 relative h-[300px] md:h-[450px] lg:h-[550px] mt-8 lg:mt-0 flex items-center justify-center"
                        >
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-full h-full"
                            >
                                <Image
                                    src={slide.image}
                                    alt={slide.title}
                                    fill
                                    className="object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)]"
                                    priority
                                    unoptimized
                                />
                            </motion.div>
                            {/* Decorative Elements */}
                            <div className="absolute -z-10 w-[70%] h-[70%] bg-white/50 rounded-full blur-3xl" />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                {/* Slider Navigation */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`transition-all duration-300 rounded-full cursor-pointer ${currentSlide === i
                                ? "w-8 h-2.5 bg-[#ff4d4d]"
                                : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

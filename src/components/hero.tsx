"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Play, ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react';
import { useRef } from 'react';

export function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const opacityBackground = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

    return (
        <section ref={containerRef} className="relative min-h-[90vh] w-full overflow-hidden flex items-center bg-black pt-20">
            {/* Mesh Gradient Background */}
            <motion.div
                style={{ y: yBackground, opacity: opacityBackground }}
                className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            >
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />
            </motion.div>

            <div className="container relative z-10 px-6 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8 max-w-2xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[10px] md:text-xs font-semibold text-white/80 tracking-wider uppercase">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        New Collection 2026
                    </div>

                    <h1 className="text-5xl md:text-7xl xl:text-8xl font-black text-white leading-[1.1] tracking-tight">
                        Elevate Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                            Lifestyle
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-lg">
                        Discover a curated selection of premium products designed to enhance your everyday life. Quality, style, and innovation in every detail.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-4">
                        <Link href="/shop">
                            <Button size="lg" className="h-14 px-8 text-base rounded-full bg-blue-600 hover:bg-blue-500 transition-all duration-300 group shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
                                Shop Now
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/about">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all duration-300">
                                Learn More
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Signals */}
                    {/* <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5">
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-white uppercase">4.9/5</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Rating</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-white uppercase">2Y+</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Warranty</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-white uppercase">50K+</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Users</p>
                        </div>
                    </div> */}
                </motion.div>

                {/* Imagery */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center"
                >
                    {/* Floating Glows */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[100px]" />

                    {/* Placeholder for Product Visual */}
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 w-full h-full"
                    >
                        <Image
                            src="/hero-product.png"
                            alt="Premium Selection"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
                            priority
                        />
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-20 group"
            >
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">Scroll</p>
                <div className="w-[1px] h-12 bg-gradient-to-b from-blue-500 to-transparent group-hover:h-16 transition-all duration-500" />
            </motion.button>
        </section>
    );
}

"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Hero() {
    return (
        <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden flex items-center justify-center bg-zinc-900">
            {/* Background Image/Gradient */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black opacity-80" />

            {/* Abstract Background Shapes */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
            </div>

            <div className="container relative z-10 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6 max-w-4xl mx-auto"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-white/80 backdrop-blur-sm">
                        New Collection 2026
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                        Elevate Your <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Lifestyle</span>
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                        Discover a curated selection of premium products designed to enhance your everyday life. Quality, style, and innovation in every detail.
                    </p>
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <Link href="/shop">
                            <Button size="lg" className="h-12 px-8 text-base rounded-full">
                                Shop Now
                            </Button>
                        </Link>
                        <Link href="/about">
                            <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full bg-transparent text-white border-white/20 hover:bg-white/10">
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

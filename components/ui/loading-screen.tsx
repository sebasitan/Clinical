"use client"

import { motion } from "framer-motion"

export function LoadingScreen({ message = "Loading Clinical Data..." }: { message?: string }) {
    return (
        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center p-10">
            <div className="relative w-24 h-24 mb-8">
                {/* Background pulse */}
                <motion.div
                    className="absolute inset-0 bg-blue-100 rounded-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Main spinning square */}
                <motion.div
                    className="absolute inset-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center"
                    animate={{
                        rotate: 360,
                        borderRadius: ["24px", "48px", "24px"]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <div className="w-2 h-8 bg-white/40 rounded-full animate-pulse blur-[1px]" />
                </motion.div>

                {/* Orbiting dots */}
                {[0, 90, 180, 270].map((rotation, i) => (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full"
                        style={{ originX: "-24px" }}
                        animate={{ rotate: rotation + 360 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
            >
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">{message}</h3>
                <div className="mt-4 flex gap-1 justify-center">
                    {[0, 0.1, 0.2].map((delay, i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                                delay,
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

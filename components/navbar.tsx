"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Navbar() {
    return (
        <>


            {/* Header */}
            <header className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 h-24 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 relative overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="Klinik Pergigian Setapak (Sri Rampai) Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="leading-tight">
                            <span className="font-bold text-xl text-slate-900 tracking-tight block">Pergigian Setapak (Sri Rampai)</span>
                            <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-2">
                                <span>Klinik Pergigian</span>
                                <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                                <span className="text-slate-400">Established since 1987</span>
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-10">
                        {['Home', 'Services', 'How It Works', 'Doctors', 'Contact'].map((item) => (
                            <Link
                                key={item}
                                href={
                                    item === 'Home' ? '/' :
                                        item === 'Services' ? '/services' :
                                            item === 'Doctors' ? '/doctors' :
                                                item === 'Contact' ? '/contact' :
                                                    item === 'How It Works' ? '/about' : // Redirect 'How It Works' to About page for richer content
                                                        `/#${item.toLowerCase().replace(/\s/g, '-')}`
                                }
                                className="text-sm font-bold text-slate-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
                            >
                                {item}
                            </Link>
                        ))}
                        <Link href="/booking">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold uppercase tracking-wider text-xs px-6 h-10 shadow-lg shadow-blue-200">
                                Book Appointment
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>
        </>
    )
}

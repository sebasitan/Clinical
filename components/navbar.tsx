"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Navbar() {
    return (
        <>
            {/* Top Bar */}
            <div className="bg-slate-900 text-white py-2 text-xs md:text-sm">
                <div className="container mx-auto px-6 flex justify-end items-center gap-6">
                    <span className="hidden md:inline hover:text-blue-200 cursor-pointer transition-colors">Email</span>
                    <span className="hidden md:inline text-slate-600">|</span>
                    <span className="hover:text-blue-200 cursor-pointer transition-colors">Call</span>
                </div>
            </div>

            {/* Header */}
            <header className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 h-24 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 relative overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="Klinik Pergigian Setapak Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="leading-tight">
                            <span className="font-bold text-xl text-slate-900 tracking-tight block">Pergigian Setapak</span>
                            <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Klinik Pergigian</span>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-10">
                        {['Services', 'How It Works', 'Doctors', 'Media', 'Contact'].map((item) => (
                            <Link
                                key={item}
                                href={item === 'Contact' ? '#contact' : `/#${item.toLowerCase().replace(/\s/g, '-')}`}
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

"use client"

import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Check, Heart, Shield, Users, Award, Sparkles } from "lucide-react"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />

            {/* Sub-Hero Header */}
            <section className="relative pt-24 pb-16 md:pb-20 bg-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent blur-3xl" />
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <span className="text-blue-400 font-black uppercase text-xs tracking-[0.3em] mb-4 block animate-in fade-in slide-in-from-bottom-2 duration-500">Established 2008</span>
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-sans font-black tracking-tighter mb-6 italic italic animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Our Story of <span className="text-blue-500">Excellence.</span>
                    </h1>
                    <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        Discover the passion and commitment behind Klinik Pergigian Setapak (Sri Rampai). We're more than just a clinic; we're your partners in lifelong oral health.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="lg:w-1/2">
                            <div className="relative">
                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-50 rounded-full -z-10" />
                                <Image
                                    src="https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474670/dental-clinic/homepage/hero-dental.jpg"
                                    alt="Our modern facility"
                                    width={800}
                                    height={600}
                                    className="rounded-[3rem] shadow-2xl border-8 border-white object-cover aspect-video"
                                />
                                <div className="absolute -bottom-10 -right-10 p-8 bg-blue-600 rounded-[2rem] text-white shadow-xl max-w-[240px] hidden md:block">
                                    <Sparkles className="w-8 h-8 mb-4 text-blue-200" />
                                    <p className="font-bold text-lg leading-tight">Advanced Digital Imaging Technology</p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-4xl font-sans font-black text-slate-900 tracking-tight">Our Core Mission</h2>
                                <p className="text-slate-600 text-lg leading-relaxed">
                                    At Klinik Pergigian Setapak (Sri Rampai), we believe that a healthy smile is a powerful asset. Our mission is to provide accessible, high-quality, and compassionate dental care to the Setapak community and beyond.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { icon: Heart, title: "Patient-First Care", desc: "Every treatment starts with listening to your needs and concerns." },
                                    { icon: Shield, title: "Modern Safety", desc: "ISO-certified sterilization protocols and digital low-radiation imaging." },
                                    { icon: Users, title: "Expert Team", desc: "Our specialists undergo continuous training to master the latest techniques." },
                                    { icon: Award, title: "Top-Tier Quality", desc: "Premium materials and meticulous craftsmanship in every restoration." }
                                ].map((val, i) => (
                                    <div key={i} className="flex flex-col gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <val.icon className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">{val.title}</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed">{val.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us CTA */}
            <section className="py-16 md:py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-600/10 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight mb-8">Ready to experience <br /><span className="text-blue-500">dentistry Redefined?</span></h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                        <Link href="/booking" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 text-sm md:text-base">
                                Book Your Visit
                            </Button>
                        </Link>
                        <Link href="/contact" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 border-2 border-blue-600/50 bg-transparent hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all text-sm md:text-base">
                                Speak with Us
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

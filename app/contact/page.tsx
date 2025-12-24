"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, MapPin, Send, Clock, Globe } from "lucide-react"

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setTimeout(() => {
            setIsSubmitting(false)
            alert("Message sent successfully!")
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />

            {/* Header */}
            <section className="pt-24 pb-16 md:pt-32 md:pb-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl">
                        <span className="text-blue-600 font-black uppercase text-xs tracking-widest mb-4 md:mb-6 block">Direct Communication</span>
                        <h1 className="text-4xl md:text-7xl font-sans font-black text-slate-900 tracking-tighter mb-6 md:mb-8 leading-tight">
                            Get in touch for <br /><span className="text-blue-600">Clinical Assistance.</span>
                        </h1>
                        <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                            Our team is ready to assist you with inquiries regarding treatments, scheduling, and emergency triage. Expect a reply within 4 working hours.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Grid */}
            <section className="pb-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-16">
                        {/* Contact Form */}
                        <div className="lg:w-3/5">
                            <form onSubmit={handleSubmit} className="bg-slate-50 p-8 md:p-12 rounded-[3rem] space-y-8 border border-slate-100 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500">Full Name</Label>
                                        <Input id="name" placeholder="John Doe" required className="h-14 bg-white border-0 shadow-sm rounded-xl focus-visible:ring-blue-600" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500">Email Address</Label>
                                        <Input id="email" type="email" placeholder="john@example.com" required className="h-14 bg-white border-0 shadow-sm rounded-xl focus-visible:ring-blue-600" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="subject" className="text-xs font-black uppercase tracking-widest text-slate-500">Topic of Interest</Label>
                                    <Input id="subject" placeholder="General Consultation / Cosmetic Dentistry" required className="h-14 bg-white border-0 shadow-sm rounded-xl focus-visible:ring-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-slate-500">Message details</Label>
                                    <Textarea id="message" placeholder="Tell us how we can help..." required className="min-h-[160px] bg-white border-0 shadow-sm rounded-2xl focus-visible:ring-blue-600 p-6" />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-200">
                                    {isSubmitting ? "Transmitting..." : "Send Message"} <Send className="w-4 h-4 ml-3" />
                                </Button>
                            </form>
                        </div>

                        {/* Direct Info */}
                        <div className="lg:w-2/5 space-y-12">
                            <div className="space-y-8">
                                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-blue-600">Quick Connect</h3>
                                <div className="space-y-8">
                                    <div className="flex gap-6 items-start">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Clinic Hotline</h4>
                                            <p className="text-slate-500 font-medium">+60 17-510 1003</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 items-start">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-900">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Email Enquiries</h4>
                                            <p className="text-slate-500 font-medium">Kpsetapaksr@gmail.com</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 items-start">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 text-white">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Physical Location</h4>
                                            <p className="text-slate-500 font-medium leading-relaxed">16-2, Jalan 46/26, Taman Sri Rampai, <br /> 53300 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-blue-600 rounded-[3rem] text-white space-y-6 shadow-2xl shadow-blue-100">
                                <Clock className="w-10 h-10 text-blue-200 mb-4" />
                                <h4 className="text-2xl font-black">Our Office Hours</h4>
                                <div className="space-y-3 font-medium">
                                    <div className="flex justify-between border-b border-blue-500/30 pb-3">
                                        <span>Mon — Fri</span>
                                        <span className="font-black">09:00 — 18:00</span>
                                    </div>
                                    <div className="flex justify-between border-b border-blue-500/30 pb-3">
                                        <span>Saturday</span>
                                        <span className="font-black">09:00 — 13:00</span>
                                    </div>
                                    <div className="flex justify-between text-blue-200">
                                        <span>Sunday</span>
                                        <span className="uppercase tracking-widest text-xs font-black">Closed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

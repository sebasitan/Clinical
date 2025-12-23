"use client"

import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Stethoscope, GraduationCap, Award, Heart, CheckCircle2 } from "lucide-react"

export default function DoctorsPage() {
    const doctors = [
        {
            name: "Dr. Sarah Bennett",
            role: "Lead Dentist & Oral Surgeon",
            specialty: "Implantology",
            bio: "With over 15 years of experience in restorative dentistry, Dr. Bennett specializes in complex oral rehabilitations and dental implants.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766475059/dental-clinic/faculty/professional-female-asian-dentist.jpg",
            creds: ["DDS (High Honors)", "MSc Implantology", "Fellow of ITI"]
        },
        {
            name: "Dr. Mike Lei",
            role: "Senior Cosmetic Specialist",
            specialty: "Aesthetic Dentistry",
            bio: "Dr. Lei is renowned for his meticulously crafted smiles, combining digital design with artistic clinical application.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766475060/dental-clinic/faculty/professional-male-asian-orthodontist.jpg",
            creds: ["DDS", "PG Dip Aesthetic Dentistry", "AACD Member"]
        },
        {
            name: "Dr. Micheal Reyes",
            role: "Pediatric Dental Specialist",
            specialty: "Children's Care",
            bio: "Dedicated to creating positive dental experiences for young patients, specializing in gentle care and preventive education.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766475057/dental-clinic/faculty/professional-female-asian-cosmetic-dentist.jpg",
            creds: ["DDS", "MS Pediatric Dentistry", "Board Certified"]
        },
        {
            name: "Dr. James Carter",
            role: "Consultant Orthodontist",
            specialty: "Bite & Alignment",
            bio: "Expert in both traditional braces and clear aligner therapy, focusing on functional harmony and aesthetics.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766475060/dental-clinic/faculty/professional-male-asian-orthodontist.jpg",
            creds: ["BDS", "MDS Orthodontics", "Invisalign Platinum Provider"]
        }
    ]

    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />

            {/* Header */}
            <section className="pt-32 pb-20 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <span className="text-blue-600 font-black uppercase text-xs tracking-widest mb-6 block">Our Faculty</span>
                    <h1 className="text-5xl md:text-7xl font-sans font-black text-slate-900 tracking-tighter mb-8 italic">Medical <span className="text-blue-600">Leadership.</span></h1>
                    <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Meet the clinicians who set the standard for dental excellence in Setapak. Each specialist brings decades of combined global expertise to our clinic.
                    </p>
                </div>
            </section>

            {/* Doctors Detailed Grid */}
            <section className="pb-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="space-y-24">
                        {doctors.map((doc, i) => (
                            <div key={i} className={`flex flex-col lg:flex-row items-center gap-16 ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                                <div className="lg:w-1/2 relative">
                                    <div className="relative rounded-[3rem] overflow-hidden shadow-2xl group transition-all duration-500">
                                        <Image
                                            src={doc.image}
                                            alt={doc.name}
                                            width={800}
                                            height={1000}
                                            className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                        />
                                        <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-transparent transition-colors" />
                                    </div>
                                    <div className={`absolute -bottom-8 ${i % 2 === 0 ? '-right-8' : '-left-8'} p-8 bg-white rounded-[2rem] shadow-xl border border-slate-50 hidden md:block`}>
                                        <Award className="w-8 h-8 text-blue-600 mb-2" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Board Certified</p>
                                    </div>
                                </div>
                                <div className="lg:w-1/2 space-y-8">
                                    <div className="space-y-4">
                                        <span className="text-blue-600 font-bold uppercase text-sm tracking-wider">{doc.specialty}</span>
                                        <h2 className="text-5xl font-black text-slate-900 tracking-tight">{doc.name}</h2>
                                        <p className="text-slate-900 font-black uppercase text-xs tracking-[0.2em]">{doc.role}</p>
                                    </div>
                                    <p className="text-slate-500 text-lg leading-relaxed">
                                        {doc.bio}
                                    </p>
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-blue-600" />
                                            Credentials & Affiliations
                                        </h4>
                                        <div className="flex flex-wrap gap-3">
                                            {doc.creds.map((cred, j) => (
                                                <span key={j} className="px-4 py-2 bg-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-100 italic">
                                                    {cred}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-6">
                                        <Link href="/booking">
                                            <Button className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition-all hover:-translate-y-1">
                                                Schedule Consultation
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Banner */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { title: "Ethical Practice", desc: "No unnecessary treatments. Transparent clinical reasoning." },
                            { title: "Continuous Education", desc: "Monthly clinical reviews and international seminars." },
                            { title: "Precision Instruments", desc: "Equipped with the finest German and Japanese technology." }
                        ].map((v, i) => (
                            <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-6" />
                                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight uppercase italic">{v.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

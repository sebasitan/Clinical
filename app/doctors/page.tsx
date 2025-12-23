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
            name: "Dr. Netheananthene",
            role: "Dental Practitioner",
            specialty: "General Dentistry",
            bio: "Expert in providing comprehensive dental care with a focus on patient comfort and modern treatment techniques.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474669/dental-clinic/homepage/Dr.Netheananthene.png",
            creds: ["BDS", "General Practice Residency"]
        },
        {
            name: "Dr. Durshayine",
            role: "Dental Practitioner",
            specialty: "Pediatric Care",
            bio: "Dedicated to providing gentle and effective dental care for children, ensuring a positive experience from a young age.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474662/dental-clinic/homepage/Dr.Durshayine.png",
            creds: ["BDS", "Pediatric Dentistry Clinical Fellowship"]
        },
        {
            name: "Dr. Kanagarathinam",
            role: "Dental Practitioner",
            specialty: "Restorative Dentistry",
            bio: "Specializes in restoring dental function and aesthetics using advanced materials and meticulous clinical skills.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474647/dental-clinic/homepage/Dr_Kanagarathinam.png",
            creds: ["DDS", "Advanced Restorative Training"]
        },
        {
            name: "Dr. Sharviind Raj",
            role: "Dental Practitioner",
            specialty: "Oral Health",
            bio: "Focused on preventive care and maintaining long-term oral health for all patients in the Setapak community.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474655/dental-clinic/homepage/Dr_Sharviind_Raj.png",
            creds: ["BDS", "Public Health Dentistry"]
        },
        {
            name: "Dr. Nicholas Gabriel",
            role: "Dental Practitioner",
            specialty: "Orthodontics",
            bio: "Passionate about smile alignment and functional harmony, offering expert orthodontic solutions for all ages.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474658/dental-clinic/homepage/Dr._Nicholas_Gabriel.png",
            creds: ["DDS", "Orthodontic Specialization"]
        },
        {
            name: "Dr. Navin Nair",
            role: "Dental Practitioner",
            specialty: "Cosmetic Dentistry",
            bio: "Specializes in aesthetic transformations, combining artistic vision with clinical excellence for your best smile.",
            image: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474651/dental-clinic/homepage/Dr_Navin_Nair.png",
            creds: ["BDS", "Cosmetic Dentistry Certification"]
        }
    ]

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <Navbar />

            {/* Header */}
            <section className="pt-32 pb-20 bg-slate-50">
                <div className="container mx-auto px-6 text-center">
                    <span className="text-blue-600 font-black uppercase text-xs tracking-widest mb-6 block">Our Faculty</span>
                    <h1 className="text-5xl md:text-7xl font-sans font-black tracking-tighter mb-8 italic">Medical <span className="text-blue-600">Leadership.</span></h1>
                    <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Meet the clinicians who set the standard for dental excellence in Setapak. Each specialist brings decades of combined global expertise to our clinic.
                    </p>
                </div>
            </section>

            {/* Doctors Grid */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {doctors.map((doc, i) => (
                            <div key={i} className="group bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:shadow-2xl transition-all duration-300">
                                <div className="relative mb-8">
                                    <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-xl border-4 border-slate-50">
                                        <Image
                                            src={doc.image}
                                            alt={doc.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="absolute -bottom-4 right-4 p-4 bg-white rounded-2xl shadow-lg border border-slate-100">
                                        <Award className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-blue-600 font-bold uppercase text-[10px] tracking-wider mb-2 block">{doc.specialty}</span>
                                        <h2 className="text-3xl font-black tracking-tight mb-1">{doc.name}</h2>
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{doc.role}</p>
                                    </div>

                                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                                        {doc.bio}
                                    </p>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {doc.creds.map((cred, j) => (
                                            <span key={j} className="px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 italic">
                                                {cred}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="pt-4">
                                        <Link href="/booking">
                                            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all">
                                                Book Consultation
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

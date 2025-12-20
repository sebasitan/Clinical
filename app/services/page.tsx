"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
    ShieldCheck,
    Sparkles,
    Smile,
    Stethoscope,
    ArrowRight,
    Zap,
    CheckCircle2,
    Heart,
    Focus,
    Layers,
    Activity,
    Clock,
    Shield
} from "lucide-react"

export default function ServicesPage() {
    const services = [
        {
            icon: ShieldCheck,
            title: "General Dentistry",
            price: "Essential Care",
            desc: "The clinical foundation for long-term oral health. We focus on early detection and biological preservation.",
            features: ["Prophylaxis (Scaling)", "Digital Low-Radiation X-rays", "Biocompatible Fillings", "Periodontal Therapy"],
            color: "blue",
            image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800"
        },
        {
            icon: Sparkles,
            title: "Cosmetic Design",
            price: "Artistic Excellence",
            desc: "Transforming smiles into masterpieces. Our aesthetic protocols balance facial symmetry with natural translucency.",
            features: ["Digital Smile Design", "Hand-Layered Veneers", "Premium Laser Whitening", "Invisalign® System"],
            color: "indigo",
            image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=800"
        },
        {
            icon: Stethoscope,
            title: "Restorative Surgery",
            price: "Functional Recovery",
            desc: "Advanced rehabilitation using high-grade materials. We restore bite function and structural integrity seamlessly.",
            features: ["Titanium Implants", "Zirconia Multi-unit Bridges", "Full Mouth Rehab", "Endodontic Triage"],
            color: "slate",
            image: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=800"
        },
        {
            icon: Zap,
            title: "Emergency Triage",
            price: "Immediate Relief",
            desc: "On-call clinical support for acute complications. We prioritize same-day intervention for pain and trauma.",
            features: ["Pulpitis Treatment", "Abscess Management", "Dental Trauma Care", "Surgical Extractions"],
            color: "rose",
            image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800"
        }
    ]

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            <Navbar />

            {/* Premium Hero Section */}
            <section className="relative pt-32 pb-32 lg:pt-48 lg:pb-48 bg-slate-900 overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-8">
                            Clinical Specialties
                        </span>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-[0.85] mb-8">
                            PRECISION <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">DENTISTRY.</span>
                        </h1>
                        <p className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
                            Merging high-fidelity technology with biological integrity. Discover a new standard of dental care tailored to your unique anatomy.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Clinical Value Props */}
            <section className="py-24 bg-white -mt-20 relative z-20 rounded-t-[4rem] shadow-[0_-40px_100px_rgba(0,0,0,0.1)]">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        {[
                            { icon: Focus, title: "Micro-Precision", desc: "Utilizing digital scanning for sub-millimeter clinical accuracy." },
                            { icon: Shield, title: "Bio-Integrity", desc: "Exclusively non-toxic, biocompatible ceramic and resin materials." },
                            { icon: Clock, title: "Swift Interlinking", desc: "Streamlined diagnostic-to-treatment workflows to save you time." }
                        ].map((prop, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="space-y-4"
                            >
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto border border-slate-100">
                                    <prop.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{prop.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{prop.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Redesigned Services Grid */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-6">
                    <div className="space-y-12">
                        {services.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className={`flex flex-col lg:flex-row gap-12 items-stretch group ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
                            >
                                {/* Media Panel */}
                                <div className="lg:w-1/2 relative min-h-[400px] h-full rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white">
                                    <Image
                                        src={s.image}
                                        alt={s.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors duration-500" />

                                    {/* Icon Floating Badge */}
                                    <div className="absolute top-10 left-10 p-6 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl flex items-center justify-center text-blue-600">
                                        <s.icon className="w-10 h-10" />
                                    </div>

                                    {/* Price/Type Badge */}
                                    <div className="absolute bottom-10 right-10 px-8 py-3 bg-blue-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
                                        {s.price}
                                    </div>
                                </div>

                                {/* Content Panel */}
                                <div className="lg:w-1/2 flex flex-col justify-center p-8 lg:p-12 space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic italic">
                                            {s.title}
                                        </h3>
                                        <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-xl">
                                            {s.desc}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {s.features.map((f, j) => (
                                            <div key={j} className="flex items-center gap-4 group/feature">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-500 group-hover/feature:bg-emerald-500 group-hover/feature:text-white transition-all duration-300">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6">
                                        <Link href="/booking">
                                            <Button size="lg" className="h-16 px-12 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 transition-all">
                                                Schedule Clinical Session <ArrowRight className="ml-3 w-5 h-5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Diagnostic Process Section */}
            <section className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center mb-20">
                        <span className="text-blue-600 font-black uppercase text-xs tracking-[0.3em] mb-4 block">The Patient Journey</span>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">Diagnostic to <span className="text-blue-600">Delighted.</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line - Desktop */}
                        <div className="hidden md:block absolute top-1/4 left-0 w-full h-1 bg-blue-100 -z-0" />

                        {[
                            { step: "01", title: "Digital Intake", desc: "Comprehensive scanning and high-res imaging." },
                            { step: "02", title: "Assessment", desc: "Specialist review of biological structures." },
                            { step: "03", title: "Simulation", desc: "Preview your biological-aesthetic result." },
                            { step: "04", title: "Treatment", desc: "Minimally invasive clinical execution." }
                        ].map((item, i) => (
                            <div key={i} className="relative z-10 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                                <span className="text-4xl font-black text-blue-100 group-hover:text-blue-600 transition-colors mb-6 block">{item.step}</span>
                                <h4 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">{item.title}</h4>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA Section */}
            <section className="py-32 bg-white text-center">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto space-y-12">
                        <div className="inline-block p-8 bg-blue-50 rounded-full mb-4">
                            <Heart className="w-16 h-16 text-blue-600 animate-pulse" />
                        </div>
                        <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85]">
                            YOUR PERFECT SMILE <br />
                            <span className="text-blue-600 tracking-normal">AWAITS YOU.</span>
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                            <Link href="/booking">
                                <Button size="lg" className="h-20 px-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-lg shadow-2xl shadow-blue-200 hover:-translate-y-2 transition-all">
                                    Secure A Slot
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button variant="outline" size="lg" className="h-20 px-16 border-2 border-slate-200 hover:border-slate-900 text-slate-900 rounded-[2rem] font-black uppercase tracking-widest text-lg transition-all">
                                    Clinic Enquiry
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

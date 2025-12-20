import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-slate-900 text-white pt-20 pb-10" id="contact">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand & Mission */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 relative bg-white rounded-lg p-1">
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="leading-tight">
                                <span className="font-bold text-lg text-white tracking-tight block">Pergigian Setapak (Sri Rampai)</span>
                                <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest">Klinik Pergigian</span>
                            </div>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Providing world-class dental care with a personal touch. Our mission is to ensure every patient leaves with a healthy, confident smile they love.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://www.facebook.com/klinikpergigiansetapaksrirampai/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://www.instagram.com/setapakdental/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-8 text-blue-400">Navigation</h4>
                        <ul className="space-y-4">
                            {['Home', 'Services', 'How It Works', 'Doctors', 'Contact'].map((item) => (
                                <li key={item}>
                                    <Link
                                        href={
                                            item === 'Home' ? '/' :
                                                item === 'Services' ? '/services' :
                                                    item === 'Doctors' ? '/doctors' :
                                                        item === 'Contact' ? '/contact' :
                                                            item === 'How It Works' ? '/about' :
                                                                `/#${item.toLowerCase().replace(/\s/g, '-')}`
                                        }
                                        className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href="/booking" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Book Appointment</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-8 text-blue-400">Contact Us</h4>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-slate-400 text-sm leading-relaxed">
                                    16-2, Jalan 46/26, Taman Sri Rampai, 53300 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia
                                </span>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-slate-400 text-sm font-medium">+60 17-510 1003</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-slate-400 text-sm font-medium">hello@kpsrirampai.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Opening Hours */}
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-8 text-blue-400">Opening Hours</h4>
                        <ul className="space-y-4">
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Mon — Fri</span>
                                <span className="text-white font-bold">09:00 — 18:00</span>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Saturday</span>
                                <span className="text-white font-bold">09:00 — 13:00</span>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Sunday</span>
                                <span className="text-rose-400 font-bold uppercase tracking-widest text-xs">Closed</span>
                            </li>
                        </ul>
                        <div className="mt-8 p-4 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                            <p className="text-xs text-blue-200 leading-relaxed italic">
                                * Emergency cases are prioritized. Please call ahead for immediate assistance.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} Pergigian Setapak (Sri Rampai). All rights reserved.
                    </p>
                    <div className="flex items-center gap-8">
                        <Link href="#" className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Privacy Policy</Link>
                        <Link href="#" className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookingWizard } from "@/components/booking-wizard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Smile, Check, ArrowRight, ShieldCheck, Sparkles, Stethoscope, Monitor, Phone, Mail } from "lucide-react"

export default function HomePage() {
  return (
    // Applied Outfit font as display and Inter as sans
    <div className="min-h-screen bg-white font-sans">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-2 text-xs md:text-sm">
        <div className="container mx-auto px-6 flex justify-end items-center gap-6">
          <span className="hidden md:inline hover:text-blue-200 cursor-pointer transition-colors">Email</span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hover:text-blue-200 cursor-pointer transition-colors">Call</span>
          <span className="hidden md:inline text-slate-600">|</span>
          <div className="flex items-center gap-2 hover:text-blue-200 cursor-pointer transition-colors">
            <span>Start Virtual Doctor</span>
          </div>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hover:text-blue-200 cursor-pointer transition-colors">Start Second Medical Opinion</span>
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
                href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
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

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
        {/* Background Gradient similar to reference */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 -z-20" />
        {/* Subtle overlay texture/blob */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 -z-10" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Left Content - Pushed for right alignment in visual hierarchy as per ref, but typically hero text is left. 
                Ref image has text on right. Let's stick to standard left for readability unless user asks to flip, 
                BUT I will match the typography style exactly. */}

            <div className="lg:w-1/2 relative z-20 space-y-8 text-center lg:text-left">
              <div>
                <h2 className="font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 text-sm md:text-base">
                  Get your dental care now
                </h2>
                <h1 className="font-black text-6xl md:text-7xl lg:text-8xl text-slate-900 uppercase leading-[0.9] tracking-tighter mb-6">
                  Setapak <br />
                  <span className="text-blue-700">Dental.</span>
                </h1>
              </div>

              <p className="font-sans text-slate-500 text-lg md:text-xl font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Expert dental care in the heart of Setapak. Professional consultation and modern treatments for your bright and healthy smile.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                <Link href="/booking">
                  <Button size="lg" className="h-14 px-10 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-sm font-bold uppercase tracking-widest shadow-xl shadow-rose-200 transition-all hover:-translate-y-1">
                    Get Started
                  </Button>
                </Link>

                <Link href="#services">
                  <Button variant="outline" size="lg" className="h-14 px-10 border-2 border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 rounded-full text-sm font-bold uppercase tracking-widest transition-all">
                    Services
                  </Button>
                </Link>
              </div>
            </div>


            {/* Right Image */}
            <div className="lg:w-1/2 relative">
              <div className="relative z-10">
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
                  <Image
                    src="/professional-female-asian-dentist.jpg"
                    alt="Professional Dentist"
                    width={800}
                    height={900}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  {/* Floating Overlay Card */}

                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative">
              <div className="flex gap-4">
                <div className="w-1/2 pt-12">
                  <Image
                    src="/professional-female-asian-dentist.jpg"
                    width={400}
                    height={500}
                    alt="Dentist 1"
                    className="rounded-3xl shadow-lg object-cover w-full h-80"
                  />
                </div>
                <div className="w-1/2">
                  <Image
                    src="/professional-male-asian-orthodontist.jpg"
                    width={400}
                    height={500}
                    alt="Dentist 2"
                    className="rounded-3xl shadow-lg object-cover w-full h-80"
                  />
                </div>
              </div>
            </div>

            <div className="lg:w-1/2">
              <span className="text-blue-500 font-bold uppercase text-sm tracking-wider">About Us</span>
              <h2 className="font-sans font-bold text-5xl md:text-6xl text-slate-900 mt-4 mb-6 leading-tight">
                Professionals and <br /> Personalized <span className="text-blue-600">Dental Excellence</span>
              </h2>
              <p className="font-sans text-slate-600 text-xl mb-8 leading-relaxed">
                We offer high-quality dental care services for your entire family. From routine check-ups to smile makeovers,
                we ensure you leave with a bright and healthy smile. Our team is dedicated to providing a comfortable and stress-free
                experience for patients of all ages, utilizing the latest technology for precise and effective treatments.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {['Personalized Treatment Plans', 'Modern Dental Technology', 'Gentle Care for Kids and Adults', 'Comfortable Environment'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-semibold text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-lg shadow-lg shadow-blue-200">
                More About Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-slate-50" id="services">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-blue-500 font-bold uppercase text-sm tracking-wider">Our Services</span>
            <h2 className="font-sans font-bold text-5xl md:text-6xl text-slate-900 mt-4 mb-6">Comprehensive Care</h2>
            <p className="font-sans text-xl text-slate-600">
              From preventive care to complex restorative procedures, we provide a full range of dental services designed to meet your individual needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "General Dentistry",
                desc: "Routine check-ups, cleanings, and preventive care to keep your smile healthy and bright all year round."
              },
              {
                icon: Sparkles,
                title: "Cosmetic Dentistry",
                desc: "Transform your smile with veneers, professional whitening, and aesthetic bonding procedures."
              },
              {
                icon: Smile,
                title: "Pediatric Dentistry",
                desc: "Specialized, gentle care ensuring a fun and comfortable experience for our youngest patients."
              },
              {
                icon: Stethoscope,
                title: "Restorative Dentistry",
                desc: "Expert solutions including crowns, bridges, and implants to restore the function and beauty of your teeth."
              },
            ].map((s, i) => (
              <div key={i} className="group bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-blue-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out -z-0" />

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                    <s.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-sans font-bold text-3xl text-slate-900 mb-4">{s.title}</h3>
                  <p className="font-sans text-lg text-slate-500 leading-relaxed mb-8">{s.desc}</p>

                  <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 font-bold text-lg group-hover:gap-3 transition-all">
                    <span>Learn More</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-blue-50/50">
        <div className="container mx-auto px-6 text-center">
          <span className="text-blue-500 font-bold uppercase text-sm tracking-wider">Meet Our Special Team</span>
          <h2 className="font-sans font-bold text-5xl md:text-6xl text-slate-900 mt-3 mb-6">Committed to Your Smile</h2>
          <p className="font-sans text-xl text-slate-600 max-w-2xl mx-auto mb-16">
            Our team of experienced dentists and specialists are passionate about providing the highest standard of care in a friendly environment.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Dr. Sarah Bennett", role: "Lead Dentist" },
              { name: "Dr. Mike Lei", role: "Cosmetic Dentist" },
              { name: "Dr. Micheal Reyes", role: "Pediatric Specialist" },
              { name: "Dr. James Carter", role: "Dental Hygienist" },
            ].map((doc, i) => (
              <div key={i} className="relative group overflow-hidden rounded-3xl h-96">
                <Image
                  src={i % 2 === 0 ? "/professional-female-asian-cosmetic-dentist.jpg" : "/professional-male-asian-orthodontist.jpg"}
                  alt={doc.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform">
                  <h4 className="font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-blue-500 text-xs font-semibold uppercase">{doc.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-16 mt-20">
            {[
              { label: "Happy Patients", val: "10000+" },
              { label: "Teeth Whitened", val: "2500+" },
              { label: "Dental Implants", val: "800+" },
              { label: "Years of Experience", val: "15+" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <h3 className="font-bold text-4xl text-slate-900 mb-2">{stat.val}</h3>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2" />

        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-1/3 sticky top-24">
              <span className="text-blue-600 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                <span className="w-8 h-[2px] bg-blue-600"></span> FAQ
              </span>
              <h2 className="font-sans font-bold text-5xl md:text-6xl text-slate-900 mt-6 leading-tight mb-6">
                Common Questions
              </h2>
              <p className="font-sans text-xl text-slate-500 leading-relaxed mb-8">
                We've collected some of the most frequently asked questions to help you understand our services better.
              </p>

              <div className="bg-blue-600 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <h4 className="font-sans text-2xl font-bold mb-2 relative z-10">Still have questions?</h4>
                <p className="font-sans text-blue-100 mb-6 relative z-10">Can't find the answer you're looking for? Please chat to our friendly team.</p>
                <Link href="/contact">
                  <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold h-12 rounded-xl relative z-10">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:w-2/3 w-full">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {[
                  { q: "How often should I visit the dentist?", a: "For most people, we recommend a check-up and cleaning every six months. However, your dentist might suggest more frequent visits depending on your specific oral health needs." },
                  { q: "What should I do in a dental emergency?", a: "Contact us immediately. We offer emergency dental services for severe pain, knocked-out teeth, or broken restorations. If it's outside hours, seek local emergency medical care." },
                  { q: "Do you offer services for kids?", a: "Yes! We love treating children. Our pediatric dentistry services are designed to make your child's visit fun, safe, and educational." },
                  { q: "How can I improve my smile's brightness?", a: "We offer professional teeth whitening treatments that are far more effective than over-the-counter options. We also offer veneers for a more permanent solution." },
                  { q: "Does the clinic accept insurance?", a: "We accept most major dental insurance plans. Please contact our front desk with your policy details, and we'll help you understand your coverage." },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-none bg-slate-50 rounded-2xl px-8 data-[state=open]:bg-white data-[state=open]:shadow-xl transition-all duration-300">
                    <AccordionTrigger className="text-xl font-sans font-bold text-slate-800 hover:text-blue-600 hover:no-underline py-6 [&[data-state=open]]:text-blue-600 text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-lg font-sans text-slate-500 pb-8 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Video/Image Section */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="relative rounded-[2.5rem] overflow-hidden h-[500px] shadow-2xl">
            <Image
              src="/hero-dental.png"
              alt="Clinic Interior"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-blue-600 border-b-[8px] border-b-transparent ml-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Footer should go here - (kept minimal for now as requested focused on home page design) */}
    </div>
  )
}

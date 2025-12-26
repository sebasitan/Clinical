"use client"

import { useState, useEffect } from "react"
import { getAnnouncementsAsync } from "@/lib/storage"
import type { Announcement } from "@/lib/types"
import { AlertCircle, Info, CheckCircle2, Megaphone, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const load = async () => {
            const data = await getAnnouncementsAsync(false)
            setAnnouncements(data)
        }
        load()
    }, [])

    if (!isVisible || announcements.length === 0) return null

    const ann = announcements[0] // Show the latest active one

    const getColors = (type: Announcement['type']) => {
        switch (type) {
            case 'emergency': return "bg-rose-600 text-white"
            case 'warning': return "bg-amber-500 text-white"
            case 'success': return "bg-emerald-600 text-white"
            default: return "bg-blue-600 text-white"
        }
    }

    const getIcon = (type: Announcement['type']) => {
        switch (type) {
            case 'emergency': return <AlertCircle className="w-5 h-5" />
            case 'warning': return <AlertCircle className="w-5 h-5" />
            case 'success': return <CheckCircle2 className="w-5 h-5" />
            default: return <Megaphone className="w-5 h-5" />
        }
    }

    return (
        <div className={cn(
            "relative z-[100] w-full py-3 px-6 animate-in slide-in-from-top duration-500",
            getColors(ann.type)
        )}>
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex w-8 h-8 rounded-full bg-white/20 items-center justify-center shrink-0">
                        {getIcon(ann.type)}
                    </div>
                    <div>
                        <span className="font-black uppercase tracking-widest text-[10px] opacity-80 block leading-none mb-1">
                            {ann.type === 'info' ? 'Clinical Update' : ann.type}
                        </span>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                            <span className="font-bold text-sm md:text-base leading-tight">
                                {ann.title}
                            </span>
                            <span className="text-xs md:text-sm font-medium opacity-90 hidden lg:inline">
                                — {ann.message}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 rounded-full h-8 px-4 font-bold uppercase text-[10px] tracking-widest hidden sm:flex"
                        onClick={() => setIsVisible(false)}
                    >
                        Dismiss
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 rounded-full h-8 w-8"
                        onClick={() => setIsVisible(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}

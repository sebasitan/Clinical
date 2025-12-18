"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getDoctors, getAvailabilityBlocks, addAvailabilityBlock, deleteAvailabilityBlock } from "@/lib/storage"
import type { Doctor, AvailabilityBlock } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
    Clock,
    Calendar as CalendarIcon,
    Trash2,
    Plus,
    UserCheck,
    Timer,
    Repeat,
    CalendarPlus,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Layers,
    CalendarRange,
    CheckCircle2,
    Settings2,
    ArrowRight,
    Zap,
    History,
    CalendarDays
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const SESSION_TEMPLATES = [
    { label: "Morning Shift", start: "09:00", end: "13:00", color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Afternoon Shift", start: "14:00", end: "18:00", color: "text-amber-600 bg-amber-50 border-amber-100" },
    { label: "Full Day", start: "09:00", end: "18:00", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
]

const DAYS_OF_WEEK = [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
    { label: "Sun", value: 0 },
]

export default function AvailabilityPage() {
    const { isLoading } = useAdminAuth()
    const { toast } = useToast()
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])

    // Global filter
    const [dateFilter, setDateFilter] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Configuration Mode
    const [configMode, setConfigMode] = useState<"single" | "recurring">("single")
    const [selectedDoctor, setSelectedDoctor] = useState("")

    // Form state
    const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0])
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState("")
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
    const [startTime, setStartTime] = useState("09:00")
    const [endTime, setEndTime] = useState("13:00")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        setDoctors(getDoctors().filter(d => d.isActive))
        setBlocks(getAvailabilityBlocks())
    }

    const applyTemplate = (t: typeof SESSION_TEMPLATES[0]) => {
        setStartTime(t.start)
        setEndTime(t.end)
        toast({ title: `Template Applied`, description: t.label })
    }

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDoctor) {
            toast({ title: "Configuration Error", description: "Select a doctor.", variant: "destructive" })
            return
        }

        if (configMode === "single") {
            addAvailabilityBlock({ doctorId: selectedDoctor, date: singleDate, startTime, endTime })
            toast({ title: "Duty Assigned", description: `Added for ${singleDate}` })
        } else {
            if (!endDate) {
                toast({ title: "Range Missing", description: "Please select an end date.", variant: "destructive" })
                return
            }

            const current = new Date(startDate)
            const last = new Date(endDate)
            let count = 0

            while (current <= last) {
                const day = current.getDay()
                if (selectedDays.includes(day)) {
                    addAvailabilityBlock({
                        doctorId: selectedDoctor,
                        date: current.toISOString().split('T')[0],
                        startTime,
                        endTime
                    })
                    count++
                }
                current.setDate(current.getDate() + 1)
            }
            toast({ title: "Recurring Assignment Success", description: `Generated ${count} duty cycles.` })
        }

        loadData()
    }

    const handleDelete = (id: string) => {
        deleteAvailabilityBlock(id)
        toast({ title: "Block Terminated", variant: "default" })
        loadData()
    }

    const clearDate = (date: string) => {
        const blocksToDelete = blocks.filter(b => b.date === date)
        blocksToDelete.forEach(b => deleteAvailabilityBlock(b.id))
        toast({ title: `Cleared all duties for ${date}` })
        loadData()
    }

    const groupedBlocks = useMemo(() => {
        const filtered = blocks.filter(b => {
            const dateMatch = !dateFilter || b.date === dateFilter
            const docFilter = searchQuery.toLowerCase()
            const dr = doctors.find(d => d.id === b.doctorId)
            const searchMatch = !searchQuery ||
                dr?.name.toLowerCase().includes(docFilter) ||
                dr?.specialization.toLowerCase().includes(docFilter)
            return dateMatch && searchMatch
        })

        return filtered.reduce((acc, block) => {
            if (!acc[block.date]) acc[block.date] = []
            acc[block.date].push(block)
            return acc
        }, {} as Record<string, AvailabilityBlock[]>)
    }, [blocks, dateFilter, searchQuery, doctors])

    const sortedDates = Object.keys(groupedBlocks).sort()

    if (isLoading) return null

    return (
        <div className="flex-1 bg-slate-50/50 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-8 py-6 shrink-0 z-10">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full">Workforce Intelligence</span>
                        </div>
                        <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight">Clinical Duty Hub</h1>
                        <p className="text-slate-500 text-sm mt-1">Strategic oversight and management of clinical availability pipelines.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                            <Button
                                variant="ghost"
                                className={cn("h-10 px-6 rounded-xl text-xs font-bold gap-2 transition-all", configMode === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400')}
                                onClick={() => setConfigMode('single')}
                            >
                                <CalendarPlus className="w-3.5 h-3.5" /> Single
                            </Button>
                            <Button
                                variant="ghost"
                                className={cn("h-10 px-6 rounded-xl text-xs font-bold gap-2 transition-all", configMode === 'recurring' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400')}
                                onClick={() => setConfigMode('recurring')}
                            >
                                <Repeat className="w-3.5 h-3.5" /> Recurring
                            </Button>
                        </div>
                        <div className="h-10 w-px bg-slate-100 mx-2" />
                        <Button variant="outline" className="h-12 rounded-2xl border-slate-200 group gap-2">
                            <Settings2 className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                            Global Rules
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Control Sidebar */}
                <aside className="w-96 bg-white border-r border-slate-100 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                    <Card className="border-none shadow-none p-0 bg-transparent">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-600" />
                                {configMode === 'single' ? 'New Single Assignment' : 'Pattern Generator'}
                            </h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Doctor</Label>
                                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-slate-900 hover:bg-slate-100 transition-colors">
                                        <SelectValue placeholder="Select Doctor" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        {doctors.map(d => (
                                            <SelectItem key={d.id} value={d.id} className="h-12 rounded-xl focus:bg-blue-600 focus:text-white cursor-pointer transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-6 h-6 rounded-lg">
                                                        <AvatarImage src={d.photo} className="object-cover" />
                                                        <AvatarFallback>{d.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    {d.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {configMode === 'single' ? (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Appointment Date</Label>
                                    <Input
                                        type="date"
                                        value={singleDate}
                                        onChange={(e) => setSingleDate(e.target.value)}
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-5"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Date</Label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-5"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Through Date</Label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-5"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Active Weekday(s)</Label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {DAYS_OF_WEEK.map(day => (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedDays(prev =>
                                                            prev.includes(day.value) ? prev.filter(d => d !== day.value) : [...prev, day.value]
                                                        )
                                                    }}
                                                    className={cn(
                                                        "h-10 rounded-xl text-[9px] font-black uppercase transition-all border",
                                                        selectedDays.includes(day.value)
                                                            ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                                                    )}
                                                >
                                                    {day.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 border-t border-slate-100 space-y-6">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Shift Selection</Label>
                                <div className="flex flex-col gap-2">
                                    {SESSION_TEMPLATES.map(t => (
                                        <button
                                            key={t.label}
                                            type="button"
                                            onClick={() => applyTemplate(t)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                                                t.color
                                            )}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Template</span>
                                                <span className="text-sm font-black">{t.label}</span>
                                            </div>
                                            <Clock className="w-4 h-4 opacity-40 group-hover:scale-110 transition-transform" />
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-[9px] font-black text-slate-300 uppercase ml-1">Start</Label>
                                        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-200 mt-6" />
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-[9px] font-black text-slate-300 uppercase ml-1">End</Label>
                                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 group"
                                >
                                    <CalendarRange className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    Deploy Duty Blocks
                                </Button>
                            </div>
                        </div>
                    </Card>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
                    {/* Date Navigation Ribbon */}
                    <div className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between gap-6 shrink-0">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                            <Button
                                variant={!dateFilter ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setDateFilter(null)}
                                className={cn("h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest", !dateFilter ? "bg-slate-900 text-white" : "text-slate-400")}
                            >
                                All Dates
                            </Button>
                            <Button
                                variant={dateFilter === new Date().toISOString().split('T')[0] ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
                                className={cn("h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest", dateFilter === new Date().toISOString().split('T')[0] ? "bg-slate-900 text-white" : "text-slate-400")}
                            >
                                Today
                            </Button>
                            {Object.keys(groupedBlocks).slice(0, 5).map(date => (
                                <Button
                                    key={date}
                                    variant={dateFilter === date ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setDateFilter(date)}
                                    className={cn("h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest", dateFilter === date ? "bg-slate-900 text-white" : "text-slate-400")}
                                >
                                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Button>
                            ))}

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 gap-2">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        Select Date
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateFilter ? new Date(dateFilter) : undefined}
                                        onSelect={(d) => setDateFilter(d ? d.toISOString().split('T')[0] : null)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                            <Search className="w-4 h-4 text-slate-300" />
                            <input
                                type="text"
                                placeholder="Search doctors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-slate-900 focus:ring-0 placeholder:text-slate-300 min-w-[200px]"
                            />
                        </div>
                    </div>

                    {/* Timeline List */}
                    <div className="flex-1 overflow-y-auto p-8 scrollbar-hide pb-20">
                        {sortedDates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-sm flex items-center justify-center mb-8 border border-slate-100">
                                    <History className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">No Active Duty Blocks</h3>
                                <p className="text-slate-400 max-w-sm text-sm">Refine your dates or use the Pattern Generator on the left to initialize clinical hours.</p>
                                {dateFilter && (
                                    <Button variant="link" onClick={() => setDateFilter(null)} className="mt-4 text-blue-600 font-bold uppercase text-[10px]">Jump to Pipeline Overview</Button>
                                )}
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto space-y-12">
                                {sortedDates.map(date => (
                                    <div key={date} className="group relative">
                                        <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50/80 backdrop-blur-sm py-2 z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center border border-slate-200">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase transition-colors">{new Date(date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                    <span className="text-lg font-black text-slate-900 leading-none">{new Date(date).getDate()}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">
                                                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{groupedBlocks[date].length} Doctor(s)</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active pipeline</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => clearDate(date)}
                                                    className="h-9 px-4 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-[9px] font-black uppercase tracking-widest gap-2"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Wipe Day
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {groupedBlocks[date].map(block => {
                                                const dr = doctors.find(d => d.id === block.doctorId)
                                                return (
                                                    <div
                                                        key={block.id}
                                                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative group/card"
                                                    >
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] -mr-8 -mt-8 -z-0 transition-transform group-hover/card:scale-110" />

                                                        <div className="relative z-10 flex flex-col h-full">
                                                            <div className="flex items-start justify-between mb-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="relative">
                                                                        <Avatar className="w-14 h-14 rounded-2xl shadow-lg ring-4 ring-slate-50 group-hover/card:ring-blue-100 transition-all">
                                                                            <AvatarImage src={dr?.photo} className="object-cover" />
                                                                            <AvatarFallback className="bg-slate-900 text-white font-black">{dr?.name.charAt(0)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-base font-black text-slate-900 group-hover/card:text-blue-600 transition-colors">{dr?.name || 'Specialist'}</p>
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dr?.specialization}</p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(block.id)}
                                                                    className="h-10 w-10 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-2xl"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>

                                                            <div className="mt-auto space-y-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-1 h-12 bg-slate-50 rounded-2xl flex items-center gap-3 px-4 border border-slate-100 shadow-inner">
                                                                        <Clock className="w-4 h-4 text-blue-600" />
                                                                        <span className="text-xs font-black text-slate-900">{block.startTime} — {block.endTime}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter px-1">
                                                                    <span className="text-emerald-600 flex items-center gap-1.5">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Bookings Enabled
                                                                    </span>
                                                                    <span className="text-slate-400">Ref: {block.id.slice(0, 6)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

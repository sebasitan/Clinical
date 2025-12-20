"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticateAdmin, setCurrentAdmin, initializeDemoData } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { Shield, Lock, User, ArrowRight, Sparkles } from "lucide-react"
import Image from "next/image"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    initializeDemoData()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const admin = authenticateAdmin(username, password)

      if (admin) {
        setCurrentAdmin(admin)
        toast({
          title: "Login successful",
          description: "Welcome back!",
        })
        router.push("/admin/dashboard")
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 -z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 -z-0" />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/10 overflow-hidden border border-white min-h-[600px]">

          {/* Left Panel - Branding */}
          <div className="hidden lg:flex bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
            {/* Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-sans font-bold text-xl tracking-tight text-white uppercase italic">Pergigian Setapak (Sri Rampai) Admin</span>
              </div>

              <h1 className="text-5xl font-bold text-white leading-tight mb-6 font-sans">
                Manage your <br />
                <span className="text-blue-400">Clinic Excellence</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
                Log in to access the control panel, manage appointments, and oversee your medical staff.
              </p>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Secure Access</p>
                  <p className="text-xs text-slate-400">Encrypted admin session</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
            <div className="max-w-md w-full mx-auto">
              <div className="lg:hidden flex flex-col items-center gap-2 mb-8 justify-center">
                <div className="w-16 h-16 relative">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-xl text-slate-900 tracking-tight">Klinik Pergigian Setapak (Sri Rampai)</span>
              </div>

              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900 mb-2 font-sans tracking-tight">Welcome Back</h2>
                <p className="text-slate-500">Please enter your credentials to continue.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Username</Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</Label>
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-200 transition-all active:scale-[0.98] group"
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating..." : (
                    <span className="flex items-center justify-center gap-2">
                      Login to Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, Zap, Mic, MicOff } from 'lucide-react'

interface AiQuickNotesProps {
  onSuggest: (data: any) => void;
  onAnalyzing?: (isAnalyzing: boolean) => void;
  placeholder?: string;
  variant?: 'blue' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'orange' | 'violet' | 'teal';
}

export function AiQuickNotes({ 
  onSuggest, 
  onAnalyzing, 
  placeholder = "Tulis atau rekam catatan singkat, biarkan AI mengisi formulir untuk Anda...",
  variant = 'indigo'
}: AiQuickNotesProps) {
  const [quickNotes, setQuickNotes] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Sync state to parent if needed
  useEffect(() => {
    onAnalyzing?.(isAnalyzing)
  }, [isAnalyzing, onAnalyzing])

  const handleAiSummary = async () => {
    if (!quickNotes.trim()) return
    setIsAnalyzing(true)
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3001'
      const res = await fetch(`${serviceUrl}/ai/soap-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: quickNotes })
      })

      if (!res.ok) {
         const errData = await res.text()
         throw new Error(errData || 'Gagal sinkronisasi AI')
      }

      const data = await res.json()
      onSuggest(data)
      setQuickNotes('') // Clear after success
    } catch (err: any) {
      alert(`Gagal memproses AI: ${err.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung fitur suara :(')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'id-ID'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    
    recognition.onerror = (event: any) => {
      setIsListening(false)
      if (event.error === 'not-allowed') {
        alert('Akses mikrofon ditolak. Mohon izinkan mikrofon di pengaturan browser Anda.')
      } else if (event.error === 'network') {
        alert('Gagal merekam: Masalah koneksi jaringan.')
      }
    }

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript
        }
      }
      if (transcript) {
        setQuickNotes((prev) => {
          const trimmedPrev = prev.trim()
          return trimmedPrev ? `${trimmedPrev} ${transcript}` : transcript
        })
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') return null

  const colorClasses = {
    indigo: "from-indigo-600 via-indigo-700 to-blue-800 shadow-indigo-200",
    blue: "from-blue-600 via-blue-700 to-indigo-800 shadow-blue-200",
    rose: "from-rose-600 via-rose-700 to-pink-800 shadow-rose-200",
    emerald: "from-emerald-600 via-emerald-700 to-teal-800 shadow-emerald-200",
    orange: 'from-orange-500 to-red-600 shadow-orange-200/50',
    amber: 'from-amber-500 to-orange-600 shadow-amber-200/50',
    violet: 'from-violet-500 to-purple-600 shadow-violet-200/50',
    teal: 'from-teal-500 to-emerald-600 shadow-teal-200/50',
  }[variant]

  const buttonColors = {
    indigo: "text-indigo-700 hover:text-indigo-900 border-indigo-700",
    blue: "text-blue-700 hover:text-blue-900 border-blue-700",
    rose: "text-rose-700 hover:text-rose-900 border-rose-700",
    emerald: "text-emerald-700 hover:text-emerald-900 border-emerald-700"
  }[variant]

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${colorClasses} rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight italic">AI Quick Notes</h2>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest italic">Fast SOAP Automation</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/10">Connected</span>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-tighter italic">Powered by Gemini AI</span>
          </div>
        </div>

        <div className="relative">
          <textarea 
            className="w-full h-28 bg-white/5 border-2 border-white/10 rounded-[1.5rem] p-5 text-sm font-medium text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-all resize-none shadow-inner"
            placeholder={placeholder}
            value={quickNotes}
            onChange={(e) => setQuickNotes(e.target.value)}
          />
          <button
            onClick={toggleListening}
            className={`absolute bottom-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              isListening 
              ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/20' 
              : 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20'
            }`}
            title={isListening ? 'Mendengarkan...' : 'Klik untuk bicara'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex justify-end">
          <button 
            disabled={isAnalyzing || !quickNotes.trim()}
            onClick={handleAiSummary}
            className={`bg-white ${buttonColors} px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-300 transition-all shadow-lg active:scale-95 disabled:opacity-30 flex items-center gap-2 group/btn`}
          >
            {isAnalyzing ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Zap className="w-3 h-3 fill-current group-hover:animate-bounce" />
                Proses dengan AI ⚡
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

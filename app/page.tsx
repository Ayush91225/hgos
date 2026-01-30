"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Users, ArrowRight, Video } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [meetingId, setMeetingId] = useState("");

  const startInstantMeeting = () => {
    // Generate a random ID
    const id = Math.random().toString(36).substring(7);
    router.push(`/meeting/${id}`);
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingId) {
      router.push(`/meeting/${meetingId}`);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050505] text-white p-4 overflow-hidden relative selection:bg-white/20">

      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-25%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-25%] right-[-10%] w-[60%] h-[60%] bg-orange-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-4xl z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* Left Column: Hero Text */}
        <div className="space-y-8 animate-slide-up">
          <div className="space-y-4">
            <img
              src="https://homeguruworld.com/wp-content/uploads/2022/04/Homeguru-Logo-1.png"
              alt="HomeGuru Logo"
              className="h-12 w-auto object-contain mb-2"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Enterprise Grade Video Conferencing
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              Connect with <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">Claity & Speed</span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-md leading-relaxed">
              Experience high-fidelity video meetings designed for modern teams.
              Built with next-gen infrastructure for seamless collaboration.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={startInstantMeeting}
              className="h-12 px-6 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Meeting
            </button>
            <button
              onClick={() => document.getElementById('meeting-input')?.focus()}
              className="h-12 px-6 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 border border-white/5 transition-all active:scale-95 flex items-center gap-2"
            >
              Enter Code
            </button>
          </div>
        </div>

        {/* Right Column: Cards */}
        <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-panel p-6 rounded-2xl relative z-10">
            <h3 className="text-lg font-semibold mb-4">Join a Meeting</h3>
            <form onSubmit={joinMeeting} className="space-y-4">
              <div className="relative group">
                <input
                  id="meeting-input"
                  type="text"
                  placeholder="Enter meeting ID"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  className="w-full h-12 bg-neutral-900/50 border border-white/10 rounded-xl px-4 pl-11 focus:outline-none focus:border-white/20 transition-all text-white placeholder-neutral-500"
                />
                <Users className="w-5 h-5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
              </div>
              <button
                type="submit"
                disabled={!meetingId}
                className="w-full h-12 rounded-xl bg-blue-600/20 text-blue-400 font-medium border border-blue-500/20 hover:bg-blue-600/30 hover:text-blue-300 hover:border-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Join Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Decorative elements behind card */}
          <div className="absolute -top-6 -right-6 w-full h-full border border-dashed border-white/5 rounded-2xl -z-10" />
          <div className="absolute -bottom-6 -left-6 w-full h-full border border-dashed border-white/5 rounded-2xl -z-10" />
        </div>

      </div>

      <div className="fixed bottom-6 text-neutral-600 text-xs font-mono tracking-wider uppercase">
        HomeGuru | Os.
      </div>
    </div>
  );
}
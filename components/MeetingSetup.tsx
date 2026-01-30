"use client";

import { useCall, useCallStateHooks, VideoPreview, DeviceSettings } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function MeetingSetup({
    setIsSetupComplete,
}: {
    setIsSetupComplete: (value: boolean) => void;
}) {
    const call = useCall();
    const { useMicrophoneState, useCameraState } = useCallStateHooks();
    const { microphone, isMute } = useMicrophoneState();
    const { camera, isMute: isCameraOff } = useCameraState();
    const [isJoining, setIsJoining] = useState(false);

    if (!call) {
        throw new Error("useStreamCall must be used within StreamCall component.");
    }

    const handleJoin = async () => {
        if (isJoining) return;
        setIsJoining(true);

        try {
            // Join with create: true and settings that enable screen sharing
            await call.join({
                create: true,
                data: {
                    settings_override: {
                        screensharing: {
                            enabled: true,
                            access_request_enabled: true,
                        },
                        broadcasting: {
                            enabled: false,
                        },
                        recording: {
                            mode: 'disabled',
                        },
                    },
                },
            });

            setIsSetupComplete(true);
        } catch (err) {
            console.error("Failed to join call:", err);
            setIsJoining(false);
        }
    };

    const toggleMic = async () => {
        if (isMute) {
            await microphone.enable();
        } else {
            await microphone.disable();
        }
    };

    const toggleCamera = async () => {
        if (isCameraOff) {
            await camera.enable();
        } else {
            await camera.disable();
        }
    };

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#050505] text-white overflow-hidden relative selection:bg-white/20">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="z-10 flex flex-col items-center gap-8 w-full max-w-2xl px-4 animate-fade-in">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight">Ready to join?</h1>
                    <p className="text-neutral-400">Check your audio and video settings before joining.</p>
                </div>

                <div className="relative w-full aspect-video max-w-[640px] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl group">
                    {/* Stream SDK Video Preview - Mirrored */}
                    <div className="w-full h-full scale-x-[-1]">
                        <VideoPreview className="w-full h-full object-cover" />
                    </div>

                    {/* Overlay Controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                        <button
                            onClick={toggleMic}
                            className={`p-3 rounded-full transition-all ${isMute ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        >
                            {isMute ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={toggleCamera}
                            className={`p-3 rounded-full transition-all ${isCameraOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        >
                            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <DeviceSettings />
                    </div>

                    {/* Status Indicators */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        <div className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider backdrop-blur-md border ${isMute ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            Mic {isMute ? 'Off' : 'On'}
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider backdrop-blur-md border ${isCameraOff ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            Cam {isCameraOff ? 'Off' : 'On'}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                    <button
                        className={`w-full max-w-sm rounded-xl bg-white text-black h-12 font-semibold hover:bg-neutral-200 transition-all active:scale-95 shadow-lg shadow-white/5 ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleJoin}
                        disabled={isJoining}
                    >
                        {isJoining ? 'Joining...' : 'Join Meeting'}
                    </button>
                    <p className="text-xs text-neutral-500 text-center">
                        {isMute && isCameraOff ? 'Microphone and Camera are off' :
                            isMute ? 'Microphone is off' :
                                isCameraOff ? 'Camera is off' :
                                    'Microphone and Camera are on'}
                    </p>
                </div>
            </div>
        </div>
    );
}

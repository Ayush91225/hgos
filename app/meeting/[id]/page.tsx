"use client";

import { useStreamVideoClient, StreamCall, Call } from "@stream-io/video-react-sdk";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MeetingRoom from "@/components/MeetingRoom";
import MeetingSetup from "@/components/MeetingSetup";
import { createCallWithSettings } from "@/actions/stream";
import { useUser } from "@/providers/UserProvider";

export default function MeetingPage() {
    const { id } = useParams() as { id: string };
    const client = useStreamVideoClient();
    const { user } = useUser();
    const [call, setCall] = useState<Call | null>(null);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        if (!client || !id || !user) return;

        const initCall = async () => {
            try {
                // First, create the call on the server with proper settings
                await createCallWithSettings(id as string, user.id);

                // Then create the call instance on the client
                const myCall = client.call('default', id as string);
                setCall(myCall);
            } catch (error) {
                console.error("Failed to initialize call:", error);
                // Fallback: still try to create client-side call
                const myCall = client.call('default', id as string);
                setCall(myCall);
            } finally {
                setIsInitializing(false);
            }
        };

        initCall();

        return () => {
            // cleanup if needed
        }
    }, [client, id, user]);

    if (isInitializing || !call) {
        return (
            <div className="h-screen w-screen flex items-center justify-center text-white bg-[#050505]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-sm text-neutral-400 animate-pulse">Initializing meeting...</p>
                </div>
            </div>
        );
    }

    if (!isSetupComplete) {
        return (
            <StreamCall call={call}>
                <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
            </StreamCall>
        )
    }

    return (
        <StreamCall call={call}>
            <MeetingRoom />
        </StreamCall>
    );
}

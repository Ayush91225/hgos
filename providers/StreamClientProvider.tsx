"use client";

import {
    StreamVideo,
    StreamVideoClient,
} from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import { tokenProvider } from "@/actions/stream";
import { useUser } from "@/providers/UserProvider";
import { Loader2 } from "lucide-react";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

export default function StreamClientProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [videoClient, setVideoClient] = useState<StreamVideoClient>();
    const { user, isLoading: isUserLoading } = useUser();

    useEffect(() => {
        if (!user || !apiKey) return;

        const init = async () => {
            try {
                const client = new StreamVideoClient({
                    apiKey,
                    user: {
                        id: user.id,
                        name: user.name,
                        image: user.image,
                    },
                    tokenProvider: async () => {
                        return await tokenProvider(user.id);
                    },
                });

                // Explicitly connect the user to catch WS errors early
                await client.connectUser({
                    id: user.id,
                    name: user.name,
                    image: user.image
                }, async () => await tokenProvider(user.id));

                setVideoClient(client);
            } catch (error) {
                console.error("Stream Client Connection Error:", error);
            }
        };

        init();
    }, [user]);

    if (!videoClient || isUserLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#050505] text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                    <p className="text-sm font-medium text-neutral-500 animate-pulse">Initializing Video Engine...</p>
                </div>
            </div>
        );
    }

    if (!videoClient) return null; // Or a loading spinner

    return (
        <StreamVideo client={videoClient}>
            {children}
        </StreamVideo>
    );
}

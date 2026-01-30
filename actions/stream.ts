"use server";

import { StreamClient } from "@stream-io/node-sdk";
import { unstable_cache } from "next/cache";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY;

export const tokenProvider = async (userId: string) => {
    if (!apiKey) {
        console.error("Stream API Key mismatch: NEXT_PUBLIC_STREAM_API_KEY is missing");
        throw new Error("No API key");
    }
    if (!apiSecret) {
        console.error("Stream Secret mismatch: STREAM_SECRET_KEY is missing");
        throw new Error("No API secret");
    }

    const client = new StreamClient(apiKey, apiSecret);

    // Token valid for 24 hours (for long meetings)
    const exp = Math.round(new Date().getTime() / 1000) + 60 * 60 * 24;
    const issued = Math.floor(Date.now() / 1000) - 60;

    const token = client.createToken(userId, exp, issued);

    return token;
};

// Get meeting start time from call metadata
export const getMeetingStartTime = async (callId: string) => {
    if (!apiKey || !apiSecret) {
        throw new Error("Missing Stream credentials");
    }

    const client = new StreamClient(apiKey, apiSecret);

    try {
        const call = client.video.call('default', callId);
        const result = await call.get();
        return result.call.custom?.meeting_start_time || Date.now();
    } catch (error) {
        console.error("Failed to get meeting start time:", error);
        return Date.now();
    }
};

// Create or get a call with optimal video settings
export const createCallWithSettings = async (callId: string, userId: string) => {
    if (!apiKey || !apiSecret) {
        throw new Error("Missing Stream credentials");
    }

    const client = new StreamClient(apiKey, apiSecret);

    try {
        const call = client.video.call('default', callId);

        // Create call with low-latency optimized settings
        const result = await call.getOrCreate({
            data: {
                created_by_id: userId,
                custom: {
                    meeting_start_time: Date.now(),
                },
                settings_override: {
                    video: {
                        enabled: true,
                        camera_default_on: true,
                        target_resolution: {
                            width: 1280,
                            height: 720
                        }
                    },
                    audio: {
                        enabled: true,
                        mic_default_on: true,
                        default_device: 'speaker'
                    },
                    screensharing: {
                        enabled: true,
                        target_resolution: {
                            width: 1920,
                            height: 1080
                        }
                    },
                    recording: {
                        mode: 'available',
                        quality: '720p'
                    },
                    transcription: {
                        mode: 'available'
                    }
                },
            },
        });

        return { success: true, meetingStartTime: result.call.custom?.meeting_start_time || Date.now() };
    } catch (error) {
        console.error("Failed to create call:", error);
        return { success: false, error };
    }
};

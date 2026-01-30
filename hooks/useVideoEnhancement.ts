import { useEffect, useRef } from 'react';

export const useVideoEnhancement = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const enhanceVideoStream = (video: HTMLVideoElement) => {
            if (!video.srcObject) return;

            // Create canvas for processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            const processFrame = () => {
                if (video.readyState >= 2) {
                    // Draw video frame to canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Get image data for processing
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // Apply sharpening filter
                    for (let i = 0; i < data.length; i += 4) {
                        // Enhance contrast slightly
                        data[i] = Math.min(255, data[i] * 1.1);     // Red
                        data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Green  
                        data[i + 2] = Math.min(255, data[i + 2] * 1.1); // Blue
                    }

                    // Put processed data back
                    ctx.putImageData(imageData, 0, 0);
                }
                
                requestAnimationFrame(processFrame);
            };

            video.addEventListener('loadedmetadata', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                processFrame();
            });
        };

        const observer = new MutationObserver(() => {
            const videos = document.querySelectorAll('video');
            videos.forEach(enhanceVideoStream);
        });

        observer.observe(document.body, { childList: true, subtree: true });
        
        return () => observer.disconnect();
    }, []);

    return { canvasRef };
};
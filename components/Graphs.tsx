"use client";

import { X, Calculator, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCallStateHooks } from "@stream-io/video-react-sdk";

interface GraphsProps {
    roomId: string;
    onClose: () => void;
    isOwner?: boolean;
    ownerName?: string;
}

declare global {
    interface Window {
        Desmos: any;
    }
}

export default function Graphs({
    roomId,
    onClose,
    isOwner = false,
    ownerName = 'Someone'
}: GraphsProps) {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const containerRef = useRef<HTMLDivElement>(null);
    const calculatorRef = useRef<any>(null);

    // Close on Escape key (only if owner)
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOwner) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose, isOwner]);

    // Initialize Desmos (only for owner)
    useEffect(() => {
        if (!isOwner) return;

        const scriptId = 'desmos-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const initCalculator = () => {
            if (window.Desmos && containerRef.current && !calculatorRef.current) {
                calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
                    keypad: true,
                    expressions: true,
                    settingsMenu: true,
                    zoomButtons: true,
                });
            }
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://www.desmos.com/api/v1.11/calculator.js?apiKey=87f9a8ba41fc4afe95fbe9383adb3893";
            script.async = true;
            script.onload = initCalculator;
            document.body.appendChild(script);
        } else if (window.Desmos) {
            initCalculator();
        } else {
            script.addEventListener('load', initCalculator);
        }

        return () => {
            if (calculatorRef.current) {
                calculatorRef.current.destroy();
                calculatorRef.current = null;
            }
        };
    }, [isOwner]);

    // For viewers, show notification
    if (!isOwner) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
                
                <div className="relative bg-white rounded-xl p-6 m-4 max-w-md shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Calculator className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Graphing Calculator</h3>
                            <p className="text-sm text-gray-500">{ownerName} is presenting</p>
                        </div>
                    </div>
                    
                    <div className="text-center py-4">
                        <p className="text-gray-600 mb-4">
                            {ownerName} is using the graphing calculator for their own calculations.
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                            <Users className="w-4 h-4" />
                            {participants.length} participants in meeting
                        </div>
                    </div>
                    
                    <button
                        onClick={onClose}
                        className="w-full mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // For owner, show calculator
    return (
        <div className="fixed inset-0 z-50 flex flex-col animate-fade-in">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative flex-1 flex flex-col bg-white m-2 md:m-4 rounded-xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Calculator className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Graphing Calculator</h2>
                            <p className="text-xs text-gray-500">Personal calculator for your use</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {participants.length}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-600 hover:text-gray-900"
                            title="Close (Esc)"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Calculator Container */}
                <div className="flex-1 bg-white relative">
                    <div ref={containerRef} className="absolute inset-0 w-full h-full" />
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-600 text-center">
                        📊 This calculator is for your personal use only. 
                        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to close.
                    </p>
                </div>
            </div>
        </div>
    );
}
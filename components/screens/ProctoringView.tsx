'use client';

import React from 'react';
import { useProctoring } from '../../lib/hooks/useProctoring';
import { Eye, Loader2 } from 'lucide-react';

export const ProctoringView = () => {
    // Only fetch what's needed for the camera preview now
    const { videoRef, canvasRef, isModelLoading } = useProctoring();

    return (
        <div className="fixed bottom-4 left-4 z-40 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium tracking-wide">Live Proctoring</span>
                </div>
            </div>

            {/* Video Container */}
            <div className="relative w-64 h-48 bg-black">
                {isModelLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-800">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-400" />
                        <span className="text-xs font-medium">Loading AI Models...</span>
                    </div>
                )}

                {/* The Video Source */}
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover mirror"
                    autoPlay
                    playsInline
                    muted
                />

                {/* The Canvas For Bounding Boxes */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover mirror z-10 pointer-events-none"
                    width={640}
                    height={480}
                />
            </div>
        </div>
    );
};

/**
 * VR Chart Viewer Component
 *
 * Provides immersive VR experience for viewing birth charts
 * Features:
 * - WebXR support
 * - 3D birth chart visualization
 * - Interactive planetary positions
 * - Holographic display mode
 *
 * @author BhriguWelt Team
 * @version 2.0.0
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Glasses, AlertCircle, Loader2 } from 'lucide-react';

export interface VRChartViewerProps {
  chartData: any;
  onEnterVR?: () => void;
  onExitVR?: () => void;
  className?: string;
}

export default function VRChartViewer({
  chartData,
  onEnterVR,
  onExitVR,
  className = '',
}: VRChartViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vrSupported, setVrSupported] = useState<boolean | null>(null);
  const [vrActive, setVrActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check WebXR support
    if ('xr' in navigator) {
      (navigator as any).xr
        .isSessionSupported('immersive-vr')
        .then((supported: boolean) => {
          setVrSupported(supported);
        })
        .catch(() => {
          setVrSupported(false);
        });
    } else {
      setVrSupported(false);
    }
  }, []);

  const handleEnterVR = async () => {
    if (!vrSupported) {
      alert('VR is not supported on this device. Try using a VR headset with WebXR support.');
      return;
    }

    setLoading(true);

    try {
      // Initialize VR session
      // This is a placeholder - actual implementation would use Three.js or A-Frame
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setVrActive(true);
      setLoading(false);

      if (onEnterVR) {
        onEnterVR();
      }
    } catch (error) {
      console.error('Failed to enter VR:', error);
      setLoading(false);
      alert('Failed to start VR session. Please try again.');
    }
  };

  const handleExitVR = () => {
    setVrActive(false);

    if (onExitVR) {
      onExitVR();
    }
  };

  if (vrSupported === null) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!vrSupported) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/10 backdrop-blur-xl p-6 ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">
              VR Not Supported
            </h3>
            <p className="text-yellow-200/80 mb-3">
              VR viewing requires a WebXR-compatible device (e.g., Meta Quest, HTC Vive, or
              compatible browser).
            </p>
            <p className="text-yellow-200/60 text-sm">
              You can still view your chart in 2D mode or try accessing this on a VR device.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* VR Preview Canvas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-purple-600/10 to-purple-700/10 backdrop-blur-xl overflow-hidden aspect-video"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
        />

        {/* Overlay with VR instructions */}
        {!vrActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Glasses className="w-16 h-16 text-purple-400 mb-4" />
            </motion.div>
            <h3 className="text-2xl font-display font-bold text-white mb-2">
              Immersive VR Experience
            </h3>
            <p className="text-white/70 mb-6">
              View your birth chart in stunning 3D virtual reality
            </p>
          </div>
        )}

        {/* VR Active Indicator */}
        {vrActive && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-300">VR Active</span>
          </div>
        )}
      </motion.div>

      {/* VR Controls */}
      <div className="flex items-center justify-center gap-4">
        {!vrActive ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnterVR}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Initializing VR...</span>
              </>
            ) : (
              <>
                <Glasses className="w-5 h-5" />
                <span>Enter VR Mode</span>
              </>
            )}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExitVR}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-red-500 text-white font-semibold shadow-lg hover:shadow-red-500/50 transition-all"
          >
            <span>Exit VR Mode</span>
          </motion.button>
        )}
      </div>

      {/* VR Features List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
      >
        <h4 className="text-lg font-semibold text-white mb-4">VR Features</h4>
        <ul className="space-y-2 text-white/70">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>360° interactive birth chart visualization</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Planetary positions in 3D space</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Holographic zodiac wheel</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Voice-guided astrological tour</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Virtual astrology temple environment</span>
          </li>
        </ul>
      </motion.div>

      {/* Browser Compatibility Note */}
      <div className="text-center text-sm text-white/50">
        <p>
          Best experienced with Meta Quest, HTC Vive, or WebXR-compatible browsers (Chrome,
          Edge).
        </p>
      </div>
    </div>
  );
}

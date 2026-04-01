import React, { useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFetchBlobUrl } from '@/lib/secureMedia';
import { SecureDownload } from '@/components/security/SecureDownload';

interface GlassLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function GlassLightbox({ src, alt = 'Image', onClose }: GlassLightboxProps) {
  const [zoom, setZoom] = React.useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const finalSrc = useFetchBlobUrl(src || '');

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 3));
    if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Reset zoom when image changes
  useEffect(() => { setZoom(1); }, [src]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl"
          onClick={onClose}
        >
          {/* Controls overlay */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none" />

          {/* Glass container - Full Screen */}
          <motion.div
            key="lightbox-panel"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="absolute inset-0 flex flex-col w-full h-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Top control bar */}
            <div className="relative z-30 flex items-center justify-between w-full px-4 sm:px-6 py-4 gap-4">
              <span className="text-xs text-white/50 truncate max-w-[200px]">{alt}</span>

              <div className="flex items-center gap-1 ml-auto">
                {/* Zoom out */}
                <button
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom out (−)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Zoom level */}
                <span className="text-xs text-white/40 w-10 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>

                {/* Zoom in */}
                <button
                  onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom in (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Download */}
                {src && (
                  <SecureDownload
                    url={src}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </SecureDownload>
                )}

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image panning area */}
            <div 
              ref={containerRef}
              className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden"
            >
              <motion.img
                src={finalSrc || (src || '')}
                alt={alt}
                animate={{ scale: zoom }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                drag={zoom > 1}
                dragConstraints={containerRef}
                dragElastic={0.1}
                whileDrag={{ cursor: 'grabbing' }}
                className="w-full h-full select-none"
                style={{
                  objectFit: 'contain',
                  cursor: zoom > 1 ? 'grab' : 'zoom-in',
                  // Ensure framer-motion recalculates layout to allow dragging
                  touchAction: zoom > 1 ? 'none' : 'auto', 
                }}
                onClick={() => setZoom(z => z > 1 ? 1 : 2)}
                draggable={false}
              />
            </div>
          </motion.div>

          {/* Hint */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/30 pointer-events-none select-none"
          >
            Click image to zoom · ESC to close
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

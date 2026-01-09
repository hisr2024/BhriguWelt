'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

type FullAnalysisPanelProps = {
  fullAnalysis: string;
};

const FullAnalysisPanel = ({ fullAnalysis }: FullAnalysisPanelProps) => {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  return (
    <div className="mt-8 pt-8 border-t border-gray-700/50">
      <button
        onClick={() => setShowFullAnalysis((prev) => !prev)}
        aria-expanded={showFullAnalysis}
        aria-controls="full-analysis-content"
        className="w-full bg-gradient-to-br from-gray-800/50 to-gray-900/50
                 border border-gray-700/50 rounded-xl p-6
                 hover:border-cyan-500/30 transition-all
                 flex items-center justify-between group relative z-10"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <div className="text-left">
            <h3 className="text-xl font-bold text-white relative z-10">
              View Complete Reading
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {showFullAnalysis ? 'Hide' : 'Show'} the full unstructured analysis
            </p>
          </div>
        </div>
        {showFullAnalysis ? (
          <ChevronUp className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
        ) : (
          <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
        )}
        <span className="sr-only">
          {showFullAnalysis ? 'Hide full analysis' : 'Show full analysis'}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {showFullAnalysis && (
          <motion.div
            key="full-analysis"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            id="full-analysis-content"
            className="mt-4 bg-gradient-to-br from-gray-800/30 to-gray-900/30
                     border border-gray-700/50 rounded-xl p-6 overflow-visible"
          >
            <div className="prose prose-invert prose-cyan max-w-none">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[70vh] overflow-auto pr-2">
                {fullAnalysis}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FullAnalysisPanel;

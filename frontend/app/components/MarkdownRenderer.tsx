'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  viewMode?: 'layman' | 'astrologer';
}

/**
 * MarkdownRenderer Component
 * Renders markdown content with custom styling for the astrology app
 */
export function MarkdownRenderer({
  content,
  className = ''
}: MarkdownRendererProps) {
  if (!content || content.trim() === '') {
    return null;
  }

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-4 mt-6">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl md:text-2xl font-bold text-purple-300 mb-3 mt-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></span>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg md:text-xl font-semibold text-blue-300 mb-2 mt-4">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base md:text-lg font-semibold text-cyan-300 mb-2 mt-3">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-base font-semibold text-slate-300 mb-2 mt-3">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-semibold text-slate-400 mb-2 mt-2">
              {children}
            </h6>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-slate-200 leading-relaxed mb-3 text-base">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-none space-y-2 mb-4 ml-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 ml-4 text-slate-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-200 flex items-start gap-2">
              <span className="text-purple-400 mt-1.5 text-xs">●</span>
              <span className="flex-1">{children}</span>
            </li>
          ),

          // Emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-purple-300">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-blue-200">
              {children}
            </em>
          ),

          // Code
          code: ({ children, className }) => {
            const isInline = !className;

            if (isInline) {
              return (
                <code className="px-2 py-0.5 bg-purple-900/30 text-purple-200 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }

            return (
              <code className="block px-4 py-3 bg-slate-900/50 text-slate-200 rounded-lg text-sm font-mono overflow-x-auto mb-4">
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500/50 pl-4 py-2 my-4 bg-purple-900/10 rounded-r-lg">
              <div className="text-slate-300 italic">
                {children}
              </div>
            </blockquote>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-6 border-t border-slate-700/50" />
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300 transition-colors"
            >
              {children}
            </a>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-700/50 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-purple-900/20">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-700/50">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-purple-900/10 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-purple-300 font-semibold text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-slate-200 text-sm">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Compact version for summary/preview sections
 */
export function CompactMarkdownRenderer({
  content,
  className = ''
}: Omit<MarkdownRendererProps, 'viewMode'>) {
  if (!content || content.trim() === '') {
    return null;
  }

  return (
    <div className={`markdown-content-compact ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => <p className="font-semibold text-slate-100">{children}</p>,
          h2: ({ children }) => <p className="font-semibold text-slate-100">{children}</p>,
          h3: ({ children }) => <p className="font-semibold text-slate-100">{children}</p>,
          h4: ({ children }) => <p className="font-medium text-slate-100">{children}</p>,
          h5: ({ children }) => <p className="font-medium text-slate-100">{children}</p>,
          h6: ({ children }) => <p className="font-medium text-slate-100">{children}</p>,
          p: ({ children }) => <p className="text-slate-200 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-none space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
          li: ({ children }) => (
            <li className="text-slate-200 flex items-start gap-2">
              <span className="text-purple-400 mt-1 text-xs">●</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          strong: ({ children }) => <strong className="font-semibold text-purple-300">{children}</strong>,
          em: ({ children }) => <em className="italic text-blue-200">{children}</em>,
          code: ({ children }) => (
            <code className="px-1 py-0.5 bg-purple-900/30 text-purple-200 rounded text-sm">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

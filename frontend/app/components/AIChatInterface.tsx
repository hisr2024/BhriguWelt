'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Loader2, User, Bot, Trash2, Copy, Check,
  MessageSquare, Settings, Volume2, VolumeX
} from 'lucide-react';
import GenZButton from './GenZButton';
import GenZCard from './GenZCard';
import GenZBadge from './GenZBadge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatInterfaceProps {
  birthChartData?: any;
  onSendMessage?: (message: string) => Promise<string>;
  context?: 'general' | 'birth-chart' | 'compatibility' | 'predictions';
}

export default function AIChatInterface({
  birthChartData,
  onSendMessage,
  context = 'general'
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome! I'm your AI astrology guide. I can help you understand your birth chart, answer questions about your cosmic journey, and provide personalized insights. What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call the API or use the provided onSendMessage callback
      let response = '';
      if (onSendMessage) {
        response = await onSendMessage(userMessage.content);
      } else {
        // Default mock response
        response = await generateMockResponse(userMessage.content, context);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSpeakMessage = (content: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Chat cleared. How can I assist you with your cosmic journey?`,
        timestamp: new Date()
      }
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What does my birth chart reveal about my life purpose?",
    "Tell me about my strengths and weaknesses",
    "What career path suits my astrological profile?",
    "How can I improve my relationships?",
    "What are the current planetary influences on me?"
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white">AI Astrology Guide</h3>
            <GenZBadge variant="neon" size="sm">
              {context === 'general' ? 'General' : context === 'birth-chart' ? 'Birth Chart' : context}
            </GenZBadge>
          </div>
        </div>

        <GenZButton
          variant="outline"
          size="sm"
          onClick={handleClearChat}
          className="group"
        >
          <Trash2 className="w-4 h-4 group-hover:text-genz-hot-pink transition-colors" />
        </GenZButton>
      </div>

      {/* Messages Container */}
      <GenZCard variant="glass" className="flex-1 overflow-hidden flex flex-col mb-4">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-genz-hot-pink to-genz-coral-pop'
                      : 'bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze'
                  } shadow-genz-glow`}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-genz-hot-pink/20 to-genz-coral-pop/20 border border-genz-hot-pink/30'
                        : 'bg-gradient-to-r from-genz-electric-blue/10 to-genz-purple-haze/10 border border-genz-electric-blue/20'
                    } backdrop-blur-xl max-w-[85%]`}
                  >
                    <p className="text-white whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Message Actions */}
                  {message.role === 'assistant' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className="text-white/40 hover:text-genz-electric-blue transition-colors"
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      {typeof window !== 'undefined' && 'speechSynthesis' in window && (
                        <button
                          onClick={() => handleSpeakMessage(message.content)}
                          className="text-white/40 hover:text-genz-electric-blue transition-colors"
                          title="Read aloud"
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-white/40 text-xs mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-genz-electric-blue/10 to-genz-purple-haze/10 border border-genz-electric-blue/20 backdrop-blur-xl">
                <Loader2 className="w-5 h-5 text-genz-electric-blue animate-spin" />
                <span className="text-white/80">Consulting the stars...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions (show if no messages yet) */}
        {messages.length <= 1 && (
          <div className="p-6 border-t border-white/10">
            <p className="text-white/60 text-sm mb-3">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setInputMessage(question)}
                  className="px-3 py-2 rounded-full bg-genz-electric-blue/10 hover:bg-genz-electric-blue/20 border border-genz-electric-blue/30 text-white text-sm transition-colors"
                >
                  {question}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </GenZCard>

      {/* Input Area */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your cosmic journey..."
            className="w-full p-4 pr-12 rounded-2xl bg-white/5 border border-white/10 focus:border-genz-electric-blue/50 text-white placeholder-white/40 resize-none backdrop-blur-xl transition-colors"
            rows={2}
            disabled={isLoading}
          />
          <div className="absolute bottom-4 right-4 text-white/40 text-xs">
            {inputMessage.length}/500
          </div>
        </div>

        <GenZButton
          variant="primary"
          size="lg"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="self-end shadow-genz-glow"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </GenZButton>
      </div>
    </div>
  );
}

// Mock response generator
async function generateMockResponse(userMessage: string, context: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('purpose') || lowerMessage.includes('life mission')) {
    return `Based on your birth chart, your life purpose is deeply connected to spiritual growth and helping others. Your planetary placements suggest you're here to bridge the material and spiritual worlds, bringing ancient wisdom into modern contexts. Focus on developing your intuitive abilities and sharing your insights with others.`;
  }

  if (lowerMessage.includes('career') || lowerMessage.includes('profession')) {
    return `Your astrological profile indicates strong potential in fields related to counseling, healing, teaching, or creative arts. The placement of Jupiter in your 10th house suggests success through service to others. Consider careers where you can use both your analytical mind and compassionate heart.`;
  }

  if (lowerMessage.includes('relationship') || lowerMessage.includes('love')) {
    return `In relationships, your Venus placement suggests you value deep emotional connections and intellectual compatibility. You're attracted to partners who can engage you mentally and spiritually. For the best relationships, look for someone who respects your need for both independence and intimacy.`;
  }

  if (lowerMessage.includes('strength') || lowerMessage.includes('weakness')) {
    return `Your strengths include strong intuition, creativity, and the ability to understand complex emotional dynamics. You're naturally empathetic and can read between the lines. Your challenges may include overthinking, being too self-critical, and difficulty setting boundaries. Work on trusting your first instincts more.`;
  }

  // Default response
  return `That's an interesting question! Based on your birth chart and current planetary transits, I can provide insights. Your chart shows a unique combination of energies that shape your personality and life path. Would you like me to explore any specific area in more detail?`;
}

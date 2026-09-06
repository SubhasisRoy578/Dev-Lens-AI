import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  Loader2,
  FileCode,
  CornerDownLeft,
} from 'lucide-react';
import type { ChatMessage, Project } from '../types';
import { apiFetch } from '../services/api';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSelectFile?: (filePath: string, line?: number) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  project,
  onSelectFile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `I am **DevLens Intelligence**, initialized on repository \`${project.name}\`. Every answer is grounded directly in indexed AST chunks, declared manifests, and source files.\n\nAsk me about architecture, concurrency, security findings, or how specific modules operate.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || isQuerying) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsQuerying(true);

    try {
      const res = await apiFetch(`/api/projects/${project.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'Unable to analyze codebase query.',
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Error communicating with the repository intelligence server.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const sampleQueries = [
    'How does authentication work in this project?',
    'Where is the API / ingress layer implemented?',
    'What causes the concurrency anomaly in runtime/scheduler.go?',
    'Which files define the gRPC contracts and schema?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1c1c18]/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full sm:w-[540px] h-full bg-[#ffffff] border-l border-[#c8c5cb] shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#c8c5cb]/50 bg-[#fdf9f2]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-[#1c1c18] text-[#febf94]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1c1c18] leading-tight">
                Conversation With the Code
              </h3>
              <p className="font-mono text-[10px] text-[#78767b]">
                Grounded RAG on {project.name} ({project.totalFiles} files indexed)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#47464b] hover:text-[#1c1c18] hover:bg-[#ece8e1] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdf9f2]/50">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#78767b]">
                  {isUser ? <span>Developer</span> : <span className="text-[#835331] font-semibold">DevLens AI</span>}
                  <span>&bull;</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-lg max-w-[92%] font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#1c1c18] text-[#ffffff] font-medium'
                      : 'bg-[#ffffff] text-[#1c1c18] border border-[#c8c5cb]/60 bevel-hairline-subtle'
                  }`}
                >
                  {m.content}

                  {/* Grounded Source Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#c8c5cb]/40 space-y-1">
                      <div className="font-mono text-[10px] uppercase text-[#835331] font-semibold">
                        Referenced Repository Sources:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.citations.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (onSelectFile) onSelectFile(c.file, c.startLine);
                              onClose();
                            }}
                            className="font-mono text-[10.5px] bg-[#f7f3ec] hover:bg-[#ece8e1] border border-[#c8c5cb] px-2 py-1 rounded text-[#1c1c18] flex items-center space-x-1 transition-all"
                            title={c.snippet}
                          >
                            <FileCode className="w-3 h-3 text-[#835331]" />
                            <span>
                              {c.file}:{c.startLine}-{c.endLine}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-[#78767b]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isQuerying && (
            <div className="flex items-center space-x-2 text-xs font-mono text-[#835331] bg-[#ffffff] p-3 rounded border border-[#c8c5cb]/40 w-fit">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Retrieving AST chunks &amp; querying Gemini...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        <div className="px-4 py-2 bg-[#f7f3ec] border-t border-[#c8c5cb]/40 overflow-x-auto whitespace-nowrap">
          <div className="flex space-x-1.5">
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSend(sq)}
                disabled={isQuerying}
                className="font-mono text-[10.5px] bg-[#ffffff] hover:bg-[#ece8e1] border border-[#c8c5cb] px-2.5 py-1 rounded text-[#47464b] hover:text-[#1c1c18] transition-all shrink-0"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#c8c5cb] bg-[#ffffff] flex items-center space-x-2">
          <textarea
            rows={1}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about the codebase..."
            className="flex-1 bg-[#f7f3ec] border border-[#c8c5cb] rounded px-3 py-2 text-xs font-mono resize-none focus:border-[#835331] focus:outline-hidden"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isQuerying}
            className="p-2.5 bg-[#1c1c18] text-[#ffffff] rounded hover:bg-[#2b2b30] disabled:opacity-40 transition-all cursor-pointer"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

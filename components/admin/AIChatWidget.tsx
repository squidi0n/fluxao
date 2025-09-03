'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Brain,
  Send,
  Minimize2,
  Maximize2,
  X,
  Settings,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Zap
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  timestamp: Date;
}

interface AIChatWidgetProps {
  isAdmin?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

export default function AIChatWidget({ isAdmin = false, position = 'bottom-right' }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('claude');
  const [providers, setProviders] = useState<any>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  useEffect(() => {
    if (isOpen) {
      loadProviders();
      // Add welcome message
      if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: `Hallo! Ich bin Ihr FluxAO KI-Assistent. Ich kann Ihnen helfen bei:

• Systemüberwachung und -analyse
• Inhaltsgenerierung und -optimierung  
• Leistungseinblicke und Empfehlungen
• Sicherheitsprüfungen und Warnungen
• Nutzerengagement-Analyse
• SEO-Optimierungstipps

Womit kann ich Ihnen heute helfen?`,
          provider: 'system',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/ai/central?action=providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Anbieter:', error);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/central?action=single-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          task: 'analysis',
          prompt: inputMessage,
          context: 'FluxAO AI Assistant Chat'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: `${Date.now()}-response`,
          role: 'assistant',
          content: data.result || 'No response received',
          provider: data.provider || selectedProvider,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Fehler beim Abrufen der KI-Antwort');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: `Entschuldigung, ich habe einen Fehler festgestellt: ${error.message}. Bitte versuchen Sie es erneut.`,
        provider: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getProviderIcon = (provider: string) => {
    const icons = {
      claude: '🤖',
      openai: '🧠',
      gemini: '💎',
      llama: '🦙',
      cohere: '🌊',
      system: '⚡'
    };
    return icons[provider as keyof typeof icons] || '🤖';
  };

  const quickActions = [
    {
      label: 'System Status',
      prompt: 'Prüfe aktuellen Systemstatus und Leistungsmetriken'
    },
    {
      label: 'Inhalt erstellen',
      prompt: 'Hilf mir, einen ansprechenden Blogbeitrag über KI-Trends zu erstellen'
    },
    {
      label: 'SEO-Analyse',
      prompt: 'Analysiere aktuelle Inhalte auf SEO-Optimierungsmöglichkeiten'
    },
    {
      label: 'Nutzer-Insights',
      prompt: 'Gib Einblicke in Nutzerengagement und Verhaltensmuster'
    }
  ];

  if (!isOpen) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <Brain className="h-6 w-6" />
        </Button>
        {/* Notification badge */}
        <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">!</span>
        </div>
      </div>
    );
  }

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <Card className="w-full h-full max-w-none max-h-none rounded-none flex flex-col">
          {/* Full Screen Header */}
          <div className="p-4 border-b bg-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6" />
              <div>
                <h2 className="font-semibold">FluxAO KI-Assistent</h2>
                <p className="text-sm text-blue-100">Multi-Provider KI-System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-40 bg-blue-500 border-blue-400 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(providers).map(([key, provider]: [string, any]) => (
                    <SelectItem key={key} value={key} disabled={!provider.available}>
                      <div className="flex items-center gap-2">
                        <span>{getProviderIcon(key)}</span>
                        <span className="capitalize">{key}</span>
                        {!provider.available && (
                          <Badge variant="secondary" className="text-xs">Offline</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-blue-500"
                onClick={() => setIsFullScreen(false)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Full Screen Chat */}
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="max-w-4xl mx-auto space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border shadow-sm'
                        }`}
                      >
                        {message.role === 'assistant' && message.provider && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            <span>{getProviderIcon(message.provider)}</span>
                            <span className="font-medium capitalize">{message.provider}</span>
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border shadow-sm rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                          <span className="text-gray-600">KI denkt nach...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="p-6 bg-white border-t">
                <div className="max-w-4xl mx-auto flex gap-3">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Fragen Sie nach Systemstatus, generieren Sie Inhalte, analysieren Sie Daten..."
                    className="flex-1 resize-none min-h-[60px]"
                    rows={2}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="lg"
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar with Quick Actions */}
            <div className="w-80 border-l p-4 bg-white">
              <h3 className="font-medium mb-4">Schnellaktionen</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start"
                    onClick={() => setInputMessage(action.prompt)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Systemzustand</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>KI Status:</span>
                    <Badge variant="default">Aktiv</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Anbieter:</span>
                    <span>{Object.keys(providers).length} Verfügbar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Antwortzeit:</span>
                    <span className="text-green-600">~2.3s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <Card className="w-96 h-[500px] flex flex-col shadow-2xl">
        {/* Widget Header */}
        <div className="p-3 border-b bg-blue-600 text-white flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <span className="font-medium">KI-Assistent</span>
            <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
              {Object.values(providers).filter((p: any) => p.available).length} online
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-blue-500 p-1 h-7 w-7"
              onClick={() => setIsFullScreen(true)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-blue-500 p-1 h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="p-2 border-b bg-gray-50">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(providers).map(([key, provider]: [string, any]) => (
                <SelectItem key={key} value={key} disabled={!provider.available}>
                  <div className="flex items-center gap-2">
                    <span>{getProviderIcon(key)}</span>
                    <span className="capitalize">{key}</span>
                    {!provider.available && (
                      <Badge variant="secondary" className="text-xs">Offline</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' && message.provider && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <span>{getProviderIcon(message.provider)}</span>
                      <span className="font-medium capitalize">{message.provider}</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                    <span className="text-xs text-gray-600">Denke nach...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-2 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-1">
            {quickActions.slice(0, 4).map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-8 text-xs justify-start p-2"
                onClick={() => setInputMessage(action.prompt)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t bg-white rounded-b-lg">
          <div className="flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Fragen Sie alles..."
              className="flex-1 resize-none text-sm min-h-[32px] py-1"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
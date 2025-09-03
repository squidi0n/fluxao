'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Brain,
  TrendingUp,
  Users,
  FileText,
  Mail,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Play,
  Pause,
  Send,
  Minimize2,
  Maximize2,
  Settings,
  BarChart3,
  Activity,
  MessageSquare,
  Cpu,
  Database,
  Globe,
  Sparkles
} from 'lucide-react';

interface AIProvider {
  name: string;
  model: string;
  available: boolean;
  latency: number;
  usage: { today: number; limit: number };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  timestamp: Date;
  metadata?: any;
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  score: number;
  components: Record<string, { status: string; score: number }>;
}

export default function AICentralPage() {
  const [providers, setProviders] = useState<Record<string, AIProvider>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('claude');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [multiProviderMode, setMultiProviderMode] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['claude', 'openai']);
  const [activeTab, setActiveTab] = useState('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const loadInitialData = async () => {
    try {
      const [providersRes, healthRes] = await Promise.all([
        fetch('/api/ai/central?action=providers'),
        fetch('/api/ai/central?action=health')
      ]);

      if (providersRes.ok) {
        const providersData = await providersRes.json();
        setProviders(providersData);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/ai/central?action=status');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
        setSystemHealth(data.system);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
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

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const endpoint = multiProviderMode ? 'multi-provider' : 'single-task';
      const requestBody = multiProviderMode ? {
        providers: selectedProviders,
        prompt: inputMessage,
        compareResults: true
      } : {
        provider: selectedProvider,
        task: 'analysis',
        prompt: inputMessage
      };

      const response = await fetch(`/api/ai/central?action=${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (multiProviderMode && data.results) {
          // Display results from multiple providers
          data.results.forEach((result: any, index: number) => {
            const assistantMessage: ChatMessage = {
              id: `${Date.now()}-${index}`,
              role: 'assistant',
              content: result.content || 'No response',
              provider: result.provider,
              timestamp: new Date(),
              metadata: result.metadata
            };
            setChatMessages(prev => [...prev, assistantMessage]);
          });

          // Add consensus if available
          if (data.consensus) {
            const consensusMessage: ChatMessage = {
              id: `${Date.now()}-consensus`,
              role: 'assistant',
              content: `**Consensus Analysis:**\n\n${data.consensus}`,
              provider: 'consensus',
              timestamp: new Date(),
              metadata: data.comparison
            };
            setChatMessages(prev => [...prev, consensusMessage]);
          }
        } else {
          // Single provider response
          const assistantMessage: ChatMessage = {
            id: `${Date.now()}-response`,
            role: 'assistant',
            content: data.result || 'No response received',
            provider: data.provider || selectedProvider,
            timestamp: new Date(),
            metadata: data.metadata
          };
          setChatMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: `Error: ${error.message}`,
        provider: 'system',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
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
      consensus: '⚖️',
      system: '⚠️'
    };
    return icons[provider as keyof typeof icons] || '🤖';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Central Command</h1>
              <p className="text-sm text-gray-600">
                Multi-Provider AI System with 24/7 Monitoring
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {systemHealth && (
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  systemHealth.overall === 'healthy' ? 'bg-green-500' :
                  systemHealth.overall === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className={`text-sm font-medium ${getHealthColor(systemHealth.overall)}`}>
                  System Health: {systemHealth.score}/100
                </span>
              </div>
            )}
            <Button onClick={loadSystemStatus} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="writer" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Writer
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* AI Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chat Interface */}
              <Card className="lg:col-span-3 p-6 h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">AI Assistant Chat</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="multi-provider">Multi-Provider Mode:</Label>
                    <Switch
                      id="multi-provider"
                      checked={multiProviderMode}
                      onCheckedChange={setMultiProviderMode}
                    />
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50 mb-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">Welcome to AI Central</p>
                      <p className="text-sm">Ask me anything about your FluxAO system!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border shadow-sm'
                            }`}
                          >
                            {message.role === 'assistant' && message.provider && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                <span>{getProviderIcon(message.provider)}</span>
                                <span className="font-medium">{message.provider}</span>
                                <span>{message.timestamp.toLocaleTimeString()}</span>
                              </div>
                            )}
                            <div className="whitespace-pre-wrap text-sm">
                              {message.content}
                            </div>
                            {message.metadata && (
                              <div className="text-xs text-gray-500 mt-2">
                                {JSON.stringify(message.metadata, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white border shadow-sm rounded-lg px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                              <span className="text-sm text-gray-600">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about system status, generate content, analyze data..."
                    className="flex-1 resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* Provider Selection */}
              <Card className="p-4">
                <h4 className="font-medium mb-4">AI Providers</h4>
                
                {!multiProviderMode ? (
                  <div className="space-y-3">
                    <Label>Select Provider:</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(providers).map(([key, provider]) => (
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
                ) : (
                  <div className="space-y-3">
                    <Label>Select Providers:</Label>
                    {Object.entries(providers).map(([key, provider]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={key}
                          checked={selectedProviders.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProviders([...selectedProviders, key]);
                            } else {
                              setSelectedProviders(selectedProviders.filter(p => p !== key));
                            }
                          }}
                          disabled={!provider.available}
                          className="rounded"
                        />
                        <label htmlFor={key} className="text-sm flex items-center gap-2">
                          <span>{getProviderIcon(key)}</span>
                          <span className="capitalize">{key}</span>
                          {!provider.available && (
                            <Badge variant="secondary" className="text-xs">Offline</Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <Label className="text-sm font-medium">Quick Actions:</Label>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-left justify-start"
                      onClick={() => setInputMessage("Analyze system performance and provide recommendations")}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      System Analysis
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-left justify-start"
                      onClick={() => setInputMessage("Generate a blog post about AI trends in 2025")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Content Generation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-left justify-start"
                      onClick={() => setInputMessage("Check for security threats and vulnerabilities")}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Security Check
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemHealth?.components && Object.entries(systemHealth.components).map(([key, component]) => (
                <Card key={key} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 capitalize">{key}</p>
                      <p className="text-2xl font-bold">{component.score}/100</p>
                    </div>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      component.status === 'healthy' ? 'bg-green-100 text-green-600' :
                      component.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {component.status === 'healthy' ? <CheckCircle className="h-4 w-4" /> :
                       component.status === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                       <XCircle className="h-4 w-4" />}
                    </div>
                  </div>
                  <Progress value={component.score} className="mt-3" />
                </Card>
              ))}
            </div>

            {/* Provider Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Provider Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(providers).map(([key, provider]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getProviderIcon(key)}</span>
                        <span className="font-medium capitalize">{key}</span>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${
                        provider.available ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Model: {provider.model}</div>
                      <div>Latency: {provider.latency}ms</div>
                      <div>Usage: {provider.usage.today}/{provider.usage.limit}</div>
                    </div>
                    <Progress 
                      value={(provider.usage.today / provider.usage.limit) * 100} 
                      className="mt-2 h-1"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Other tabs would be implemented similarly... */}
          <TabsContent value="providers">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Provider Management</h3>
              <p className="text-gray-600">Provider configuration and management tools coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="writer">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Writer Integration</h3>
              <p className="text-gray-600">FluxAO Writer system integration coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">System Monitoring</h3>
              <p className="text-gray-600">Advanced monitoring dashboard coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Central Settings</h3>
              <p className="text-gray-600">Configuration settings coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
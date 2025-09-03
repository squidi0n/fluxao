'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PenTool, Zap, Download, ExternalLink, RefreshCw, Sparkles, Radar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Topic {
  id: string;
  title: string;
  source?: string;
  category: string;
}

interface WriterConfig {
  category: string;
  length: number;
  tone: string;
  thinker: string;
  hook: string;
  timeHorizon: number;
  style: string;
  audience: string;
  structure: string;
  sources: string;
  factLevel: string;
  useOpenAI: boolean;
  useAnthropic: boolean;
}

const DEFAULT_CONFIG: WriterConfig = {
  category: 'KI & Tech',
  length: 1200,
  tone: 'analytisch-kühl',
  thinker: 'Auto',
  hook: 'Auto',
  timeHorizon: 20,
  style: 'Magazin/Populär',
  audience: 'Gebildete Laien',
  structure: 'Klassisch (Intro-Haupt-Fazit)',
  sources: 'Mit Quellenhinweisen',
  factLevel: 'Plausible Szenarien',
  useOpenAI: true,
  useAnthropic: true,
};

export default function WriterPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<WriterConfig>(DEFAULT_CONFIG);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [userContext, setUserContext] = useState('');
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [lastCrawl, setLastCrawl] = useState<{
    timestamp: string;
    sources: string[];
    totalNew: number;
  } | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    openai?: string;
    anthropic?: string;
  }>({});
  const [isGenerating, setIsGenerating] = useState<{
    openai: boolean;
    anthropic: boolean;
  }>({ openai: false, anthropic: false });

  // Load topics when category changes
  useEffect(() => {
    loadTopics();
    loadCrawlStatus();
  }, [config.category]);

  const loadTopics = async () => {
    setIsLoadingTopics(true);
    try {
      const response = await fetch(`/api/admin/writer/topics?category=${encodeURIComponent(config.category)}&limit=40`);
      const data = await response.json();
      
      if (data.success) {
        setTopics(data.items);
        if (data.message) {
          toast({ title: 'Info', description: data.message });
        }
      } else {
        toast({ title: 'Error', description: 'Failed to load topics', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      toast({ title: 'Error', description: 'Failed to load topics', variant: 'destructive' });
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const loadCrawlStatus = async () => {
    try {
      const response = await fetch('/api/admin/writer/crawl');
      const data = await response.json();
      
      if (data.success && data.lastCrawl) {
        setLastCrawl(data.lastCrawl);
      }
    } catch (error) {
      console.error('Error loading crawl status:', error);
    }
  };

  const runTrendCrawl = async () => {
    if (isCrawling) return;
    
    setIsCrawling(true);
    try {
      const response = await fetch('/api/admin/writer/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ 
          title: 'Crawl Complete!', 
          description: `Found ${data.totalNew} new topics from ${data.sources.length} sources` 
        });
        setLastCrawl({
          timestamp: new Date().toISOString(),
          sources: data.sources,
          totalNew: data.totalNew
        });
        // Reload topics to show new data
        loadTopics();
      } else {
        toast({ title: 'Crawl Failed', description: data.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error crawling trends:', error);
      toast({ title: 'Error', description: 'Failed to crawl trends', variant: 'destructive' });
    } finally {
      setIsCrawling(false);
    }
  };

  const generateContent = async (provider: 'openai' | 'anthropic') => {
    if (!selectedTopic) {
      toast({ title: 'Selection Required', description: 'Please select a topic first', variant: 'destructive' });
      return;
    }

    setIsGenerating(prev => ({ ...prev, [provider]: true }));

    try {
      const response = await fetch('/api/admin/writer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model: provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022',
          topic_id: selectedTopic.id,
          title: selectedTopic.title,
          category: config.category,
          length: config.length,
          tone: config.tone,
          thinker: config.thinker.split(' (')[0], // Remove description
          hook: config.hook.split(' (')[0], // Remove description
          time_horizon: config.timeHorizon,
          style: config.style,
          audience: config.audience,
          structure: config.structure,
          sources: config.sources,
          factlevel: config.factLevel,
          user_context: userContext
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedContent(prev => ({
          ...prev,
          [provider]: data.content
        }));
        toast({ title: 'Success', description: `Content generated with ${provider.toUpperCase()}` });
      } else {
        toast({ title: 'Generation Failed', description: data.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({ title: 'Error', description: 'Failed to generate content', variant: 'destructive' });
    } finally {
      setIsGenerating(prev => ({ ...prev, [provider]: false }));
    }
  };

  const exportToPost = async (provider: 'openai' | 'anthropic') => {
    const content = generatedContent[provider];
    if (!content || !selectedTopic) {
      toast({ title: 'Export Error', description: 'No content to export', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch('/api/admin/writer/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTopic.title,
          content,
          provider: provider === 'openai' ? 'OpenAI GPT-4o' : 'Anthropic Claude 3.5',
          category: config.category,
          tags: [config.thinker.toLowerCase(), new Date().getFullYear().toString()]
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Export Successful', description: 'Content exported to posts successfully!' });
        // Optionally open the edit page
        if (confirm('Content exported successfully! Open in post editor?')) {
          window.open(data.adminUrl, '_blank');
        }
      } else {
        toast({ title: 'Export Failed', description: data.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error exporting content:', error);
      toast({ title: 'Error', description: 'Failed to export content', variant: 'destructive' });
    }
  };

  const downloadMarkdown = (provider: 'openai' | 'anthropic') => {
    const content = generatedContent[provider];
    if (!content || !selectedTopic) {
      toast({ title: 'Download Error', description: 'No content to download', variant: 'destructive' });
      return;
    }

    const slug = selectedTopic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-${provider}.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <PenTool className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FluxAO Writer</h1>
          <p className="text-gray-600">AI-powered content generation with expert personas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div>
                <Label>Category</Label>
                <Select
                  value={config.category}
                  onValueChange={(value) => setConfig({ ...config, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KI & Tech">KI & Tech</SelectItem>
                    <SelectItem value="Mensch & Gesellschaft">Mensch & Gesellschaft</SelectItem>
                    <SelectItem value="Design & Ästhetik">Design & Ästhetik</SelectItem>
                    <SelectItem value="Gaming & Kultur">Gaming & Kultur</SelectItem>
                    <SelectItem value="Mindset & Philosophie">Mindset & Philosophie</SelectItem>
                    <SelectItem value="Business & Finance">Business & Finance</SelectItem>
                    <SelectItem value="Future & Science">Future & Science</SelectItem>
                    <SelectItem value="Fiction Lab">Fiction Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Length */}
              <div>
                <Label>Length (words)</Label>
                <Input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={config.length}
                  onChange={(e) => setConfig({ ...config, length: parseInt(e.target.value) || 1200 })}
                />
              </div>

              {/* Tone */}
              <div>
                <Label>Tone</Label>
                <Select
                  value={config.tone}
                  onValueChange={(value) => setConfig({ ...config, tone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visionär-optimistisch">visionär-optimistisch</SelectItem>
                    <SelectItem value="dystopisch-warnend">dystopisch-warnend</SelectItem>
                    <SelectItem value="analytisch-kühl">analytisch-kühl</SelectItem>
                    <SelectItem value="poetisch-metaphorisch">poetisch-metaphorisch</SelectItem>
                    <SelectItem value="investigativ-kritisch">investigativ-kritisch</SelectItem>
                    <SelectItem value="humorvoll-ironisch">humorvoll-ironisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Thinker */}
              <div>
                <Label>Expert Persona</Label>
                <Select
                  value={config.thinker}
                  onValueChange={(value) => setConfig({ ...config, thinker: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kurzweil (Singularität)">Kurzweil (Singularität)</SelectItem>
                    <SelectItem value="Harari (Geschichte/Zukunft)">Harari (Geschichte/Zukunft)</SelectItem>
                    <SelectItem value="Bostrom (Existenzrisiken)">Bostrom (Existenzrisiken)</SelectItem>
                    <SelectItem value="Hassabis (DeepMind)">Hassabis (DeepMind)</SelectItem>
                    <SelectItem value="Kelly (Technologie)">Kelly (Technologie)</SelectItem>
                    <SelectItem value="Tegmark (KI-Physik)">Tegmark (KI-Physik)</SelectItem>
                    <SelectItem value="Zuboff (Überwachung)">Zuboff (Überwachung)</SelectItem>
                    <SelectItem value="Musk (Mars/Neuralink)">Musk (Mars/Neuralink)</SelectItem>
                    <SelectItem value="Altman (OpenAI)">Altman (OpenAI)</SelectItem>
                    <SelectItem value="Auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hook */}
              <div>
                <Label>Hook Style</Label>
                <Select
                  value={config.hook}
                  onValueChange={(value) => setConfig({ ...config, hook: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Szene (Immersiv)">Szene (Immersiv)</SelectItem>
                    <SelectItem value="Provokante Frage">Provokante Frage</SelectItem>
                    <SelectItem value="Fakt/Statistik">Fakt/Statistik</SelectItem>
                    <SelectItem value="Zitat (Berühmt)">Zitat (Berühmt)</SelectItem>
                    <SelectItem value="Paradoxon">Paradoxon</SelectItem>
                    <SelectItem value="Auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Horizon */}
              <div>
                <Label>Time Horizon</Label>
                <Select
                  value={config.timeHorizon.toString()}
                  onValueChange={(value) => setConfig({ ...config, timeHorizon: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="10">10 Years</SelectItem>
                    <SelectItem value="20">20 Years</SelectItem>
                    <SelectItem value="30">30 Years</SelectItem>
                    <SelectItem value="50">50 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* AI Providers */}
              <div>
                <Label>AI Providers</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.useOpenAI}
                      onChange={(e) => setConfig({ ...config, useOpenAI: e.target.checked })}
                      className="rounded"
                    />
                    <span>OpenAI GPT-4o</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.useAnthropic}
                      onChange={(e) => setConfig({ ...config, useAnthropic: e.target.checked })}
                      className="rounded"
                    />
                    <span>Anthropic Claude 3.5</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={loadTopics} variant="outline" size="sm" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Topics
                </Button>
                <Button 
                  onClick={runTrendCrawl} 
                  disabled={isCrawling}
                  variant="default" 
                  size="sm" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Radar className="w-4 h-4 mr-2" />
                  {isCrawling ? 'Crawling...' : 'Update Trend Radar'}
                </Button>
              </div>

              {lastCrawl && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last crawl: {new Date(lastCrawl.timestamp).toLocaleTimeString()}
                    </div>
                    <div>
                      Found {lastCrawl.totalNew} new topics
                    </div>
                    <div className="text-xs">
                      Sources: {lastCrawl.sources.join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Trending Topics - {config.category}</span>
                <Badge variant="secondary">{topics.length} topics</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTopics ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading topics...
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Radar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No topics found for this category.</p>
                  <p className="text-sm mt-1">Try running the trend radar to discover new topics!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {topics.map((topic: any) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-3 text-left rounded-lg border transition-colors ${
                        selectedTopic?.id === topic.id
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">{topic.title}</div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>— {topic.source}</span>
                        {topic.score && (
                          <Badge variant="outline" className="text-xs">
                            ⚡ {topic.score}
                          </Badge>
                        )}
                      </div>
                      {topic.discoveredAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(topic.discoveredAt).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Topic Info */}
          {selectedTopic && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Topic</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="mb-2">{selectedTopic.source}</Badge>
                <h3 className="font-medium">{selectedTopic.title}</h3>
              </CardContent>
            </Card>
          )}

          {/* User Context */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Context & Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add your own sources, facts, or URLs that should be included in the article..."
                rows={4}
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Generation Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {config.useOpenAI && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    OpenAI GPT-4o
                  </CardTitle>
                  <Button
                    onClick={() => generateContent('openai')}
                    disabled={!selectedTopic || isGenerating.openai}
                    size="sm"
                  >
                    {isGenerating.openai ? 'Generating...' : 'Generate'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {generatedContent.openai ? (
                    <div>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                        {generatedContent.openai}
                      </pre>
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => downloadMarkdown('openai')}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download MD
                        </Button>
                        <Button
                          onClick={() => exportToPost('openai')}
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Export to Posts
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select a topic and click Generate to create content
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {config.useAnthropic && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Anthropic Claude 3.5
                  </CardTitle>
                  <Button
                    onClick={() => generateContent('anthropic')}
                    disabled={!selectedTopic || isGenerating.anthropic}
                    size="sm"
                  >
                    {isGenerating.anthropic ? 'Generating...' : 'Generate'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {generatedContent.anthropic ? (
                    <div>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                        {generatedContent.anthropic}
                      </pre>
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => downloadMarkdown('anthropic')}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download MD
                        </Button>
                        <Button
                          onClick={() => exportToPost('anthropic')}
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Export to Posts
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select a topic and click Generate to create content
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
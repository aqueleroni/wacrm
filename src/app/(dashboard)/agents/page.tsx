'use client';

import { useEffect, useState } from 'react';
import { Bot, Sparkles, Settings2, Brain, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AiPlayground } from '@/components/agents/ai-playground';
import { AiIntelligencePanel } from '@/components/agents/ai-intelligence-panel';
import { AiConfig } from '@/components/settings/ai-config';
import { useT } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

type Tab = 'playground' | 'setup' | 'intelligence';

export default function AgentsPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('playground');
  const [decided, setDecided] = useState(false);
  const [pendingMemoryCount, setPendingMemoryCount] = useState(0);

  // Land first-time users on Setup, returning users on the Playground.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ai/config');
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setTab(data?.configured ? 'playground' : 'setup');
      } catch {
        if (!cancelled) setTab('setup');
      } finally {
        if (!cancelled) setDecided(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!decided) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ai/memory?status=pending');
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          setPendingMemoryCount(Array.isArray(data.memories) ? data.memories.length : 0);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [decided, tab]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('agents.title')}
        </h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('agents.subtitle')}
      </p>

      {!decided ? (
        <div className="mt-16 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('common.actions.loading')}
        </div>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="mt-6"
        >
          <TabsList>
            <TabsTrigger value="playground">
              <Sparkles className="mr-1.5 h-4 w-4" /> {t('agents.tabs.playground')}
            </TabsTrigger>
            <TabsTrigger value="setup">
              <Settings2 className="mr-1.5 h-4 w-4" /> {t('agents.tabs.setup')}
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="relative">
              <Brain className="mr-1.5 h-4 w-4" /> {t('agents.tabs.intelligence')}
              {pendingMemoryCount > 0 && (
                <span
                  className={cn(
                    'ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full',
                    'bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white',
                  )}
                >
                  {pendingMemoryCount > 99 ? '99+' : pendingMemoryCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="playground" className="mt-4">
            <AiPlayground onGoToSetup={() => setTab('setup')} />
          </TabsContent>

          <TabsContent value="setup" className="mt-4">
            <AiConfig />
          </TabsContent>

          <TabsContent value="intelligence" className="mt-4">
            <AiIntelligencePanel onGoToSetup={() => setTab('setup')} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

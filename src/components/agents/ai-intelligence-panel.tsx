'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Brain,
  BookOpen,
  Sparkles,
  ArrowRight,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-i18n';
import { canEditSettings } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AiMemoryCard } from './ai-memory-card';
import { AiSkillsCard } from './ai-skills-card';

export function AiIntelligencePanel({ onGoToSetup }: { onGoToSetup?: () => void }) {
  const t = useT();
  const { accountId, accountRole } = useAuth();
  const canEdit = accountRole ? canEditSettings(accountRole) : false;
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const loadedAccountIdRef = useRef<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, kbRes] = await Promise.all([
        fetch('/api/ai/config'),
        fetch('/api/ai/knowledge'),
      ]);
      const config = await configRes.json().catch(() => ({}));
      const kb = await kbRes.json().catch(() => ({}));
      setConfigured(Boolean(config?.configured));
      setDocCount(Array.isArray(kb?.documents) ? kb.documents.length : 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accountId || loadedAccountIdRef.current === accountId) return;
    loadedAccountIdRef.current = accountId;
    void fetchStatus();
  }, [accountId, fetchStatus]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex gap-3">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('agents.intelligence.privateHint')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              {t('agents.intelligence.persona.title')}
            </CardTitle>
            <CardDescription>{t('agents.intelligence.persona.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">
              {loading
                ? '…'
                : configured
                  ? t('agents.intelligence.persona.configured')
                  : t('agents.intelligence.persona.notConfigured')}
            </p>
            {onGoToSetup ? (
              <Button variant="outline" size="sm" onClick={onGoToSetup}>
                {t('agents.intelligence.persona.openSetup')}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              {t('agents.intelligence.knowledge.title')}
            </CardTitle>
            <CardDescription>{t('agents.intelligence.knowledge.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              {loading
                ? '…'
                : t('agents.intelligence.knowledge.count', { count: docCount })}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('agents.intelligence.knowledge.hint')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-primary" />
              {t('agents.intelligence.overview.title')}
            </CardTitle>
            <CardDescription>{t('agents.intelligence.overview.description')}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('agents.intelligence.overview.bodyActive')}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AiMemoryCard accountId={accountId} canEdit={canEdit} />
        <AiSkillsCard accountId={accountId} canEdit={canEdit} />
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles, CheckCircle2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { canEditSettings } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsPanelHead } from './settings-panel-head';
import { useT } from '@/hooks/use-i18n';
import { AiKnowledgeCard } from './ai-knowledge';
import { AI_PROVIDER_DEFAULT_MODEL } from '@/lib/ai/defaults';
import {
  getDefaultModel,
  isKnownModel,
  modelsForProvider,
} from '@/lib/ai/models';
import type { AiProvider } from '@/lib/ai/types';
import type { AccountMember } from '@/types';
import { fetchAccountMembers, memberLabel } from '@/lib/account/members';

const MASKED_KEY = '••••••••••••••••';

// Radix Select can't use an empty-string item value, so the "leave
// unassigned" choice gets a sentinel that maps to null in the payload.
const HANDOFF_QUEUE = '__queue__';

const KEY_PLACEHOLDER: Record<AiProvider, string> = {
  openai: 'sk-...',
  anthropic: 'sk-ant-...',
};

export function AiConfig() {
  const t = useT();
  const { accountId, accountRole, profileLoading, loading: authLoading, user } = useAuth();
  const canEdit = accountRole ? canEditSettings(accountRole) : false;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [configured, setConfigured] = useState(false);
  const [provider, setProvider] = useState<AiProvider>('openai');
  const [model, setModel] = useState(AI_PROVIDER_DEFAULT_MODEL.openai);
  const [apiKey, setApiKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [embeddingsKey, setEmbeddingsKey] = useState('');
  const [embeddingsKeyEdited, setEmbeddingsKeyEdited] = useState(false);
  const [hasStoredEmbeddingsKey, setHasStoredEmbeddingsKey] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [conversationExamples, setConversationExamples] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [maxPerConversation, setMaxPerConversation] = useState(3);
  // Empty string = leave unassigned (shared queue).
  const [handoffAgentId, setHandoffAgentId] = useState('');
  const [members, setMembers] = useState<AccountMember[]>([]);

  // Guard keyed on the account (not a bare boolean) so an in-place
  // account switch — ownership transfer, multi-account membership —
  // refetches instead of showing the previous account's config. Mirrors
  // the loadedAccountIdRef pattern in whatsapp-config.tsx.
  const loadedAccountIdRef = useRef<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? t('settings.ai.toast.loadFailed'));
        return;
      }
      if (data.configured) {
        setConfigured(true);
        setProvider(data.provider);
        setModel(data.model);
        setSystemPrompt(data.system_prompt ?? '');
        setConversationExamples(data.conversation_examples ?? '');
        setIsActive(data.is_active);
        setAutoReplyEnabled(data.auto_reply_enabled);
        setMaxPerConversation(data.auto_reply_max_per_conversation ?? 3);
        setHandoffAgentId(data.handoff_agent_id ?? '');
        setHasStoredKey(Boolean(data.has_key));
        setApiKey(data.has_key ? MASKED_KEY : '');
        setKeyEdited(false);
        setHasStoredEmbeddingsKey(Boolean(data.has_embeddings_key));
        setEmbeddingsKey(data.has_embeddings_key ? MASKED_KEY : '');
        setEmbeddingsKeyEdited(false);
      }
    } catch {
      toast.error(t('settings.ai.toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user || !accountId) {
      loadedAccountIdRef.current = null;
      setLoading(false);
      return;
    }
    if (loadedAccountIdRef.current === accountId) return;
    loadedAccountIdRef.current = accountId;
    void fetchConfig();
    // Members populate the handoff-target picker. Best-effort — on an
    // older deployment without the endpoint the picker just shows the
    // queue option.
    void fetchAccountMembers().then(setMembers);
  }, [authLoading, profileLoading, user, accountId, fetchConfig]);

  // Swap the model default when the provider changes, unless the user
  // picked a model from the previous provider's list.
  const handleProviderChange = (next: AiProvider) => {
    setProvider(next);
    if (isKnownModel(provider, model) || model.trim() === '') {
      setModel(getDefaultModel(next));
    }
  };

  const modelOptions = useMemo(
    () => modelsForProvider(provider, model),
    [provider, model],
  );

  const modelLabel = (id: string) => {
    const key = `settings.ai.provider.models.${id}.label`;
    const translated = t(key);
    return translated === key ? id : translated;
  };

  const modelField = (id: string, field: 'summary' | 'details') => {
    const key = `settings.ai.provider.models.${id}.${field}`;
    const translated = t(key);
    return translated === key ? '' : translated;
  };

  const selectedModelSummary = modelField(model, 'summary');
  const selectedModelDetails = modelField(model, 'details');

  const keyPayload = () => (keyEdited ? apiKey.trim() : undefined);

  // undefined = leave unchanged; '' typed = null (clear); text = set.
  const embeddingsKeyPayload = () =>
    embeddingsKeyEdited ? embeddingsKey.trim() || null : undefined;

  const buildBody = () => ({
    provider,
    model: model.trim(),
    api_key: keyPayload(),
    embeddings_api_key: embeddingsKeyPayload(),
    system_prompt: systemPrompt.trim() || null,
    conversation_examples: conversationExamples.trim() || null,
    is_active: isActive,
    auto_reply_enabled: autoReplyEnabled,
    auto_reply_max_per_conversation: maxPerConversation,
    handoff_agent_id: handoffAgentId || null,
  });

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model: model.trim(),
          api_key: keyPayload(),
        }),
      });
      const data = await res.json();
      if (res.ok) toast.success(t('settings.ai.toast.testSuccess'));
      else toast.error(data.error ?? t('settings.ai.toast.testFailed'));
    } catch {
      toast.error(t('settings.ai.toast.testUnreachable'));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!model.trim()) {
      toast.error(t('settings.ai.toast.modelRequired'));
      return;
    }
    if (!configured && !keyEdited) {
      toast.error(t('settings.ai.toast.keyRequired'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('settings.ai.toast.saveSuccess'));
        await fetchConfig();
      } else {
        toast.error(data.error ?? t('settings.ai.toast.saveFailed'));
      }
    } catch {
      toast.error(t('settings.ai.toast.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch('/api/ai/config', { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('settings.ai.toast.removeSuccess'));
        setConfigured(false);
        setHasStoredKey(false);
        setApiKey('');
        setKeyEdited(false);
        setIsActive(false);
        setAutoReplyEnabled(false);
        setSystemPrompt('');
      } else {
        const data = await res.json();
        toast.error(data.error ?? t('settings.ai.toast.removeFailed'));
      }
    } catch {
      toast.error(t('settings.ai.toast.removeFailed'));
    } finally {
      setRemoving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('settings.ai.loading')}
      </div>
    );
  }

  const disabled = !canEdit || saving;

  return (
    <div>
      <SettingsPanelHead
        title={t('settings.ai.title')}
        description={t('settings.ai.description')}
      />

      {!canEdit && (
        <p className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {t('settings.ai.adminOnly')}
        </p>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />{' '}
              {t('settings.ai.provider.title')}
            </CardTitle>
            <CardDescription>{t('settings.ai.provider.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('settings.ai.provider.providerLabel')}</Label>
                <Select
                  value={provider}
                  onValueChange={(v) => handleProviderChange(v as AiProvider)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">
                      {t('settings.ai.provider.providers.openai')}
                    </SelectItem>
                    <SelectItem value="anthropic">
                      {t('settings.ai.provider.providers.anthropic')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ai-model">{t('settings.ai.provider.modelLabel')}</Label>
                <Select
                  value={model}
                  onValueChange={(v) => {
                    if (v) setModel(v);
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger
                    id="ai-model"
                    className="h-auto w-full gap-2 whitespace-normal py-2.5 pl-3 pr-2 data-[size=default]:!h-auto data-[size=default]:min-h-[3.25rem] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:flex-1 [&_[data-slot=select-value]]:flex-col [&_[data-slot=select-value]]:!items-start [&_[data-slot=select-value]]:justify-center [&_[data-slot=select-value]]:gap-1 [&_[data-slot=select-value]]:py-0.5 [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal"
                  >
                    <SelectValue placeholder={AI_PROVIDER_DEFAULT_MODEL[provider]}>
                      {model ? (
                        <>
                          <span className="block w-full truncate text-sm font-medium leading-tight">
                            {modelLabel(model)}
                          </span>
                          {selectedModelSummary ? (
                            <span className="block w-full text-pretty text-xs leading-snug text-muted-foreground">
                              {selectedModelSummary}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    sideOffset={6}
                    alignItemWithTrigger
                    className="max-h-[min(var(--available-height),24rem)] w-(--anchor-width) min-w-0 overflow-y-auto p-1"
                  >
                    {modelOptions.map((option) => {
                      const known = isKnownModel(provider, option.id);
                      const summary = modelField(option.id, 'summary');
                      const details = modelField(option.id, 'details');
                      return (
                        <SelectItem
                          key={option.id}
                          value={option.id}
                          multiline
                          className="rounded-md py-2.5"
                        >
                          <span className="flex min-w-0 flex-col gap-1.5 pr-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="font-medium leading-none">
                                {modelLabel(option.id)}
                              </span>
                              {option.recommended ? (
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  {t('settings.ai.provider.modelRecommended')}
                                </span>
                              ) : null}
                              {!known ? (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {t('settings.ai.provider.modelCustom')}
                                </span>
                              ) : (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {t(`settings.ai.provider.modelTiers.${option.tier}`)}
                                </span>
                              )}
                            </span>
                            {summary ? (
                              <span className="text-xs font-medium leading-snug text-foreground/90">
                                {summary}
                              </span>
                            ) : null}
                            {details ? (
                              <span className="text-xs leading-relaxed text-muted-foreground">
                                {details}
                              </span>
                            ) : null}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {(selectedModelSummary || selectedModelDetails) && (
                  <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
                    {selectedModelSummary ? (
                      <p className="text-sm font-medium text-foreground">
                        {selectedModelSummary}
                      </p>
                    ) : null}
                    {selectedModelDetails ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {selectedModelDetails}
                      </p>
                    ) : null}
                  </div>
                )}
                {!selectedModelDetails && (
                  <p className="text-xs text-muted-foreground">
                    {t('settings.ai.provider.modelHint')}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-key">{t('settings.ai.provider.apiKeyLabel')}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="ai-key"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setKeyEdited(true);
                    }}
                    onFocus={() => {
                      if (!keyEdited && hasStoredKey) {
                        setApiKey('');
                        setKeyEdited(true);
                      }
                    }}
                    placeholder={KEY_PLACEHOLDER[provider]}
                    disabled={disabled}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={disabled || testing}
                >
                  {testing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {t('settings.ai.provider.testKey')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-embeddings-key">
                {t('settings.ai.provider.embeddingsKeyLabel')}{' '}
                <span className="font-normal text-muted-foreground">
                  {t('settings.ai.provider.embeddingsKeyOptional')}
                </span>
              </Label>
              <Input
                id="ai-embeddings-key"
                type="password"
                value={embeddingsKey}
                onChange={(e) => {
                  setEmbeddingsKey(e.target.value);
                  setEmbeddingsKeyEdited(true);
                }}
                onFocus={() => {
                  if (!embeddingsKeyEdited && hasStoredEmbeddingsKey) {
                    setEmbeddingsKey('');
                    setEmbeddingsKeyEdited(true);
                  }
                }}
                placeholder={t('settings.ai.provider.embeddingsPlaceholder')}
                disabled={disabled}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.ai.provider.embeddingsHint', {
                  sameKey:
                    provider === 'openai'
                      ? t('settings.ai.provider.embeddingsSameKey')
                      : '',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.ai.behaviour.title')}</CardTitle>
            <CardDescription>{t('settings.ai.behaviour.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">{t('settings.ai.behaviour.promptLabel')}</Label>
              <Textarea
                id="ai-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={t('settings.ai.behaviour.promptPlaceholder')}
                rows={8}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-examples">{t('settings.ai.behaviour.examplesLabel')}</Label>
              <Textarea
                id="ai-examples"
                value={conversationExamples}
                onChange={(e) => setConversationExamples(e.target.value)}
                placeholder={t('settings.ai.behaviour.examplesPlaceholder')}
                rows={6}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.ai.behaviour.examplesHint')}
              </p>
            </div>

            {(conversationExamples.trim() || systemPrompt.trim()) && (
              <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('settings.ai.behaviour.previewTitle')}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                  {conversationExamples.trim()
                    ? conversationExamples.trim().split('\n').slice(0, 4).join('\n')
                    : t('settings.ai.behaviour.previewEmpty')}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('settings.ai.behaviour.enableTitle')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.ai.behaviour.enableDescription')}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('settings.ai.behaviour.autoReplyTitle')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.ai.behaviour.autoReplyDescription')}
                </p>
              </div>
              <Switch
                checked={autoReplyEnabled}
                onCheckedChange={setAutoReplyEnabled}
                disabled={disabled || !isActive}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="ai-max">{t('settings.ai.behaviour.maxRepliesLabel')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('settings.ai.behaviour.maxRepliesDescription')}
                </p>
              </div>
              <Input
                id="ai-max"
                type="number"
                min={1}
                max={20}
                value={maxPerConversation}
                onChange={(e) =>
                  setMaxPerConversation(
                    Math.min(20, Math.max(1, Number(e.target.value) || 1)),
                  )
                }
                disabled={disabled || !autoReplyEnabled}
                className="w-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-handoff">{t('settings.ai.behaviour.handoffTo')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('settings.ai.behaviour.handoffToDesc')}
              </p>
              <Select
                value={handoffAgentId || HANDOFF_QUEUE}
                onValueChange={(v) =>
                  setHandoffAgentId(!v || v === HANDOFF_QUEUE ? '' : v)
                }
                disabled={disabled || !autoReplyEnabled}
              >
                <SelectTrigger id="ai-handoff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={HANDOFF_QUEUE}>
                    {t('settings.ai.behaviour.handoffQueue')}
                  </SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {memberLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <AiKnowledgeCard
          accountId={accountId}
          canEdit={canEdit}
          hasEmbeddingsKey={
            embeddingsKeyEdited
              ? embeddingsKey.trim().length > 0
              : hasStoredEmbeddingsKey
          }
        />

        <div className="flex items-center justify-between">
          {configured ? (
            <Button
              variant="ghost"
              onClick={handleRemove}
              disabled={!canEdit || removing}
              className="text-destructive hover:text-destructive"
            >
              {removing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t('settings.ai.actions.remove')}
            </Button>
          ) : (
            <span />
          )}

          <Button onClick={handleSave} disabled={disabled}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('settings.ai.actions.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

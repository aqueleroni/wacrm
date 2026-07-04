'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Bot, RotateCcw, Send, Loader2, UserCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-i18n';
import { createClient } from '@/lib/supabase/client';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  /** assistant-only: the agent signalled a human handoff on this turn. */
  handoff?: boolean;
}

interface ContactOption {
  id: string;
  label: string;
}

export function AiPlayground({ onGoToSetup }: { onGoToSetup?: () => void }) {
  const t = useT();
  const { accountId } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [simulateContact, setSimulateContact] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadContacts = useCallback(async () => {
    if (!accountId) return;
    setLoadingContacts(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('account_id', accountId)
        .order('updated_at', { ascending: false })
        .limit(50);
      setContacts(
        (data ?? []).map((c) => ({
          id: c.id,
          label: c.name?.trim()
            ? `${c.name.trim()} (${c.phone})`
            : c.phone,
        })),
      );
    } finally {
      setLoadingContacts(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (simulateContact && contacts.length === 0) {
      void loadContacts();
    }
  }, [simulateContact, contacts.length, loadContacts]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (simulateContact && !contactId) {
      toast.error(t('agents.playground.simulateContact.pickRequired'));
      return;
    }

    const next: Turn[] = [...turns, { role: 'user', content: text }];
    setTurns(next);
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/ai/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((turn) => ({ role: turn.role, content: turn.content })),
          ...(simulateContact && contactId ? { contact_id: contactId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === 'ai_not_configured') {
          toast.error(t('agents.playground.toast.notConfigured'));
        } else {
          toast.error(data.error ?? t('agents.playground.toast.noReply'));
        }
        setTurns(turns);
        setInput(text);
        return;
      }
      setTurns([
        ...next,
        {
          role: 'assistant',
          content:
            typeof data.reply === 'string' && data.reply.trim()
              ? data.reply
              : '',
          handoff: Boolean(data.handoff),
        },
      ]);
    } catch {
      toast.error(t('agents.playground.toast.unreachable'));
      setTurns(turns);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="flex h-[60vh] min-h-[420px] flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{t('agents.playground.title')}</span>
            <span className="text-xs text-muted-foreground">
              — {t('agents.playground.subtitle')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTurns([])}
            disabled={turns.length === 0 || sending}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> {t('agents.playground.reset')}
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="pg-simulate" className="text-sm font-medium">
              {t('agents.playground.simulateContact.title')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('agents.playground.simulateContact.hint')}
            </p>
          </div>
          <Switch
            id="pg-simulate"
            checked={simulateContact}
            onCheckedChange={(on) => {
              setSimulateContact(on);
              if (!on) setContactId(null);
            }}
          />
        </div>

        {simulateContact && (
          <div className="space-y-1.5">
            <Label className="text-xs">{t('agents.playground.simulateContact.contactLabel')}</Label>
            <Select
              value={contactId ?? ''}
              onValueChange={(v) => {
                if (v) setContactId(v);
              }}
              disabled={loadingContacts}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingContacts
                      ? t('agents.playground.simulateContact.loading')
                      : t('agents.playground.simulateContact.placeholder')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {turns.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <Bot className="mb-2 h-8 w-8 text-muted-foreground/60" />
            <p>{t('agents.playground.empty')}</p>
            <p className="mt-1 text-xs">
              {t('agents.playground.emptyHint')}
            </p>
            {onGoToSetup && (
              <Button
                variant="link"
                size="sm"
                onClick={onGoToSetup}
                className="mt-1 h-auto p-0 text-xs"
              >
                {t('agents.playground.notSetupLink')} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {turns.map((turn, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-2',
              turn.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            {turn.role === 'assistant' && (
              <Bot className="mt-1 h-5 w-5 shrink-0 text-primary" />
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                turn.role === 'user'
                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                  : 'rounded-bl-sm bg-muted text-foreground',
              )}
            >
              {turn.content && <p className="whitespace-pre-wrap">{turn.content}</p>}
              {turn.role === 'assistant' && turn.handoff && (
                <p
                  className={cn(
                    'flex items-center gap-1 text-xs text-amber-500',
                    turn.content && 'mt-1.5 border-t border-border/50 pt-1.5',
                  )}
                >
                  <UserCircle2 className="h-3.5 w-3.5" />
                  {t('agents.playground.handoff')}
                </p>
              )}
            </div>
            {turn.role === 'user' && (
              <UserCircle2 className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-5 w-5 text-primary" />
            <Loader2 className="h-4 w-4 animate-spin" /> {t('agents.playground.thinking')}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('agents.playground.placeholder')}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/50"
        />
        <Button
          size="sm"
          onClick={() => void send()}
          disabled={!input.trim() || sending}
          className="h-9 w-9 shrink-0 p-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

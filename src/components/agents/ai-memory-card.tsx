'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Pencil, MemoryStick } from 'lucide-react';
import { useT } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MemoryRow {
  id: string;
  kind: string;
  content: string;
  status: string;
  updated_at: string;
}

type EditTarget = 'new' | string | null;

export function AiMemoryCard({
  accountId,
  canEdit,
}: {
  accountId: string | null;
  canEdit: boolean;
}) {
  const t = useT();
  const [rows, setRows] = useState<MemoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [content, setContent] = useState('');
  const [kind, setKind] = useState('fact');
  const [saving, setSaving] = useState(false);
  const [autoExtract, setAutoExtract] = useState(false);
  const [togglingExtract, setTogglingExtract] = useState(false);
  const loadedAccountIdRef = useRef<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/memory');
      const data = await res.json();
      if (res.ok) setRows(data.memories ?? []);
      else toast.error(data.error ?? t('agents.intelligence.memory.loadFailed'));
    } catch {
      toast.error(t('agents.intelligence.memory.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json().catch(() => ({}));
      setAutoExtract(Boolean(data?.memory_auto_extract));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    if (loadedAccountIdRef.current === accountId) return;
    loadedAccountIdRef.current = accountId;
    void fetchRows();
    void fetchConfig();
  }, [accountId, fetchRows, fetchConfig]);

  const openNew = () => {
    setEditing('new');
    setContent('');
    setKind('fact');
  };

  const openEdit = (row: MemoryRow) => {
    setEditing(row.id);
    setContent(row.content);
    setKind(row.kind);
  };

  const cancelEdit = () => {
    setEditing(null);
    setContent('');
    setKind('fact');
  };

  const save = async () => {
    if (!content.trim()) {
      toast.error(t('agents.intelligence.memory.contentRequired'));
      return;
    }
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const res = await fetch(
        isNew ? '/api/ai/memory' : `/api/ai/memory/${editing}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim(), kind }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(
          isNew
            ? t('agents.intelligence.memory.added')
            : t('agents.intelligence.memory.updated'),
        );
        cancelEdit();
        await fetchRows();
      } else {
        toast.error(data.error ?? t('agents.intelligence.memory.saveFailed'));
      }
    } catch {
      toast.error(t('agents.intelligence.memory.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/ai/memory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(t('agents.intelligence.memory.updated'));
        await fetchRows();
      } else {
        const data = await res.json();
        toast.error(data.error ?? t('agents.intelligence.memory.saveFailed'));
      }
    } catch {
      toast.error(t('agents.intelligence.memory.saveFailed'));
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/memory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('agents.intelligence.memory.removed'));
        setRows((r) => r.filter((x) => x.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error ?? t('agents.intelligence.memory.removeFailed'));
      }
    } catch {
      toast.error(t('agents.intelligence.memory.removeFailed'));
    }
  };

  const approvedCount = rows.filter((r) => r.status === 'approved').length;
  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const pendingRows = rows.filter((r) => r.status === 'pending');
  const otherRows = rows.filter((r) => r.status !== 'pending');

  const toggleAutoExtract = async (enabled: boolean) => {
    setTogglingExtract(true);
    try {
      const res = await fetch('/api/ai/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory_auto_extract: enabled }),
      });
      const data = await res.json();
      if (res.ok) {
        setAutoExtract(enabled);
        toast.success(
          enabled
            ? t('agents.intelligence.memory.autoExtractOn')
            : t('agents.intelligence.memory.autoExtractOff'),
        );
      } else {
        toast.error(data.error ?? t('agents.intelligence.memory.autoExtractFailed'));
      }
    } catch {
      toast.error(t('agents.intelligence.memory.autoExtractFailed'));
    } finally {
      setTogglingExtract(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MemoryStick className="h-4 w-4 text-primary" />
          {t('agents.intelligence.memory.title')}
        </CardTitle>
        <CardDescription>
          {t('agents.intelligence.memory.description')}
          {!loading && (
            <span className="mt-1 block text-xs">
              {t('agents.intelligence.memory.stats', {
                approved: approvedCount,
                pending: pendingCount,
              })}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/20 p-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t('agents.intelligence.memory.autoExtractTitle')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('agents.intelligence.memory.autoExtractHint')}
              </p>
            </div>
            <Switch
              checked={autoExtract}
              onCheckedChange={(v) => void toggleAutoExtract(v)}
              disabled={togglingExtract}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center py-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> …
          </div>
        ) : (
          <>
            {rows.length === 0 && editing === null && (
              <p className="text-sm text-muted-foreground">
                {t('agents.intelligence.memory.empty')}
              </p>
            )}

            {pendingRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  {t('agents.intelligence.memory.pendingTitle', { count: pendingRows.length })}
                </p>
                <ul className="divide-y divide-border rounded-md border border-amber-500/30 bg-amber-500/5">
                  {pendingRows.map((row) => (
                    <li key={row.id} className="space-y-2 px-3 py-2">
                      <p className="text-sm text-foreground">{row.content}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          {row.kind}
                        </span>
                        {canEdit && (
                          <span className="ml-auto flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => void setStatus(row.id, 'approved')}
                            >
                              {t('agents.intelligence.memory.approve')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive"
                              onClick={() => void setStatus(row.id, 'rejected')}
                            >
                              {t('agents.intelligence.memory.reject')}
                            </Button>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {otherRows.length > 0 && (
              <ul className="divide-y divide-border rounded-md border border-border">
                {otherRows.map((row) => (
                  <li key={row.id} className="space-y-2 px-3 py-2">
                    <p className="text-sm text-foreground">{row.content}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                        {row.kind}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                          row.status === 'approved'
                            ? 'bg-primary/10 text-primary'
                            : row.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {row.status}
                      </span>
                      {canEdit && (
                        <span className="ml-auto flex gap-1">
                          {row.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => void setStatus(row.id, 'approved')}
                            >
                              {t('agents.intelligence.memory.approve')}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => void remove(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {editing !== null ? (
              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="space-y-2">
                  <Label>{t('agents.intelligence.memory.kindLabel')}</Label>
                  <Select
                    value={kind}
                    onValueChange={(v) => {
                      if (v) setKind(v);
                    }}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fact">{t('agents.intelligence.memory.kinds.fact')}</SelectItem>
                      <SelectItem value="preference">{t('agents.intelligence.memory.kinds.preference')}</SelectItem>
                      <SelectItem value="objection">{t('agents.intelligence.memory.kinds.objection')}</SelectItem>
                      <SelectItem value="note">{t('agents.intelligence.memory.kinds.note')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('agents.intelligence.memory.contentLabel')}</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('agents.intelligence.memory.contentPlaceholder')}
                    rows={4}
                    disabled={saving}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                    {t('agents.intelligence.memory.cancel')}
                  </Button>
                  <Button onClick={() => void save()} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('agents.intelligence.memory.save')}
                  </Button>
                </div>
              </div>
            ) : (
              canEdit && (
                <Button variant="outline" size="sm" onClick={openNew}>
                  <Plus className="mr-2 h-4 w-4" /> {t('agents.intelligence.memory.add')}
                </Button>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

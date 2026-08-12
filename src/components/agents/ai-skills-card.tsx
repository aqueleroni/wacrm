'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Pencil, Wrench, Download } from 'lucide-react';
import { useT } from '@/hooks/use-i18n';
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
import { WEPOST_SKILLS } from '@/lib/ai/presets/wepost-skills';

interface SkillRow {
  id: string;
  name: string;
  description: string | null;
  trigger_hint: string;
  instructions: string;
  is_active: boolean;
  priority: number;
}

type EditTarget = 'new' | string | null;

export function AiSkillsCard({
  accountId,
  canEdit,
}: {
  accountId: string | null;
  canEdit: boolean;
}) {
  const t = useT();
  const [rows, setRows] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerHint, setTriggerHint] = useState('');
  const [instructions, setInstructions] = useState('');
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const loadedAccountIdRef = useRef<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/skills');
      const data = await res.json();
      if (res.ok) setRows(data.skills ?? []);
      else toast.error(data.error ?? t('agents.intelligence.skills.loadFailed'));
    } catch {
      toast.error(t('agents.intelligence.skills.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    if (loadedAccountIdRef.current === accountId) return;
    loadedAccountIdRef.current = accountId;
    void fetchRows();
  }, [accountId, fetchRows]);

  const openNew = () => {
    setEditing('new');
    setName('');
    setDescription('');
    setTriggerHint('');
    setInstructions('');
    setPriority(0);
    setIsActive(true);
  };

  const openEdit = (row: SkillRow) => {
    setEditing(row.id);
    setName(row.name);
    setDescription(row.description ?? '');
    setTriggerHint(row.trigger_hint);
    setInstructions(row.instructions);
    setPriority(row.priority);
    setIsActive(row.is_active);
  };

  const cancelEdit = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setTriggerHint('');
    setInstructions('');
    setPriority(0);
    setIsActive(true);
  };

  const save = async () => {
    if (!name.trim() || !triggerHint.trim() || !instructions.trim()) {
      toast.error(t('agents.intelligence.skills.fieldsRequired'));
      return;
    }
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const res = await fetch(
        isNew ? '/api/ai/skills' : `/api/ai/skills/${editing}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            trigger_hint: triggerHint.trim(),
            instructions: instructions.trim(),
            priority,
            is_active: isActive,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(
          isNew
            ? t('agents.intelligence.skills.added')
            : t('agents.intelligence.skills.updated'),
        );
        cancelEdit();
        await fetchRows();
      } else {
        toast.error(data.error ?? t('agents.intelligence.skills.saveFailed'));
      }
    } catch {
      toast.error(t('agents.intelligence.skills.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: SkillRow) => {
    try {
      const res = await fetch(`/api/ai/skills/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !row.is_active }),
      });
      if (res.ok) await fetchRows();
      else {
        const data = await res.json();
        toast.error(data.error ?? t('agents.intelligence.skills.saveFailed'));
      }
    } catch {
      toast.error(t('agents.intelligence.skills.saveFailed'));
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/skills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('agents.intelligence.skills.removed'));
        setRows((r) => r.filter((x) => x.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error ?? t('agents.intelligence.skills.removeFailed'));
      }
    } catch {
      toast.error(t('agents.intelligence.skills.removeFailed'));
    }
  };

  const importWepost = async () => {
    setImporting(true);
    try {
      const existing = new Set(rows.map((r) => r.name));
      let added = 0;
      for (const skill of WEPOST_SKILLS) {
        if (existing.has(skill.name)) continue;
        const res = await fetch('/api/ai/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: skill.name,
            description: skill.description,
            trigger_hint: skill.trigger_hint,
            instructions: skill.instructions,
            priority: skill.priority,
            is_active: true,
          }),
        });
        if (res.ok) added++;
      }
      if (added > 0) {
        toast.success(t('agents.intelligence.skills.imported', { count: added }));
        await fetchRows();
      } else {
        toast.info(t('agents.intelligence.skills.importNone'));
      }
    } catch {
      toast.error(t('agents.intelligence.skills.saveFailed'));
    } finally {
      setImporting(false);
    }
  };

  const activeCount = rows.filter((r) => r.is_active).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-4 w-4 text-primary" />
          {t('agents.intelligence.skills.title')}
        </CardTitle>
        <CardDescription>
          {t('agents.intelligence.skills.description')}
          {!loading && (
            <span className="mt-1 block text-xs">
              {t('agents.intelligence.skills.stats', {
                active: activeCount,
                total: rows.length,
              })}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center py-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> …
          </div>
        ) : (
          <>
            {rows.length === 0 && editing === null && (
              <p className="text-sm text-muted-foreground">
                {t('agents.intelligence.skills.empty')}
              </p>
            )}

            {rows.length > 0 && (
              <ul className="divide-y divide-border rounded-md border border-border">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-start justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground">{row.name}</p>
                      {row.description ? (
                        <p className="text-xs text-muted-foreground">{row.description}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {t('agents.intelligence.skills.triggers')}: {row.trigger_hint}
                      </p>
                    </div>
                    {canEdit && (
                      <span className="flex shrink-0 items-center gap-1">
                        <Switch
                          checked={row.is_active}
                          onCheckedChange={() => void toggleActive(row)}
                          aria-label={row.name}
                        />
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
                  </li>
                ))}
              </ul>
            )}

            {editing !== null ? (
              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="space-y-2">
                  <Label>{t('agents.intelligence.skills.nameLabel')}</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('agents.intelligence.skills.descriptionLabel')}</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('agents.intelligence.skills.triggerLabel')}</Label>
                  <Input
                    value={triggerHint}
                    onChange={(e) => setTriggerHint(e.target.value)}
                    placeholder={t('agents.intelligence.skills.triggerPlaceholder')}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('agents.intelligence.skills.instructionsLabel')}</Label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={6}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('agents.intelligence.skills.priorityLabel')}</Label>
                  <Input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) || 0)}
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} disabled={saving} />
                  <Label>{t('agents.intelligence.skills.activeLabel')}</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                    {t('agents.intelligence.skills.cancel')}
                  </Button>
                  <Button onClick={() => void save()} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('agents.intelligence.skills.save')}
                  </Button>
                </div>
              </div>
            ) : (
              canEdit && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={openNew}>
                    <Plus className="mr-2 h-4 w-4" /> {t('agents.intelligence.skills.add')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void importWepost()}
                    disabled={importing}
                  >
                    {importing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {t('agents.intelligence.skills.importWepost')}
                  </Button>
                </div>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/hooks/use-i18n';
import {
  markWhatsNewSeen,
  shouldShowWhatsNew,
  WHATS_NEW_ITEM_KEYS,
  WHATS_NEW_VERSION,
} from '@/lib/whats-new';

/**
 * One-shot modal after login when `WHATS_NEW_VERSION` is newer than
 * whatever the browser last dismissed. Bump the version in
 * `src/lib/whats-new.ts` (+ i18n bullets) to show it again to everyone.
 */
export function WhatsNewDialog() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Defer one frame so we don't flash over the auth loading state.
    const id = window.setTimeout(() => {
      if (shouldShowWhatsNew()) setOpen(true);
    }, 400);
    return () => window.clearTimeout(id);
  }, []);

  function dismiss() {
    markWhatsNewSeen();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
        else setOpen(true);
      }}
    >
      <DialogContent
        className="bg-popover border-border sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-foreground">
                {t('whatsNew.title')}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {t('whatsNew.versionLabel', { version: WHATS_NEW_VERSION })}
              </p>
            </div>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            {t('whatsNew.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 py-1">
          {WHATS_NEW_ITEM_KEYS.map((key) => (
            <li key={key} className="flex gap-2.5 text-sm text-foreground">
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                aria-hidden
              />
              <span className="leading-relaxed text-muted-foreground">
                {t(`whatsNew.items.${key}`)}
              </span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button type="button" className="w-full sm:w-auto" onClick={dismiss}>
            {t('whatsNew.gotIt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

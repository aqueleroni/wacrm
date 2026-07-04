"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Coins, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/hooks/use-i18n";
import { CURRENCIES, getCurrencyLabel } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SettingsPanelHead } from "./settings-panel-head";

/**
 * Deals settings — account-wide default currency.
 */
export function DealsSettings() {
  const t = useT();
  const supabase = createClient();
  const {
    accountId,
    defaultCurrency,
    canEditSettings,
    profileLoading,
    refreshProfile,
  } = useAuth();

  const [selected, setSelected] = useState(defaultCurrency);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(defaultCurrency);
  }, [defaultCurrency]);

  const dirty = selected !== defaultCurrency;

  async function handleSave() {
    if (!accountId || !dirty) return;
    setSaving(true);
    const { error } = await supabase
      .from("accounts")
      .update({ default_currency: selected })
      .eq("id", accountId);
    if (error) {
      toast.error(t("settings.deals.toast.saveFailed"));
      setSaving(false);
      return;
    }
    await refreshProfile();
    setSaving(false);
    toast.success(t("settings.deals.toast.saved"));
  }

  return (
    <section className="max-w-2xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title={t("settings.deals.title")}
        description={t("settings.deals.description")}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Coins className="size-4 text-primary" />
            {t("settings.deals.defaultCurrency")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("settings.deals.cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:max-w-xs">
            <Label className="text-muted-foreground">
              {t("settings.deals.currency")}
            </Label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={!canEditSettings || profileLoading}
              className="h-9 w-full rounded-lg border border-border bg-muted px-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {getCurrencyLabel(c.code, t)}
                </option>
              ))}
            </select>
            {!canEditSettings && (
              <p className="text-xs text-muted-foreground">
                {t("settings.deals.adminOnly")}
              </p>
            )}
          </div>

          {canEditSettings && (
            <Button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("common.actions.saving")}
                </>
              ) : (
                t("common.actions.save")
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

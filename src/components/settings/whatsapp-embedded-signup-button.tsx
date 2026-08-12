'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Link2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/hooks/use-i18n';

declare global {
  interface Window {
    FB?: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
        autoLogAppEvents?: boolean;
      }) => void;
      login: (
        callback: (response: FbLoginResponse) => void,
        options: Record<string, unknown>,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

interface FbLoginResponse {
  authResponse?: { code?: string };
  status?: string;
}

interface EmbeddedSignupSession {
  phone_number_id?: string;
  waba_id?: string;
  waba_ids?: string[];
  current_step?: string;
  error_message?: string;
  error_code?: string | number;
  session_id?: string;
}

type Props = {
  disabled?: boolean;
  phoneNumberId?: string;
  wabaId?: string;
  onConnected: () => void;
};

const GRAPH_VERSION = 'v26.0';
const SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';
const CONNECT_TIMEOUT_MS = 90_000;

function loadFacebookSdk(appId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));

  const init = () => {
    window.FB?.init({
      appId,
      autoLogAppEvents: true,
      cookie: true,
      xfbml: true,
      version: GRAPH_VERSION,
    });
  };

  if (window.FB) {
    init();
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const prev = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      try {
        prev?.();
      } catch {
        /* ignore */
      }
      init();
      resolve();
    };

    const existing = document.getElementById('facebook-jssdk');
    if (existing) {
      const started = Date.now();
      const tick = () => {
        if (window.FB) {
          init();
          resolve();
          return;
        }
        if (Date.now() - started > 15_000) {
          reject(new Error('Facebook SDK timed out'));
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = SDK_SRC;
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    document.body.appendChild(script);
  });
}

export function WhatsAppEmbeddedSignupButton({
  disabled,
  phoneNumberId,
  wabaId,
  onConnected,
}: Props) {
  const t = useT();
  const [ready, setReady] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [pin, setPin] = useState('');

  const [trace, setTrace] = useState<string[]>([]);

  const sessionRef = useRef<EmbeddedSignupSession>({});
  const pendingCodeRef = useRef<string | null>(null);
  const finishingRef = useRef(false);
  const connectingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Embedded Signup fails silently in a dozen ways (popup blocked, config
   * mismatch, Meta-side ERROR event, expired code). Keep an on-screen trace
   * so a stuck flow can be diagnosed without asking for devtools access.
   */
  const track = useCallback((step: string, detail?: unknown) => {
    const stamp = new Date().toISOString().slice(11, 23);
    const suffix =
      detail === undefined
        ? ''
        : ` ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
    console.info('[wa-embedded-signup]', step, detail ?? '');
    setTrace((prev) => [...prev.slice(-49), `${stamp} ${step}${suffix}`]);
  }, []);

  const clearConnectTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setConnectingSafe = useCallback(
    (value: boolean) => {
      connectingRef.current = value;
      setConnecting(value);
      clearConnectTimer();
      if (value) {
        timeoutRef.current = setTimeout(() => {
          if (!connectingRef.current) return;
          track('timeout', {
            hadCode: Boolean(pendingCodeRef.current),
            session: sessionRef.current,
          });
          finishingRef.current = false;
          pendingCodeRef.current = null;
          connectingRef.current = false;
          setConnecting(false);
          toast.error(t('settings.whatsapp.embeddedSignup.timeout'));
        }, CONNECT_TIMEOUT_MS);
      }
    },
    [clearConnectTimer, t, track],
  );

  const resolveAssets = useCallback((): { phone_number_id: string; waba_id: string } | null => {
    const session = sessionRef.current;
    const phone = session.phone_number_id?.trim() || phoneNumberId?.trim() || '';
    // Multi-WABA flows return `waba_ids` instead of a single `waba_id`.
    const waba =
      session.waba_id?.trim() ||
      session.waba_ids?.[0]?.trim() ||
      wabaId?.trim() ||
      '';
    if (!phone || !waba) return null;
    return { phone_number_id: phone, waba_id: waba };
  }, [phoneNumberId, wabaId]);

  const finishIfReady = useCallback(async () => {
    if (finishingRef.current) return;
    const code = pendingCodeRef.current;
    const assets = resolveAssets();
    if (!code || !assets) return;

    finishingRef.current = true;
    pendingCodeRef.current = null;
    track('exchange:start', {
      phone_number_id: assets.phone_number_id,
      waba_id: assets.waba_id,
      fromSession: Boolean(sessionRef.current.phone_number_id),
    });

    try {
      const res = await fetch('/api/whatsapp/embedded-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          phone_number_id: assets.phone_number_id,
          waba_id: assets.waba_id,
          pin: pin.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        verify_token?: string;
        registration_error?: string | null;
      };
      track('exchange:response', { status: res.status, error: data.error });
      if (!res.ok) {
        toast.error(data.error || t('settings.whatsapp.embeddedSignup.failed'));
        return;
      }
      if (data.registration_error) {
        toast.warning(t('settings.whatsapp.embeddedSignup.savedWithRegisterError'));
      } else {
        toast.success(t('settings.whatsapp.embeddedSignup.success'));
      }
      if (data.verify_token) {
        toast.message(t('settings.whatsapp.embeddedSignup.verifyTokenHint'), {
          description: data.verify_token,
          duration: 12000,
        });
      }
      onConnected();
    } catch (err) {
      track('exchange:network-error', err instanceof Error ? err.message : err);
      toast.error(t('settings.whatsapp.embeddedSignup.failed'));
    } finally {
      finishingRef.current = false;
      setConnectingSafe(false);
    }
  }, [onConnected, pin, resolveAssets, setConnectingSafe, t, track]);

  useEffect(() => {
    return () => clearConnectTimer();
  }, [clearConnectTimer]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/whatsapp/embedded-signup');
        if (!res.ok) return;
        const data = (await res.json()) as {
          configured?: boolean;
          appId?: string | null;
          configId?: string | null;
        };
        if (cancelled) return;
        if (data.configured && data.appId && data.configId) {
          setAppId(data.appId);
          setConfigId(data.configId);
          await loadFacebookSdk(data.appId);
          if (!cancelled) setReady(true);
        }
      } catch {
        /* hide button */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        typeof event.origin !== 'string' ||
        !event.origin.includes('facebook.com')
      ) {
        return;
      }
      try {
        const raw =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (raw?.type !== 'WA_EMBEDDED_SIGNUP') {
          // Log foreign Facebook traffic too: if the dialog talks to us at
          // all but never sends a signup event, that narrows the fault to
          // the Meta-side config rather than this listener.
          if (connectingRef.current) {
            track('fb:message', {
              origin: event.origin,
              type: raw?.type ?? typeof event.data,
            });
          }
          return;
        }

        const eventName = String(raw.event ?? '').toUpperCase();
        const payload = (raw.data ?? {}) as EmbeddedSignupSession;
        track(`meta:${eventName || 'UNKNOWN'}`, payload);

        // Meta reports flow failures as `ERROR`, and user-reported errors
        // ride along a CANCEL carrying `error_message`. Both must unstick
        // the button — otherwise it spins until the timeout.
        const metaError = payload.error_message?.trim();
        if (eventName === 'ERROR' || metaError) {
          pendingCodeRef.current = null;
          setConnectingSafe(false);
          toast.error(
            t('settings.whatsapp.embeddedSignup.metaError', {
              message: metaError || eventName,
            }),
          );
          return;
        }

        if (eventName === 'CANCEL' || eventName === 'CANCELLED') {
          if (connectingRef.current) {
            pendingCodeRef.current = null;
            setConnectingSafe(false);
            toast.message(t('settings.whatsapp.embeddedSignup.cancelled'));
          }
          return;
        }

        if (payload.phone_number_id || payload.waba_id || payload.waba_ids) {
          sessionRef.current = {
            ...sessionRef.current,
            ...payload,
          };
        }

        // Any FINISH_* variant (Cloud API, WABA-only, business-app
        // onboarding, OBO migration) completes the flow.
        if (eventName.startsWith('FINISH') || resolveAssets()) {
          void finishIfReady();
        }
      } catch {
        /* not a WA_EMBEDDED_SIGNUP payload */
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [finishIfReady, resolveAssets, setConnectingSafe, t, track]);

  const launch = useCallback(() => {
    if (!window.FB || !configId) {
      toast.error(t('settings.whatsapp.embeddedSignup.sdkNotReady'));
      return;
    }

    pendingCodeRef.current = null;
    finishingRef.current = false;
    sessionRef.current = {};
    setTrace([]);
    setConnectingSafe(true);
    track('launch', { configId, appId, formPhoneNumberId: phoneNumberId ?? null });

    // The SDK opens its dialog through window.open during this call. Shim it
    // just for that window so we can tell "popup blocked" and "popup opened
    // on the wrong URL" apart from "popup fine, Meta never answered".
    const nativeOpen = window.open;
    let popup: Window | null = null;
    let popupUrl = '';
    window.open = function patchedOpen(
      url?: string | URL,
      target?: string,
      features?: string,
    ) {
      popupUrl = url ? String(url) : '';
      popup = nativeOpen.call(window, url, target, features);
      return popup;
    } as typeof window.open;

    const restoreOpen = () => {
      window.open = nativeOpen;
    };

    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
        track('fb:callback', { status: response.status ?? null, hasCode: Boolean(code) });
        if (!code) {
          setConnectingSafe(false);
          if (response.status === 'connected') {
            toast.error(t('settings.whatsapp.embeddedSignup.noCode'));
          } else {
            toast.message(t('settings.whatsapp.embeddedSignup.cancelled'));
          }
          return;
        }
        pendingCodeRef.current = code;
        // Code often arrives before session postMessage — wait briefly
        // for assets, then finish with form fallbacks if needed.
        window.setTimeout(() => {
          if (!resolveAssets() && connectingRef.current) {
            // keep waiting for WA_EMBEDDED_SIGNUP message (finishIfReady)
            return;
          }
          void finishIfReady();
        }, 400);
        window.setTimeout(() => {
          if (pendingCodeRef.current && connectingRef.current) {
            if (!resolveAssets()) {
              track('assets:missing', sessionRef.current);
              toast.error(t('settings.whatsapp.embeddedSignup.missingAssets'));
              pendingCodeRef.current = null;
              setConnectingSafe(false);
              return;
            }
            void finishIfReady();
          }
        }, 5000);
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        // Shape documented for Embedded Signup v4. `sessionInfoVersion: 3`
        // is what makes the dialog post WA_EMBEDDED_SIGNUP session events
        // back to this window; without it the popup finishes silently.
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      },
    );

    restoreOpen();
    track('popup', {
      opened: Boolean(popup),
      url: popupUrl.slice(0, 400) || null,
    });

    if (!popup) {
      setConnectingSafe(false);
      toast.error(t('settings.whatsapp.embeddedSignup.popupBlocked'));
      return;
    }

    // The SDK's own close detection is unreliable when the dialog errors out,
    // which leaves the button spinning. Watch the handle ourselves.
    const handle = popup as Window;
    const watcher = window.setInterval(() => {
      if (!handle.closed) return;
      window.clearInterval(watcher);
      if (!connectingRef.current) return;
      track('popup:closed', { hadCode: Boolean(pendingCodeRef.current) });
      if (pendingCodeRef.current) return; // exchange already in flight
      setConnectingSafe(false);
      toast.message(t('settings.whatsapp.embeddedSignup.cancelled'));
    }, 700);
  }, [
    appId,
    configId,
    finishIfReady,
    phoneNumberId,
    resolveAssets,
    setConnectingSafe,
    t,
    track,
  ]);

  if (!ready || !appId || !configId) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {t('settings.whatsapp.embeddedSignup.title')}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('settings.whatsapp.embeddedSignup.description')}
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs">
          {t('settings.whatsapp.credentials.pin')}{' '}
          <span className="font-normal">
            {t('settings.whatsapp.credentials.pinOptional')}
          </span>
        </Label>
        <Input
          inputMode="numeric"
          maxLength={6}
          placeholder={t('settings.whatsapp.credentials.pinPlaceholder')}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="bg-muted border-border max-w-[12rem]"
          disabled={connecting || disabled}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={launch}
          disabled={disabled || connecting}
          className="gap-2"
        >
          {connecting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Link2 className="size-4" />
          )}
          {connecting
            ? t('settings.whatsapp.embeddedSignup.connecting')
            : t('settings.whatsapp.embeddedSignup.cta')}
        </Button>
        {connecting && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              pendingCodeRef.current = null;
              finishingRef.current = false;
              setConnectingSafe(false);
            }}
          >
            {t('settings.whatsapp.embeddedSignup.cancel')}
          </Button>
        )}
      </div>
      {trace.length > 0 && (
        <details className="rounded-lg border border-border bg-muted/40 p-2">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            {t('settings.whatsapp.embeddedSignup.diagnostics')}
          </summary>
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-muted-foreground">
            {trace.join('\n')}
          </pre>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="mt-2 gap-2"
            onClick={() => {
              void navigator.clipboard
                .writeText(trace.join('\n'))
                .then(() =>
                  toast.success(
                    t('settings.whatsapp.embeddedSignup.diagnosticsCopied'),
                  ),
                );
            }}
          >
            <Copy className="size-3.5" />
            {t('settings.whatsapp.embeddedSignup.copyDiagnostics')}
          </Button>
        </details>
      )}
    </div>
  );
}

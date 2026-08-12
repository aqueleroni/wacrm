'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Link2 } from 'lucide-react';
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
  current_step?: string;
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
      xfbml: false,
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

  const sessionRef = useRef<EmbeddedSignupSession>({});
  const pendingCodeRef = useRef<string | null>(null);
  const finishingRef = useRef(false);
  const connectingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          finishingRef.current = false;
          pendingCodeRef.current = null;
          connectingRef.current = false;
          setConnecting(false);
          toast.error(t('settings.whatsapp.embeddedSignup.timeout'));
        }, CONNECT_TIMEOUT_MS);
      }
    },
    [clearConnectTimer, t],
  );

  const resolveAssets = useCallback((): { phone_number_id: string; waba_id: string } | null => {
    const phone =
      sessionRef.current.phone_number_id?.trim() || phoneNumberId?.trim() || '';
    const waba = sessionRef.current.waba_id?.trim() || wabaId?.trim() || '';
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
    } catch {
      toast.error(t('settings.whatsapp.embeddedSignup.failed'));
    } finally {
      finishingRef.current = false;
      setConnectingSafe(false);
    }
  }, [onConnected, pin, resolveAssets, setConnectingSafe, t]);

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
        if (raw?.type !== 'WA_EMBEDDED_SIGNUP') return;

        const eventName = String(raw.event ?? '').toUpperCase();
        if (eventName === 'CANCEL' || eventName === 'CANCELLED') {
          if (connectingRef.current) {
            pendingCodeRef.current = null;
            setConnectingSafe(false);
            toast.message(t('settings.whatsapp.embeddedSignup.cancelled'));
          }
          return;
        }

        const payload = (raw.data ?? {}) as EmbeddedSignupSession;
        if (payload.phone_number_id || payload.waba_id) {
          sessionRef.current = {
            ...sessionRef.current,
            ...payload,
          };
        }

        // FINISH (or any payload with ids) + code already received → complete.
        if (
          eventName === 'FINISH' ||
          eventName === 'FINISH_ONLY_WABA' ||
          payload.phone_number_id ||
          payload.waba_id
        ) {
          void finishIfReady();
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [finishIfReady, setConnectingSafe, t]);

  const launch = useCallback(() => {
    if (!window.FB || !configId) {
      toast.error(t('settings.whatsapp.embeddedSignup.sdkNotReady'));
      return;
    }

    pendingCodeRef.current = null;
    finishingRef.current = false;
    sessionRef.current = {};
    setConnectingSafe(true);

    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
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
        // Must match Meta dashboard: ES v4 + sessionInfoVersion 3
        // (see onboard URL extras).
        extras: {
          setup: {},
          sessionInfoVersion: '3',
          version: 'v4',
        },
      },
    );
  }, [configId, finishIfReady, resolveAssets, setConnectingSafe, t]);

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
    </div>
  );
}

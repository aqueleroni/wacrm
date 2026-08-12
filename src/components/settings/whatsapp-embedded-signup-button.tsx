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
  event?: string;
}

type Props = {
  disabled?: boolean;
  /** Fallback when reconnecting — form fields already filled. */
  phoneNumberId?: string;
  wabaId?: string;
  onConnected: () => void;
};

const GRAPH_VERSION = 'v26.0';
const SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';
const ASSET_WAIT_MS = 8000;
const CONNECT_TIMEOUT_MS = 120_000;

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
        /* ignore prior init errors */
      }
      init();
      resolve();
    };

    const existing = document.getElementById('facebook-jssdk');
    if (existing) {
      // Script already injecting — wait for FB global.
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

function waitForAssets(
  getSession: () => EmbeddedSignupSession,
  fallback: { phone_number_id?: string; waba_id?: string },
  timeoutMs: number,
): Promise<{ phone_number_id: string; waba_id: string }> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const s = getSession();
      const phone = s.phone_number_id || fallback.phone_number_id;
      const waba = s.waba_id || fallback.waba_id;
      if (phone && waba) {
        resolve({ phone_number_id: phone, waba_id: waba });
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error('missing_assets'));
        return;
      }
      window.setTimeout(tick, 150);
    };
    tick();
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
  const connectingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setConnectingSafe = useCallback((value: boolean) => {
    connectingRef.current = value;
    setConnecting(value);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (value) {
      timeoutRef.current = setTimeout(() => {
        if (!connectingRef.current) return;
        connectingRef.current = false;
        setConnecting(false);
        toast.error(t('settings.whatsapp.embeddedSignup.timeout'));
      }, CONNECT_TIMEOUT_MS);
    }
  }, [t]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
        /* leave button hidden */
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

        const eventName = String(raw.event ?? raw.data?.event ?? '').toUpperCase();
        if (eventName === 'CANCEL' || eventName === 'CANCELLED') {
          if (connectingRef.current) {
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
      } catch {
        /* ignore non-JSON */
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setConnectingSafe, t]);

  const finish = useCallback(
    async (code: string) => {
      try {
        const assets = await waitForAssets(
          () => sessionRef.current,
          {
            phone_number_id: phoneNumberId?.trim() || undefined,
            waba_id: wabaId?.trim() || undefined,
          },
          ASSET_WAIT_MS,
        );

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
      } catch (err) {
        if (err instanceof Error && err.message === 'missing_assets') {
          toast.error(t('settings.whatsapp.embeddedSignup.missingAssets'));
        } else {
          toast.error(t('settings.whatsapp.embeddedSignup.failed'));
        }
      } finally {
        setConnectingSafe(false);
      }
    },
    [onConnected, phoneNumberId, pin, setConnectingSafe, t, wabaId],
  );

  const launch = useCallback(() => {
    if (!window.FB || !configId) {
      toast.error(t('settings.whatsapp.embeddedSignup.sdkNotReady'));
      return;
    }
    setConnectingSafe(true);
    sessionRef.current = {};
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
        void finish(code);
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      },
    );
  }, [configId, finish, setConnectingSafe, t]);

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
    </div>
  );
}

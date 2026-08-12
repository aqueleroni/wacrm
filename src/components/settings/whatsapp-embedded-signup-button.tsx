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
  onConnected: () => void;
};

const GRAPH_VERSION = 'v26.0';
const SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';

function loadFacebookSdk(appId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.FB) {
    window.FB.init({
      appId,
      autoLogAppEvents: true,
      cookie: true,
      xfbml: false,
      version: GRAPH_VERSION,
    });
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        autoLogAppEvents: true,
        cookie: true,
        xfbml: false,
        version: GRAPH_VERSION,
      });
      resolve();
    };

    const existing = document.getElementById('facebook-jssdk');
    if (existing) return;

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

export function WhatsAppEmbeddedSignupButton({ disabled, onConnected }: Props) {
  const t = useT();
  const [ready, setReady] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [pin, setPin] = useState('');
  const sessionRef = useRef<EmbeddedSignupSession>({});

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
        const payload = (raw.data ?? raw) as EmbeddedSignupSession;
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
  }, []);

  const finish = useCallback(
    async (code: string) => {
      const { phone_number_id, waba_id } = sessionRef.current;
      if (!phone_number_id || !waba_id) {
        toast.error(t('settings.whatsapp.embeddedSignup.missingAssets'));
        setConnecting(false);
        return;
      }

      try {
        const res = await fetch('/api/whatsapp/embedded-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            phone_number_id,
            waba_id,
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
        setConnecting(false);
      }
    },
    [onConnected, pin, t],
  );

  const launch = useCallback(() => {
    if (!window.FB || !configId) {
      toast.error(t('settings.whatsapp.embeddedSignup.sdkNotReady'));
      return;
    }
    setConnecting(true);
    sessionRef.current = {};
    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setConnecting(false);
          if (response.status !== 'connected') {
            toast.message(t('settings.whatsapp.embeddedSignup.cancelled'));
          } else {
            toast.error(t('settings.whatsapp.embeddedSignup.noCode'));
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
  }, [configId, finish, t]);

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

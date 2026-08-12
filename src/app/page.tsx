import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing/landing-page';
import { createClient } from '@/lib/supabase/server';
import { createTranslator, messagesEn, messagesPtBR } from '@/i18n';
import { getLocale } from '@/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(getLocale(), {
    en: messagesEn,
    'pt-BR': messagesPtBR,
  });
  return {
    title: t('landing.meta.title'),
    description: t('landing.meta.description'),
    robots: { index: true, follow: true },
  };
}

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}

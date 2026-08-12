'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  Inbox,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AppLogo } from '@/components/brand/app-logo';
import { useT } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

const CONTACT_MAIL = 'mailto:contato@agenciawepost.com?subject=Wp%20CRM';

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        'translate-y-5 opacity-0 transition-[opacity,transform] duration-700 ease-out',
        visible && 'translate-y-0 opacity-100',
        className,
      )}
      style={{ transitionDelay: visible ? `${delayMs}ms` : undefined }}
    >
      {children}
    </div>
  );
}

function InboxMock({
  inboxLabel,
  openLabel,
  assignedLabel,
  preview,
  reply,
}: {
  inboxLabel: string;
  openLabel: string;
  assignedLabel: string;
  preview: string;
  reply: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_30%_20%,oklch(90%_0.05_165/0.55),transparent_55%),radial-gradient(ellipse_at_80%_80%,oklch(92%_0.03_90/0.8),transparent_50%)] blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border border-[oklch(88%_0.01_90)] bg-white/90 shadow-[0_24px_60px_-28px_oklch(20%_0.02_90/0.45)] backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-[oklch(92%_0.006_90)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[oklch(22%_0.01_90)]">
            <Inbox className="size-4 text-[oklch(42%_0.11_165)]" />
            {inboxLabel}
          </div>
          <span className="rounded-full bg-[oklch(94%_0.04_165)] px-2.5 py-0.5 text-xs font-semibold text-[oklch(36%_0.1_165)]">
            {openLabel}
          </span>
        </div>
        <div className="grid grid-cols-[0.95fr_1.15fr]">
          <div className="border-r border-[oklch(92%_0.006_90)] bg-[oklch(98.5%_0.004_90)] p-3">
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-[oklch(42%_0.11_165/0.2)]">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">Ana Souza</span>
                <span className="text-[10px] text-[oklch(50%_0.01_90)]">2m</span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-[oklch(42%_0.01_90)]">
                {preview}
              </p>
            </div>
            <div className="mt-2 rounded-xl px-3 py-2.5 opacity-55">
              <div className="mb-1 text-sm font-medium">Carlos Lima</div>
              <p className="truncate text-xs text-[oklch(45%_0.01_90)]">
                Obrigado pelo retorno…
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between text-xs text-[oklch(48%_0.01_90)]">
              <span>Ana Souza</span>
              <span>
                {assignedLabel}: <strong className="text-[oklch(25%_0.01_90)]">você</strong>
              </span>
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-[oklch(95%_0.01_90)] px-3.5 py-2.5 text-sm leading-snug text-[oklch(28%_0.01_90)]">
              {preview}
            </div>
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[oklch(42%_0.11_165)] px-3.5 py-2.5 text-sm leading-snug text-white shadow-sm">
              {reply}
            </div>
            <div className="mt-auto flex items-center gap-2 rounded-xl border border-[oklch(90%_0.008_90)] bg-[oklch(98%_0.004_90)] px-3 py-2 text-xs text-[oklch(50%_0.01_90)]">
              <Bot className="size-3.5 text-[oklch(42%_0.11_165)]" />
              <span className="truncate">IA · rascunho sugerido</span>
              <Sparkles className="ml-auto size-3.5 animate-pulse text-[oklch(50%_0.1_165)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const t = useT();
  const [openFaq, setOpenFaq] = useState(0);
  const [navSolid, setNavSolid] = useState(false);
  const faqBaseId = useId();

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    t('landing.features.items.api'),
    t('landing.features.items.inbox'),
    t('landing.features.items.contacts'),
    t('landing.features.items.pipelines'),
    t('landing.features.items.broadcasts'),
    t('landing.features.items.automations'),
    t('landing.features.items.agents'),
    t('landing.features.items.branding'),
    t('landing.features.items.roles'),
  ];

  const steps = [
    t('landing.how.steps.s1'),
    t('landing.how.steps.s2'),
    t('landing.how.steps.s3'),
    t('landing.how.steps.s4'),
  ];

  const solution = [
    {
      icon: MessageSquare,
      title: t('landing.solution.blocks.inbox.title'),
      desc: t('landing.solution.blocks.inbox.desc'),
    },
    {
      icon: TrendingUp,
      title: t('landing.solution.blocks.sales.title'),
      desc: t('landing.solution.blocks.sales.desc'),
    },
    {
      icon: Bot,
      title: t('landing.solution.blocks.ai.title'),
      desc: t('landing.solution.blocks.ai.desc'),
    },
  ];

  const faqs = [
    { q: t('landing.faq.items.q1.q'), a: t('landing.faq.items.q1.a') },
    { q: t('landing.faq.items.q2.q'), a: t('landing.faq.items.q2.a') },
    { q: t('landing.faq.items.q3.q'), a: t('landing.faq.items.q3.a') },
    { q: t('landing.faq.items.q4.q'), a: t('landing.faq.items.q4.a') },
  ];

  const proFeatures = [
    t('landing.plans.pro.features.f1'),
    t('landing.plans.pro.features.f2'),
    t('landing.plans.pro.features.f3'),
    t('landing.plans.pro.features.f4'),
    t('landing.plans.pro.features.f5'),
    t('landing.plans.pro.features.f6'),
  ];

  const businessFeatures = [
    t('landing.plans.business.features.f1'),
    t('landing.plans.business.features.f2'),
    t('landing.plans.business.features.f3'),
    t('landing.plans.business.features.f4'),
    t('landing.plans.business.features.f5'),
  ];

  return (
    <div className="min-h-dvh bg-[oklch(98%_0.004_90)] font-sans text-[oklch(20%_0.008_90)] antialiased">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-1/4 top-[-10%] h-[55vh] w-[70vw] animate-[landingDrift_18s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,oklch(90%_0.06_165/0.35),transparent_70%)]" />
        <div className="absolute -right-1/5 top-[20%] h-[40vh] w-[50vw] animate-[landingDrift_22s_ease-in-out_infinite_reverse] rounded-full bg-[radial-gradient(circle,oklch(93%_0.03_85/0.5),transparent_70%)]" />
      </div>

      <header
        className={cn(
          'sticky top-0 z-40 transition-[background,box-shadow,backdrop-filter] duration-300',
          navSolid
            ? 'border-b border-[oklch(90%_0.008_90)] bg-[oklch(98%_0.004_90)/0.85] shadow-sm backdrop-blur-md'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[oklch(42%_0.11_165)]">
              <AppLogo size={20} invert className="object-contain" />
            </span>
            <span className="text-lg font-bold tracking-tight">{t('landing.hero.brand')}</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#solucao" className="text-sm font-medium text-[oklch(35%_0.01_90)] transition-colors hover:text-[oklch(42%_0.11_165)]">
              {t('landing.nav.features')}
            </a>
            <a href="#planos" className="text-sm font-medium text-[oklch(35%_0.01_90)] transition-colors hover:text-[oklch(42%_0.11_165)]">
              {t('landing.nav.plans')}
            </a>
            <a href="#faq" className="text-sm font-medium text-[oklch(35%_0.01_90)] transition-colors hover:text-[oklch(42%_0.11_165)]">
              {t('landing.nav.faq')}
            </a>
            <Link href="/login" className="text-sm font-semibold text-[oklch(20%_0.008_90)]">
              {t('landing.nav.login')}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[oklch(42%_0.11_165)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[oklch(36%_0.11_165)]"
            >
              {t('landing.nav.cta')}
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/login" className="text-sm font-semibold">
              {t('landing.nav.login')}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[oklch(42%_0.11_165)] px-3 py-2 text-sm font-semibold text-white"
            >
              {t('landing.nav.cta')}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24 lg:pt-16">
            <div className="animate-[landingFadeUp_0.8s_ease-out_both]">
              <p className="mb-5 text-sm font-semibold tracking-wide text-[oklch(42%_0.11_165)]">
                {t('landing.hero.eyebrow')}
              </p>
              <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                <span className="block text-[oklch(42%_0.11_165)]">{t('landing.hero.brand')}</span>
                <span className="mt-2 block">{t('landing.hero.title')}</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-[oklch(38%_0.01_90)] sm:text-xl">
                {t('landing.hero.subtitle')}
              </p>
              <p className="mt-3 max-w-lg text-base text-[oklch(48%_0.01_90)]">
                {t('landing.hero.support')}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-[oklch(42%_0.11_165)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_12px_30px_-12px_oklch(42%_0.11_165/0.7)] transition-[transform,background] hover:-translate-y-0.5 hover:bg-[oklch(36%_0.11_165)]"
                >
                  {t('landing.hero.ctaPrimary')}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl border border-[oklch(88%_0.008_90)] bg-white/70 px-6 py-3.5 text-base font-semibold text-[oklch(20%_0.008_90)] backdrop-blur transition-colors hover:bg-white"
                >
                  {t('landing.hero.ctaSecondary')}
                </Link>
              </div>
            </div>
            <div className="animate-[landingFadeUp_0.9s_ease-out_0.12s_both]">
              <InboxMock
                inboxLabel={t('landing.mock.inbox')}
                openLabel={t('landing.mock.open')}
                assignedLabel={t('landing.mock.assigned')}
                preview={t('landing.mock.preview')}
                reply={t('landing.mock.reply')}
              />
            </div>
          </div>
        </section>

        <section className="border-t border-[oklch(91%_0.006_90)]">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">
                {t('landing.problem.title')}
              </h2>
            </Reveal>
            <Reveal delayMs={80}>
              <div className="space-y-3 text-lg text-[oklch(38%_0.01_90)]">
                <p>{t('landing.problem.line1')}</p>
                <p>{t('landing.problem.line2')}</p>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="solucao" className="border-t border-[oklch(91%_0.006_90)] scroll-mt-24">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <Reveal>
              <h2 className="mb-10 max-w-2xl text-3xl font-semibold tracking-tight sm:text-[2rem]">
                {t('landing.solution.title')}
              </h2>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {solution.map((block, i) => (
                <Reveal key={block.title} delayMs={i * 90}>
                  <div className="group h-full rounded-2xl border border-[oklch(91%_0.006_90)] bg-white/80 p-7 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-28px_oklch(20%_0.02_90/0.5)]">
                    <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-[oklch(94%_0.03_165)] text-[oklch(42%_0.11_165)] transition-transform duration-300 group-hover:scale-105">
                      <block.icon className="size-5" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{block.title}</h3>
                    <p className="text-sm leading-relaxed text-[oklch(42%_0.01_90)]">{block.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[oklch(91%_0.006_90)]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <Reveal>
              <h2 className="mb-8 text-3xl font-semibold tracking-tight sm:text-[2rem]">
                {t('landing.features.title')}
              </h2>
            </Reveal>
            <Reveal>
              <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[oklch(91%_0.006_90)] bg-[oklch(91%_0.006_90)] sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-3 bg-[oklch(98%_0.004_90)] px-5 py-4 text-sm font-medium sm:bg-white/95"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-[oklch(55%_0.12_165)]" />
                    {feat}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-[oklch(91%_0.006_90)]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <Reveal>
              <h2 className="mb-10 text-3xl font-semibold tracking-tight sm:text-[2rem]">
                {t('landing.how.title')}
              </h2>
            </Reveal>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <Reveal key={step} delayMs={i * 70}>
                  <div>
                    <div className="mb-3 font-bold tabular-nums text-[oklch(42%_0.11_165)]">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="text-base font-semibold sm:text-lg">{step}</h3>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="border-t border-[oklch(91%_0.006_90)] scroll-mt-24">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">
                {t('landing.plans.title')}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-[oklch(50%_0.01_90)]">
                {t('landing.plans.subtitle')}
              </p>
            </Reveal>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <Reveal>
                <div className="relative flex h-full flex-col rounded-2xl border-2 border-[oklch(42%_0.11_165)] bg-white p-8 shadow-[0_20px_50px_-30px_oklch(42%_0.11_165/0.45)]">
                  <span className="absolute -top-3 left-8 rounded-full bg-[oklch(42%_0.11_165)] px-3 py-1 text-xs font-semibold text-white">
                    {t('landing.plans.pro.badge')}
                  </span>
                  <h3 className="text-xl font-semibold">{t('landing.plans.pro.name')}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">
                      {t('landing.plans.pro.price')}
                    </span>
                    <span className="text-sm text-[oklch(50%_0.01_90)]">
                      {t('landing.plans.pro.period')}
                    </span>
                  </div>
                  <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                    {proFeatures.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-[oklch(35%_0.01_90)]">
                        <Check className="mt-0.5 size-4 shrink-0 text-[oklch(48%_0.11_165)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-xs italic text-[oklch(52%_0.01_90)]">
                    {t('landing.plans.pro.note')}
                  </p>
                  <Link
                    href="/signup"
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[oklch(42%_0.11_165)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[oklch(36%_0.11_165)]"
                  >
                    {t('landing.plans.pro.cta')}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Reveal>
              <Reveal delayMs={100}>
                <div className="flex h-full flex-col rounded-2xl border border-[oklch(91%_0.006_90)] bg-white/90 p-8">
                  <h3 className="text-xl font-semibold">{t('landing.plans.business.name')}</h3>
                  <div className="mt-2 text-3xl font-bold tracking-tight">
                    {t('landing.plans.business.price')}
                  </div>
                  <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                    {businessFeatures.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-[oklch(35%_0.01_90)]">
                        <Check className="mt-0.5 size-4 shrink-0 text-[oklch(48%_0.11_165)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-xs italic text-[oklch(52%_0.01_90)]">
                    {t('landing.plans.business.note')}
                  </p>
                  <a
                    href={CONTACT_MAIL}
                    className="mt-5 inline-flex items-center justify-center rounded-xl border border-[oklch(85%_0.008_90)] px-4 py-3 text-sm font-semibold transition-colors hover:bg-[oklch(96%_0.004_90)]"
                  >
                    {t('landing.plans.business.cta')}
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="border-t border-[oklch(91%_0.006_90)]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <Reveal>
              <blockquote className="max-w-3xl text-2xl font-medium leading-snug tracking-tight text-[oklch(25%_0.008_90)] sm:text-[1.65rem]">
                “{t('landing.quote.text')}”
              </blockquote>
            </Reveal>
          </div>
        </section>

        <section id="faq" className="border-t border-[oklch(91%_0.006_90)] scroll-mt-24">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
            <Reveal>
              <h2 className="mb-8 text-3xl font-semibold tracking-tight sm:text-[2rem]">
                {t('landing.faq.title')}
              </h2>
            </Reveal>
            <div className="divide-y divide-[oklch(91%_0.006_90)]">
              {faqs.map((faq, i) => {
                const open = openFaq === i;
                const panelId = `${faqBaseId}-panel-${i}`;
                return (
                  <Reveal key={faq.q} delayMs={i * 40}>
                    <div>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-semibold"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpenFaq(open ? -1 : i)}
                      >
                        {faq.q}
                        <span className="text-xl font-normal text-[oklch(50%_0.01_90)]">
                          {open ? '−' : '+'}
                        </span>
                      </button>
                      <div
                        id={panelId}
                        className={cn(
                          'grid transition-[grid-template-rows] duration-300 ease-out',
                          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        )}
                      >
                        <div className="overflow-hidden">
                          <p className="pb-5 text-sm leading-relaxed text-[oklch(42%_0.01_90)]">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-[oklch(91%_0.006_90)]">
          <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-[2.1rem]">
                {t('landing.finalCta.title')}
              </h2>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-[oklch(42%_0.11_165)] px-7 py-3.5 text-base font-semibold text-white transition-[transform,background] hover:-translate-y-0.5 hover:bg-[oklch(36%_0.11_165)]"
                >
                  {t('landing.finalCta.primary')}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl border border-[oklch(88%_0.008_90)] bg-white/80 px-7 py-3.5 text-base font-semibold transition-colors hover:bg-white"
                >
                  {t('landing.finalCta.secondary')}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[oklch(91%_0.006_90)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-[oklch(50%_0.01_90)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="font-bold text-[oklch(20%_0.008_90)]">{t('landing.hero.brand')}</div>
          <div className="flex flex-wrap gap-5">
            <a href={CONTACT_MAIL} className="transition-colors hover:text-[oklch(42%_0.11_165)]">
              {t('landing.footer.contact')}
            </a>
            <Link href="/login" className="transition-colors hover:text-[oklch(42%_0.11_165)]">
              {t('landing.footer.login')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

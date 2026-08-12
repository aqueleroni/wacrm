export const landing = {
  meta: {
    title: 'WhatsApp Business + CRM',
    description:
      'Shared inbox, pipeline, automations and an AI agent — white-label for your brand.',
  },
  nav: {
    features: 'Features',
    plans: 'Plans',
    faq: 'FAQ',
    login: 'Log in',
    cta: 'Create account',
  },
  hero: {
    brand: 'Wp CRM',
    eyebrow: 'WhatsApp Cloud API · official Meta',
    title: 'WhatsApp Business + CRM in one place',
    subtitle: 'Shared inbox, pipeline, automations and an AI agent.',
    support:
      'Serve customers on WhatsApp with your team, pipelines and smart replies — white-label for your brand.',
    ctaPrimary: 'Create account',
    ctaSecondary: 'Log in',
  },
  problem: {
    title: 'Support is scattered today',
    line1: 'Phone, spreadsheet, sticky notes.',
    line2: 'Leads slip, follow-ups lag, nobody knows who replied.',
  },
  solution: {
    title: 'Connected from first contact to close',
    blocks: {
      inbox: {
        title: 'Unified inbox',
        desc: 'Every WhatsApp thread in one panel, with assignment and status.',
      },
      sales: {
        title: 'Sales in the same place',
        desc: 'Contacts, funnel and deals tied to the conversation.',
      },
      ai: {
        title: 'Automation + AI',
        desc: 'Flows, templates, broadcasts and an agent with memory and skills — approved by you.',
      },
    },
  },
  features: {
    title: 'Features',
    items: {
      api: 'WhatsApp Cloud API (official Meta)',
      inbox: 'Shared inbox + assignment',
      contacts: 'Contacts, tags, notes',
      pipelines: 'Pipelines / deals',
      broadcasts: 'Broadcasts and templates',
      automations: 'Automations and flows',
      agents: 'AI agent (playground, knowledge, intelligence)',
      branding: 'White-label (logo, name, accent per account)',
      roles: 'Multi-user (owner, admin, agent, viewer)',
    },
  },
  how: {
    title: 'How it works',
    steps: {
      s1: 'Create your account',
      s2: 'Connect WhatsApp Business',
      s3: 'Invite the team',
      s4: 'Serve, sell and automate',
    },
  },
  plans: {
    title: 'Plans',
    subtitle: 'No free plan — pick what fits your operation.',
    pro: {
      name: 'Pro',
      price: 'Contact us',
      period: '/ month',
      badge: 'Most popular',
      note: 'Sales and support teams',
      cta: 'Start with Pro',
      features: {
        f1: 'Multiple users',
        f2: 'Unlimited pipelines',
        f3: 'Broadcasts + templates',
        f4: 'Automations and flows',
        f5: 'AI (drafts + auto-reply)',
        f6: 'White-label',
      },
    },
    business: {
      name: 'Business',
      price: 'Contact us',
      period: '',
      note: 'Agencies and larger ops',
      cta: 'Talk to the team',
      features: {
        f1: 'Everything in Pro',
        f2: 'Users at scale',
        f3: 'Advanced AI memory and skills',
        f4: 'Priority onboarding',
        f5: 'Custom domain and branding',
      },
    },
  },
  quote: {
    text: 'Used by the Wepost team to handle WhatsApp leads with CRM and AI.',
  },
  faq: {
    title: 'FAQ',
    items: {
      q1: {
        q: 'Is it official Meta?',
        a: 'Yes — WhatsApp Cloud API. No unofficial libraries.',
      },
      q2: {
        q: 'Do I need the phone app?',
        a: 'Not for day-to-day CRM use: the number lives on the API. Optional coexistence with the Business app is possible.',
      },
      q3: {
        q: 'Can I use my brand?',
        a: 'Yes. Per-account white-label: name, logo and accent color.',
      },
      q4: {
        q: 'Does AI reply on its own?',
        a: 'Only if you enable it. Human handoff is built in, and memories need your approval.',
      },
    },
  },
  finalCta: {
    title: 'Ready to centralize WhatsApp?',
    primary: 'Create account',
    secondary: 'I already have an account — Log in',
  },
  footer: {
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    login: 'Log in',
  },
  mock: {
    inbox: 'Inbox',
    open: 'Open',
    assigned: 'You',
    preview: 'Hi, I want a quote for a website…',
    reply: 'Sure — what’s the timeline and project type?',
  },
} as const;

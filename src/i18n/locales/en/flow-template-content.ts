/**
 * Localized default copy for starter flow templates.
 * Applied when cloning a template so node text matches the UI locale.
 */

export interface FlowTemplateNodeContent {
  text?: string;
  footer_text?: string;
  button_label?: string;
  prompt_text?: string;
  note?: string;
  /** reply_id → button/row title */
  buttonTitles?: Record<string, string>;
  /** section index → { title?, rowTitles?: Record<reply_id, string> } */
  sections?: Array<{
    title?: string;
    rowTitles?: Record<string, string>;
  }>;
}

export interface FlowTemplateContent {
  name?: string;
  description?: string;
  nodes: Record<string, FlowTemplateNodeContent>;
}

export const flowTemplateContent: Record<string, FlowTemplateContent> = {
  welcome_menu: {
    name: 'Welcome menu',
    description:
      "Greet customers who type a keyword and route them to the right agent based on whether they're new or existing.",
    nodes: {
      welcome: {
        text: 'Hi! 👋 Welcome to support. Are you an existing customer or new here?',
        footer_text: 'Tap a button below to continue.',
        buttonTitles: {
          existing: 'Existing customer',
          new: 'New customer',
        },
      },
      existing_handoff: {
        note: 'Existing customer needs assistance — please check account history before replying.',
      },
      new_handoff: {
        note: 'New customer — share pricing + onboarding link.',
      },
    },
  },
  faq_bot: {
    name: 'FAQ bot',
    description:
      'Answer common questions automatically. Customer picks a topic from a list; the bot replies with the answer and ends.',
    nodes: {
      topics: {
        text: 'What can I help you with?',
        button_label: 'View topics',
        sections: [
          {
            title: 'Common questions',
            rowTitles: {
              hours: 'Opening hours',
              pricing: 'Pricing',
              refunds: 'Refund policy',
            },
          },
          {
            title: 'Other',
            rowTitles: {
              human: 'Talk to a human',
            },
          },
        ],
      },
      answer_hours: {
        text: "We're open Mon–Fri, 9am–6pm local time. Weekend support is limited to urgent issues.",
      },
      answer_pricing: {
        text: 'Our pricing starts at $9/mo. Visit https://example.com/pricing for the full breakdown.',
      },
      answer_refunds: {
        text: "Refunds are honored within 30 days of purchase. Reply with your order number and we'll process it.",
      },
      human_handoff: {
        note: 'Customer asked to talk to a human from the FAQ bot.',
      },
    },
  },
  lead_capture: {
    name: 'Lead capture',
    description:
      'Greet first-time inbounds, capture name + email + company, then hand off to sales with the answers in the note.',
    nodes: {
      intro: {
        text: "Welcome! 👋 I'll ask a few quick questions so we can get you to the right person.",
      },
      ask_name: {
        prompt_text: "What's your name?",
      },
      ask_email: {
        prompt_text: "Thanks {{vars.name}}! What's your work email?",
      },
      ask_company: {
        prompt_text: "Almost done — what's your company name?",
      },
      handoff: {
        note: 'New lead — name={{vars.name}}, email={{vars.email}}, company={{vars.company}}.',
      },
    },
  },
};

/**
 * Textos padrão localizados dos modelos de fluxo (pt-BR).
 */

import type { FlowTemplateContent } from '../en/flow-template-content';

export const flowTemplateContent: Record<string, FlowTemplateContent> = {
  welcome_menu: {
    name: 'Menu de boas-vindas',
    description:
      'Cumprimente clientes que digitam uma palavra-chave e encaminhe para o agente certo conforme sejam novos ou existentes.',
    nodes: {
      welcome: {
        text: 'Olá! 👋 Bem-vindo ao suporte. Você já é cliente ou é novo por aqui?',
        footer_text: 'Toque em um botão abaixo para continuar.',
        buttonTitles: {
          existing: 'Cliente existente',
          new: 'Novo cliente',
        },
      },
      existing_handoff: {
        note: 'Cliente existente precisa de ajuda — verifique o histórico da conta antes de responder.',
      },
      new_handoff: {
        note: 'Novo cliente — envie preços e link de onboarding.',
      },
    },
  },
  faq_bot: {
    name: 'Bot de FAQ',
    description:
      'Responda perguntas comuns automaticamente. O cliente escolhe um tópico na lista; o bot responde e encerra.',
    nodes: {
      topics: {
        text: 'Como posso ajudar?',
        button_label: 'Ver tópicos',
        sections: [
          {
            title: 'Perguntas frequentes',
            rowTitles: {
              hours: 'Horário de atendimento',
              pricing: 'Preços',
              refunds: 'Política de reembolso',
            },
          },
          {
            title: 'Outros',
            rowTitles: {
              human: 'Falar com um humano',
            },
          },
        ],
      },
      answer_hours: {
        text: 'Atendemos de seg a sex, 9h–18h. Nos fins de semana, apenas casos urgentes.',
      },
      answer_pricing: {
        text: 'Nossos planos começam em R$ 49/mês. Veja https://example.com/precos para detalhes.',
      },
      answer_refunds: {
        text: 'Reembolsos em até 30 dias após a compra. Responda com o número do pedido para processarmos.',
      },
      human_handoff: {
        note: 'Cliente pediu para falar com um humano pelo bot de FAQ.',
      },
    },
  },
  lead_capture: {
    name: 'Captura de leads',
    description:
      'Cumprimente primeiros contatos, capture nome + e-mail + empresa e transfira para vendas com as respostas na nota.',
    nodes: {
      intro: {
        text: 'Bem-vindo! 👋 Vou fazer algumas perguntas rápidas para te encaminhar à pessoa certa.',
      },
      ask_name: {
        prompt_text: 'Qual é o seu nome?',
      },
      ask_email: {
        prompt_text: 'Obrigado, {{vars.name}}! Qual é o seu e-mail profissional?',
      },
      ask_company: {
        prompt_text: 'Quase lá — qual é o nome da sua empresa?',
      },
      handoff: {
        note: 'Novo lead — nome={{vars.name}}, email={{vars.email}}, empresa={{vars.company}}.',
      },
    },
  },
};

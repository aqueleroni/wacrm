export const notifications = {
  title: 'Notificações',
  subtitle: 'Conversas atribuídas a você por colegas aparecem aqui.',
  actions: {
    markAllRead: 'Marcar tudo como lido',
    markRead: 'Marcar como lido',
  },
  empty: {
    title: 'Nenhuma notificação ainda',
    hint: 'Você verá um alerta aqui quando alguém atribuir uma conversa a você.',
  },
  unread: 'Não lida',
  types: {
    conversationAssigned: 'Conversa atribuída',
  },
  toast: {
    markReadFailed: 'Falha ao marcar notificação como lida',
    markAllFailed: 'Falha ao marcar tudo como lido',
  },
} as const;

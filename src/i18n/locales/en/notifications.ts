export const notifications = {
  title: 'Notifications',
  subtitle: 'Conversations other teammates assign to you show up here.',
  actions: {
    markAllRead: 'Mark all as read',
    markRead: 'Mark as read',
  },
  empty: {
    title: 'No notifications yet',
    hint: "You'll see an alert here when someone assigns you a conversation.",
  },
  unread: 'Unread',
  types: {
    conversationAssigned: 'Conversation assigned',
  },
  toast: {
    markReadFailed: 'Failed to mark notification as read',
    markAllFailed: 'Failed to mark all as read',
  },
} as const;

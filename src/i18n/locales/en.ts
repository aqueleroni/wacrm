import { flattenMessages } from '@/i18n/translate';

import { common } from './en/common';
import { nav } from './en/nav';
import { auth } from './en/auth';
import { settings } from './en/settings';
import { dashboard } from './en/dashboard';
import { contacts } from './en/contacts';
import { inbox } from './en/inbox';
import { pipelines } from './en/pipelines';
import { broadcasts } from './en/broadcasts';
import { automations } from './en/automations';
import { flows } from './en/flows';
import { agents } from './en/agents';
import { notifications } from './en/notifications';
import { join } from './en/join';
import { theme } from './en/theme';
import { currency } from './en/currency';
import { interactive } from './en/interactive';

const nested = {
  common,
  nav,
  auth,
  settings,
  dashboard,
  contacts,
  inbox,
  pipelines,
  broadcasts,
  automations,
  flows,
  agents,
  notifications,
  join,
  theme,
  currency,
  interactive,
};

export const messagesEn = flattenMessages(nested);

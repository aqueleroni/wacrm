import { flattenMessages } from '@/i18n/translate';

import { common } from './pt-BR/common';
import { nav } from './pt-BR/nav';
import { auth } from './pt-BR/auth';
import { settings } from './pt-BR/settings';
import { dashboard } from './pt-BR/dashboard';
import { contacts } from './pt-BR/contacts';
import { inbox } from './pt-BR/inbox';
import { pipelines } from './pt-BR/pipelines';
import { broadcasts } from './pt-BR/broadcasts';
import { automations } from './pt-BR/automations';
import { flows } from './pt-BR/flows';
import { agents } from './pt-BR/agents';
import { notifications } from './pt-BR/notifications';
import { join } from './pt-BR/join';
import { theme } from './pt-BR/theme';
import { currency } from './pt-BR/currency';
import { interactive } from './pt-BR/interactive';

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

export const messagesPtBR = flattenMessages(nested);

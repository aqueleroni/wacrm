export const join = {
  loading: 'Verificando convite…',
  invite: {
    title: 'Você foi convidado para {account}',
    role: 'Você entrará como {role}',
    validUntil: 'Link válido até {date}',
    accept: 'Aceitar convite',
    accepting: 'Aceitando…',
    acceptNote: 'Ao aceitar, seu login passará para {account}. Sua conta pessoal vazia criada no cadastro será removida.',
    createAndJoin: 'Criar conta e entrar',
    alreadyHaveAccount: 'Já tenho uma conta',
  },
  errors: {
    notFound: {
      title: 'Convite não encontrado',
      body: 'Este link não corresponde a um convite válido. Verifique a URL ou peça um novo convite.',
    },
    used: {
      title: 'Convite já utilizado',
      body: 'Este convite já foi aceito. Se não foi você, peça ao administrador um novo link.',
    },
    expired: {
      title: 'Convite expirado',
      body: 'Este convite expirou. Peça ao administrador um novo — leva apenas alguns segundos.',
    },
    serverError: {
      title: 'Algo deu errado',
      body: 'Não foi possível verificar este convite agora. Tente atualizar a página em instantes.',
    },
  },
  actions: {
    tryAgain: 'Tentar novamente',
    createAccount: 'Criar uma nova conta',
    signIn: 'Entrar',
  },
  conflict: {
    title: 'Não é possível entrar em {account} com esta conta',
    defaultMessage: 'Você já está em outra conta. Entre com um e-mail diferente para participar desta.',
    instructions: 'Para entrar em {account}, saia e cadastre-se novamente com outro e-mail. O link do convite permanece válido enquanto não expirar.',
    staySignedIn: 'Permanecer conectado',
    signOutAndRetry: 'Sair e usar outro e-mail',
    signingOut: 'Saindo…',
  },
  toast: {
    welcome: 'Bem-vindo à equipe',
    acceptFailed: 'Falha ao aceitar convite',
    signOutFailed: 'Não foi possível sair. Tente atualizar a página.',
  },
} as const;

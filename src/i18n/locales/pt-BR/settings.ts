export const settings = {
  title: 'Configurações',
  subtitle:
    'Tudo em um só lugar — sua conta e seu workspace. Escolha uma seção para gerenciar.',
  rail: {
    ariaLabel: 'Seções de configurações',
    groups: {
      account: 'Conta',
      workspace: 'Workspace',
    },
  },
  sections: {
    overview: 'Visão geral',
    profile: 'Seu perfil',
    security: 'Login e segurança',
    appearance: 'Aparência',
    whatsapp: 'WhatsApp',
    templates: 'Modelos',
    quickReplies: 'Respostas rápidas',
    fields: 'Campos e tags',
    deals: 'Negócios e moeda',
    members: 'Membros da equipe',
    api: 'Chaves de API',
  },
  overview: {
    yourAccount: 'Sua conta',
    loading: 'Carregando…',
    whatsapp: {
      notSetup: 'Ainda não configurado',
      connected: 'Conectado',
      needsReconnect: 'Precisa reconectar',
    },
    members: {
      viewTeam: 'Ver membros da equipe',
      count: '{count} membro',
      count_plural: '{count} membros',
      pendingInvite: '{count} convite pendente',
      pendingInvites: '{count} convites pendentes',
    },
    templates: {
      manage: 'Gerenciar modelos de mensagem',
      count: '{count} modelo',
      count_plural: '{count} modelos',
      pendingReview: '{count} aguardando revisão',
    },
    fields: {
      summary: 'Tags e campos personalizados',
      tagsAndFields: '{tags} tag · {fields} campo personalizado',
      tagsAndFields_plural: '{tags} tags · {fields} campos personalizados',
    },
    appearance: {
      subtitle: 'Modo {mode} · destaque {theme}',
    },
  },
  appearance: {
    title: 'Aparência',
    description:
      'Personalize a marca da conta (nome, logo, cor de destaque) e defina o modo e o tema de destaque neste dispositivo.',
    mode: {
      title: 'Modo',
      ariaLabel: 'Modo de cor',
      light: 'Claro',
      lightDescription: 'Superfícies claras, texto escuro.',
      dark: 'Escuro',
      darkDescription: 'O padrão — confortável para os olhos.',
      useMode: 'Usar modo {mode}',
    },
    accent: {
      title: 'Cor de destaque',
      selected: 'Selecionado',
      active: 'Ativo',
      useTheme: 'Usar tema {name}',
    },
    themes: {
      violet: {
        name: 'Violeta',
        tagline: 'O padrão — confiante e levemente ousado.',
      },
      emerald: {
        name: 'Esmeralda',
        tagline: 'Tom de crescimento, lembra mensagens sem copiar o verde do WhatsApp.',
      },
      cobalt: {
        name: 'Cobalto',
        tagline: 'Azul B2B limpo — calmo e profissional.',
      },
      amber: {
        name: 'Âmbar',
        tagline: 'Quente e acolhedor — ideal para equipes pequenas.',
      },
      rose: {
        name: 'Rosa',
        tagline: 'Ousado e moderno — D2C, criadores, lifestyle.',
      },
    },
    branding: {
      title: 'Marca e white-label',
      description:
        'Personalize a aparência do app para todos nesta conta. Logo e nome aparecem na sidebar; a cor de destaque substitui os temas predefinidos abaixo.',
      nameLabel: 'Nome do sistema',
      logoLabel: 'Logo',
      uploadLogo: 'Enviar logo',
      removeLogo: 'Remover logo',
      logoHint: 'PNG, JPG, WebP, GIF ou SVG. Até 2 MB. Exibida em branco sobre o fundo colorido.',
      colorLabel: 'Cor de destaque',
      pickColor: 'Escolher cor',
      clearColor: 'Limpar',
      colorHint:
        'Aplica-se a botões, links e destaques para toda a equipe. Deixe vazio para usar os temas abaixo.',
      previewHint: 'Prévia da marca na sidebar',
      resetDefaults: 'Restaurar padrões',
      adminOnly: 'Somente admins e proprietários podem alterar a marca da conta.',
      toast: {
        saved: 'Marca salva.',
        saveFailed: 'Falha ao salvar marca.',
        uploadFailed: 'Falha ao enviar logo.',
        nameTooLong: 'O nome deve ter no máximo 60 caracteres.',
        invalidColor: 'Informe uma cor hex válida (ex.: #7c3aed).',
      },
    },
  },
  profile: {
    title: 'Seu perfil',
    description:
      'Como você aparece no app. Seu avatar e nome aparecem no cabeçalho, menu lateral e onde seus colegas veem você.',
    fullName: 'Nome completo',
    displayName: 'Nome de exibição',
    email: 'Endereço de e-mail',
    emailPending: 'Verifique sua caixa de entrada para confirmar o novo endereço.',
    emailConfirmBoth:
      'Verifique a caixa de entrada de {oldEmail} e {newEmail} — ambos precisam confirmar antes da alteração.',
    avatar: 'Foto de perfil',
    uploadPhoto: 'Enviar foto',
    changePhoto: 'Alterar foto',
    removePhoto: 'Remover foto',
    avatarHint: 'PNG, JPG, WebP ou GIF. Até 2 MB.',
    placeholderName: 'Ada Lovelace',
    accountDetails: 'Detalhes da conta',
    role: 'Perfil',
    joined: 'Entrou em',
    userId: 'ID do usuário',
    loadingProfile: 'Carregando seu perfil…',
    saveChanges: 'Salvar alterações',
    errors: {
      unsupportedImage: 'Tipo de imagem não suportado',
      unsupportedImageHint: 'Use PNG, JPG, WebP ou GIF.',
      imageTooLarge: 'Imagem muito grande',
      imageTooLargeHint: 'Máximo de 2 MB.',
      invalidEmail: 'Informe um endereço de e-mail válido',
      displayNameRequired: 'Nome de exibição é obrigatório',
      saveFailed: 'Falha ao salvar',
      emailChangeFailed: 'Falha ao alterar e-mail: {message}',
    },
    success: {
      saved: 'Perfil salvo',
      savedEmailPending:
        'Perfil salvo — verifique seu e-mail para confirmar o endereço',
      avatarRemoved: 'Avatar removido',
    },
  },
  security: {
    title: 'Login e segurança',
    description:
      'Altere sua senha e saia dos seus dispositivos. Isso mantém sua conta segura.',
  },
  password: {
    title: 'Senha',
    description:
      'Use pelo menos {min} caracteres. Você permanecerá conectado neste dispositivo após a alteração.',
    current: 'Senha atual',
    new: 'Nova senha',
    confirm: 'Confirmar nova senha',
    update: 'Atualizar senha',
    updating: 'Atualizando…',
    errors: {
      noEmail: 'Não é possível alterar a senha sem um e-mail atual',
      tooShort: 'A senha deve ter pelo menos {min} caracteres',
      mismatch: 'A nova senha e a confirmação não coincidem',
      wrongCurrent: 'Senha atual incorreta',
      updateFailed: 'Falha ao atualizar senha: {message}',
    },
    success: {
      updated: 'Senha atualizada',
    },
  },
  sessions: {
    title: 'Sessões ativas',
    description:
      'Saia de todos os dispositivos em que você está conectado — incluindo este. Útil se perdeu um notebook ou compartilhou sua senha.',
    signOutAll: 'Sair de todos os dispositivos',
    dialog: {
      title: 'Sair de todos os lugares?',
      description:
        'Todos os dispositivos conectados a esta conta serão desconectados e precisarão entrar novamente. Você será redirecionado para a página de login.',
      confirm: 'Sair de todos os lugares',
    },
    errors: {
      signOutFailed: 'Falha ao sair: {message}',
    },
  },
  members: {
    title: 'Membros da equipe',
    description:
      'Pessoas com acesso a esta conta. Os perfis controlam o que cada colega pode fazer.',
    invite: 'Convidar membro',
    pending: 'Convites pendentes',
    remove: 'Remover membro',
    changeRole: 'Alterar perfil',
    you: 'Você',
    joined: 'Entrou em {date}',
    onlineCount: '{count} online',
    awayCount: '{count} ausente',
    offlineCount: '{count} offline',
    memberCount: '{count} membro',
    memberCount_plural: '{count} membros',
    pendingSecurityHint:
      'O link do convite em texto claro só é mostrado uma vez na criação, por segurança — para reenviar, revogue o convite abaixo e crie um novo.',
    emptyPending: 'Nenhum convite pendente.',
    emptyPendingHint:
      'Clique em {action} acima para gerar um link compartilhável.',
    revoke: 'Revogar',
    untitledInvite: 'Convite sem título',
    created: 'Criado em {date}',
    expired: 'expirado',
    expiresInDays: 'expira em {days} dia',
    expiresInDays_plural: 'expira em {days} dias',
    expiresInHours: 'expira em {hours} hora',
    expiresInHours_plural: 'expira em {hours} horas',
    removeTitle: 'Remover membro',
    removeDescription:
      'Remover {name} da conta? A pessoa será desconectada desta conta e receberá uma conta pessoal nova no próximo login. O login em si não é excluído.',
    thisTeammate: 'este colega',
    removing: 'Removendo...',
    roleHints: {
      admin: 'Gerencia membros e tudo mais',
      agent: 'Usa as funções; sem configurações',
      viewer: 'Somente leitura em todo o app',
    },
    presence: {
      onlineActive: 'Online — ativo agora',
      awayIdle: 'Ausente — ocioso',
      offlineLastSeen: 'Offline — visto por último {when}',
    },
    toast: {
      loadMembersFailed: 'Falha ao carregar membros',
      loadInvitationsFailed: 'Falha ao carregar convites',
      updateRoleFailed: 'Falha ao atualizar perfil',
      roleUpdated: 'Atualizado {name} para {role}',
      memberFallback: 'membro',
      removeFailed: 'Falha ao remover membro',
      memberRemoved: 'Removido {name}',
      revokeFailed: 'Falha ao revogar convite',
      inviteRevoked: 'Convite revogado',
    },
    inviteDialog: {
      title: 'Convidar um colega',
      description:
        'Gere um link de convite único. Compartilhe via WhatsApp, Slack ou qualquer canal — sem serviço de e-mail.',
      role: 'Perfil',
      validFor: 'Link válido por',
      label: 'Rótulo',
      labelOptional: '(opcional)',
      labelPlaceholder: 'ex.: Sara — equipe de suporte',
      labelHint: 'Ajuda a lembrar para quem você enviou o link na lista abaixo.',
      expiry: {
        oneDay: '1 dia',
        sevenDays: '7 dias',
        thirtyDays: '30 dias',
      },
      roleDescriptions: {
        admin:
          'Pode convidar colegas, gerenciar configurações, enviar mensagens e editar dados.',
        agent:
          'Pode usar inbox, contatos, disparos, automações e fluxos. Sem acesso a configurações ou membros.',
        viewer: 'Acesso somente leitura em todas as páginas. Não pode enviar nem editar.',
      },
      generate: 'Gerar link',
      created: {
        title: 'Convite criado',
        description:
          'Compartilhe este link com seu novo colega. Ele poderá se cadastrar (ou entrar) e participar da conta como {role}. O link é válido por {days} dia.',
        description_plural:
          'Compartilhe este link com seu novo colega. Ele poderá se cadastrar (ou entrar) e participar da conta como {role}. O link é válido por {days} dias.',
        linkLabel: 'Link do convite',
        saveWarning:
          'Salve este link agora. Nunca armazenamos o texto em claro — ao fechar este diálogo, a URL desaparece. Para reenviar, revogue este convite e crie um novo.',
        whatsappShare: 'Enviar via WhatsApp',
        whatsappMessage:
          'Entre em {account} no wacrm usando este link (válido por {days} dias): {url}',
        accountFallback: 'nossa conta wacrm',
      },
      done: 'Concluído',
      errors: {
        labelTooLong: 'O rótulo deve ter no máximo {max} caracteres',
        createFailed: 'Falha ao criar convite',
      },
      success: {
        copied: 'Link do convite copiado',
        clipboardBlocked: 'Área de transferência bloqueada — copie o link manualmente',
      },
    },
  },
  whatsapp: {
    title: 'Conexão WhatsApp',
    description:
      'Conecte sua API WhatsApp Business da Meta. Credenciais, webhook e passos de configuração ficam aqui.',
    connection: {
      valid: 'Credenciais válidas',
      notConnected: 'Não conectado',
      validHint:
        'Seu token de acesso autentica com a Meta. Veja o status de registro abaixo para saber se os webhooks estão configurados.',
      notConnectedHint:
        'Configure suas credenciais da API Meta abaixo para conectar sua conta WhatsApp Business.',
    },
    registration: {
      registered: 'Registrado — a Meta entregará eventos ao wacrm',
      notRegistered: 'Não registrado — a Meta não entregará eventos',
      verify: 'Verificar com a Meta',
      subscribedSince: 'Inscrito desde {date}.',
      subscribedUnknown: 'desconhecido',
      verifyHint: 'Clique em Verificar com a Meta se os eventos pararem de chegar.',
      lastFailed: 'Última tentativa falhou com: "{error}".',
      retryHint:
        'Informe (ou corrija) o PIN de 2 etapas abaixo e clique em Salvar configuração para tentar novamente.',
      legacyHint:
        'Este número foi salvo antes do rastreamento de registro existir, ou o registro foi ignorado. Informe o PIN de 2 etapas abaixo e clique em Salvar configuração para inscrevê-lo.',
      diagnostic: 'Diagnóstico — última execução:',
      live: 'ativo',
      notLive: 'inativo',
    },
    resetBanner: {
      title: 'O token armazenado não pode ser descriptografado',
      reset: 'Redefinir configuração',
      resetting: 'Redefinindo...',
    },
    credentials: {
      title: 'Credenciais da API',
      description: 'Informe suas credenciais da API WhatsApp Business da Meta.',
      phoneNumberId: 'ID do número de telefone',
      phoneNumberIdPlaceholder: 'ex.: 100234567890123',
      wabaId: 'ID da conta WhatsApp Business',
      wabaIdPlaceholder: 'ex.: 100234567890456',
      accessToken: 'Token de acesso permanente',
      accessTokenPlaceholder: 'Informe seu token de acesso',
      tokenHidden:
        'O token está oculto por segurança. Informe-o novamente para atualizar a configuração.',
      verifyToken: 'Token de verificação do webhook',
      verifyTokenPlaceholder: 'Crie um token de verificação personalizado',
      verifyTokenHint:
        'Uma string personalizada que você cria. Deve coincidir com o token definido nas configurações de webhook da Meta.',
      pin: 'PIN de verificação em duas etapas',
      pinOptional: '(opcional)',
      pinPlaceholder: 'PIN de 6 dígitos do Gerenciador WhatsApp da Meta',
    },
    webhook: {
      title: 'Configuração do webhook',
      description: 'Use esta URL como callback do webhook no painel do app Meta.',
      callbackUrl: 'URL de callback do webhook',
    },
    actions: {
      save: 'Salvar configuração',
      saving: 'Salvando...',
      test: 'Testar conexão da API',
      testing: 'Testando...',
      reset: 'Redefinir configuração',
    },
    setup: {
      title: 'Instruções de configuração',
      description: 'Siga estes passos para conectar sua API WhatsApp Business.',
      docsLink: 'Documentação da API WhatsApp da Meta',
      steps: {
        createApp: {
          title: 'Criar um app na Meta',
          item1: 'Acesse developers.facebook.com',
          item2: 'Clique em "Meus apps" e depois em "Criar app"',
          item3: 'Selecione "Empresa" como tipo de app',
          item4: 'Preencha os dados do app e crie',
        },
        addProduct: {
          title: 'Adicionar o produto WhatsApp',
          item1: 'No painel do app, clique em "Adicionar produto"',
          item2: 'Encontre "WhatsApp" e clique em "Configurar"',
          item3: 'Siga o assistente para vincular sua empresa',
        },
        credentials: {
          title: 'Obter credenciais da API',
          item1: 'Vá em WhatsApp > Configuração da API',
          item2Before: 'Copie o',
          phoneNumberId: 'ID do número de telefone',
          item3Before: 'Copie o',
          wabaId: 'ID da conta WhatsApp Business',
          item4Before: 'Gere um',
          permanentToken: 'token de acesso permanente',
          item4After: 'em Configurações comerciais > Usuários do sistema',
        },
        webhooks: {
          title: 'Configurar webhooks',
          item1: 'Vá em WhatsApp > Configuração',
          item2: 'Clique em "Editar" na seção Webhook',
          item3Before: 'Cole a',
          callbackUrl: 'URL de callback do webhook',
          item3After: 'acima',
          item4Before: 'Informe o mesmo',
          verifyToken: 'token de verificação',
          item4After: 'que você definiu aqui',
          item5: 'Inscreva-se no campo de webhook "messages"',
        },
      },
    },
    toast: {
      loadFailed: 'Falha ao carregar configuração do WhatsApp',
      phoneRequired: 'ID do número de telefone é obrigatório',
      tokenRequired: 'Token de acesso é obrigatório na configuração inicial',
      reenterToken: 'Informe novamente o token de acesso para salvar alterações',
      saveFailed: 'Falha ao salvar configuração',
      registeredFailed: 'Salvo, mas a Meta não registrou o número: {error}',
      registeredSkipped:
        'Credenciais salvas e verificadas. O registro de entrada foi ignorado (sem PIN) — veja o status de registro abaixo.',
      connectedNamed: 'Ativo — {name} já pode receber eventos.',
      connected: 'WhatsApp conectado. Os eventos começarão em até um minuto.',
      testSuccessNamed: 'Conectado a {name}',
      testSuccess: 'Conexão com a API bem-sucedida',
      testFailed: 'Falha na conexão com a API',
      testNetworkFailed: 'Teste de conexão falhou. Verifique a rede e tente novamente.',
      verifySuccess: 'Número totalmente configurado — a Meta está entregando eventos.',
      verifyFailed:
        'Número não totalmente registrado. Veja as verificações abaixo para saber qual etapa falhou.',
      verifyEndpointFailed: 'Não foi possível acessar o endpoint de verificação.',
      resetConfirm:
        'Isso excluirá a configuração atual do WhatsApp para você informá-la novamente. Continuar?',
      resetFailed: 'Falha ao redefinir configuração',
      resetSuccess: 'Configuração limpa. Agora você pode informar suas credenciais novamente.',
      webhookCopied: 'URL do webhook copiada',
    },
  },
  quickReplies: {
    title: 'Respostas rápidas',
    description:
      'Trechos reutilizáveis — texto simples ou mensagem interativa salva — que agentes podem inserir no compositor da caixa de entrada.',
    new: 'Nova resposta rápida',
    empty: 'Nenhuma resposta rápida ainda. Crie uma para reutilizar nas conversas.',
    editTitle: 'Editar resposta rápida',
    createTitle: 'Nova resposta rápida',
    nameLabel: 'Nome',
    namePlaceholder: 'ex.: Horário de atendimento',
    nameRequired: 'Dê um nome à resposta rápida.',
    kindText: 'Texto',
    kindInteractive: 'Interativa',
    textPlaceholder: 'Texto da mensagem a inserir',
    cancel: 'Cancelar',
    save: 'Salvar',
    created: 'Resposta rápida criada.',
    updated: 'Resposta rápida atualizada.',
    saveFailed: 'Não foi possível salvar a resposta rápida.',
    deleteConfirm: 'Excluir esta resposta rápida?',
    deleteFailed: 'Não foi possível excluir a resposta rápida.',
  },
  templates: {
    title: 'Modelos de mensagem',
    description:
      'Crie modelos e envie para aprovação da Meta. Use "Sincronizar da Meta" para importar modelos aprovados em outro lugar.',
    sync: 'Sincronizar da Meta',
    syncing: 'Sincronizando…',
    syncTitle: 'Importar modelos aprovados da sua conta WhatsApp Business da Meta',
    new: 'Novo modelo',
    empty: 'Nenhum modelo ainda.',
    emptyHint: 'Crie seu primeiro modelo de mensagem para começar.',
    qualityScore: 'Pontuação de qualidade da Meta',
    edit: 'Editar',
    delete: 'Excluir',
    submit: 'Enviar para aprovação',
    submitting: 'Enviando…',
    deleteDialog: {
      title: 'Excluir modelo?',
      meta:
        '"{name}" será excluído da Meta e do wacrm. Disparos ativos que usam este modelo começarão a falhar no próximo envio. Isso não pode ser desfeito.',
      local:
        '"{name}" será excluído do wacrm. Nunca foi enviado à Meta, então não há limpeza remota.',
    },
    toast: {
      loadFailed: 'Falha ao carregar modelos',
      submitFailed: 'Falha ao enviar',
      syncFailed: 'Falha ao sincronizar modelos',
      syncPartial: 'Falha ao sincronizar: {names}{suffix}',
      deleted: 'Modelo excluído',
      deleteFailed: 'Falha ao excluir modelo',
      headerImageType: 'A imagem do cabeçalho deve ser JPEG ou PNG.',
      headerImageSize: 'A imagem do cabeçalho deve ter menos de {maxMb} MB.',
      imageUploaded: 'Imagem enviada.',
      uploadFailed: 'Falha no upload.',
    },
  },
  fields: {
    title: 'Campos e tags',
    description:
      'Duas formas de organizar contatos: tags coloridas para agrupamento rápido e campos personalizados para dados estruturados.',
    tags: {
      title: 'Tags',
      description: 'Rótulos coloridos para agrupar e filtrar contatos.',
      empty: 'Nenhuma tag ainda — crie a primeira abaixo.',
      placeholder: 'ex.: Newsletter',
      add: 'Adicionar tag',
      deleteTitle: 'Excluir tag',
      deleteDescription:
        'Excluir a tag "{name}"? Isso a remove de todos os contatos e não pode ser desfeito.',
      deleteConfirm: 'Excluir tag',
      useColor: 'Usar {name}',
      deleteAria: 'Excluir {name}',
      toast: {
        loadFailed: 'Falha ao carregar tags',
        nameRequired: 'Nome da tag é obrigatório',
        notAuthenticated: 'Não autenticado',
        created: 'Tag criada',
        createFailed: 'Falha ao criar tag',
        deleted: 'Tag excluída',
        deleteFailed: 'Falha ao excluir tag',
      },
    },
    customFields: {
      title: 'Campos personalizados',
      description:
        'Campos extras de contato (ex.: CEP, origem do lead). Aparecem em todos os contatos e na ação de automação “Atualizar campo do contato”.',
    },
  },
  deals: {
    title: 'Negócios e moeda',
    description:
      'A moeda usada para novos negócios e totais do funil e do painel.',
    defaultCurrency: 'Moeda padrão',
    cardDescription:
      'Novos negócios usam esta moeda, e totais do funil e painel são exibidos nela. Negócios existentes mantêm a moeda salva.',
    currency: 'Moeda',
    adminOnly: 'Somente administradores da conta podem alterar a moeda padrão.',
    toast: {
      saveFailed: 'Falha ao salvar moeda padrão',
      saved: 'Moeda padrão atualizada',
    },
  },
  api: {
    title: 'Chaves de API',
    description: 'Crie e gerencie chaves de API para integrações.',
    descriptionRich:
      'As chaves autenticam a API REST pública ({path}) para você criar suas próprias automações. Envie como {authHeader}.',
    new: 'Nova chave de API',
    empty: 'Nenhuma chave de API ainda.',
    emptyAdmin: 'Clique em Nova chave de API para criar uma.',
    emptyViewer: 'Peça a um administrador para criar uma.',
    revoked: 'Revogada',
    expired: 'Expirada',
    noScopes: 'Sem escopos',
    created: 'Criada em {date}',
    lastUsed: 'último uso em {date}',
    neverUsed: 'nunca usada',
    expires: 'expira em {date}',
    revoke: 'Revogar',
    revokedToast: 'Revogada "{name}"',
    create: {
      title: 'Nova chave de API',
      description:
        'Nomeie conforme a integração que a usará e conceda apenas os escopos necessários.',
      revealTitle: 'Copie sua chave de API',
      revealDescription:
        'Esta é a única vez que a chave completa é exibida. Guarde em local seguro — se perder, revogue e crie uma nova.',
      keyLabel: 'Chave de API',
      name: 'Nome',
      namePlaceholder: 'ex.: Automação Zapier',
      scopes: 'Escopos',
      noScopesHint:
        'Uma chave sem escopos ainda pode chamar GET /api/v1/me para verificar se funciona.',
      create: 'Criar chave',
      done: 'Concluído',
      errors: {
        nameRequired: 'Dê um nome à chave',
        createFailed: 'Falha ao criar chave',
        loadFailed: 'Falha ao carregar chaves de API',
        revokeFailed: 'Falha ao revogar chave',
        copyManual: 'Falha ao copiar — selecione e copie manualmente',
      },
      success: {
        copied: 'Chave de API copiada',
      },
    },
  },
  ai: {
    title: 'Configuração do agente',
    description: 'Configure o agente de IA que responde na sua inbox.',
    adminOnly: 'Somente admins e proprietários podem alterar a configuração de IA.',
    loading: 'Carregando…',
    provider: {
      title: 'Provedor e chave',
      description:
        'Sua chave é criptografada em repouso (AES-256-GCM) e não é exibida novamente após salvar.',
      providerLabel: 'Provedor',
      modelLabel: 'Modelo',
      apiKeyLabel: 'Chave de API',
      testKey: 'Testar chave',
      embeddingsKeyLabel: 'Chave de embeddings',
      embeddingsKeyOptional: '(opcional — habilita busca semântica na base de conhecimento)',
      embeddingsPlaceholder: 'sk-... (OpenAI)',
      embeddingsHint:
        'Chave OpenAI usada apenas para embedar sua base de conhecimento (text-embedding-3-small){sameKey}. Deixe em branco para usar busca por palavras-chave. Limpe para desativar a busca semântica.',
      embeddingsSameKey: ' — pode ser a mesma chave acima',
      providers: {
        openai: 'OpenAI',
        anthropic: 'Anthropic (Claude)',
      },
      modelHint:
        'Modelos econômicos são ideais para respostas automáticas no WhatsApp. Premium gasta mais tokens por mensagem.',
      modelTiers: {
        economy: 'Econômico',
        balanced: 'Equilibrado',
        premium: 'Premium',
      },
      modelRecommended: 'Recomendado',
      modelCustom: 'Modelo salvo (fora da lista)',
      models: {
        'gpt-5.4-mini': {
          label: 'GPT-5.4 mini',
          summary: 'Melhor custo-benefício para atendimento automático',
          details:
            'Versão compacta mais recente da OpenAI. Responde rápido, segue bem instruções de negócio e mantém tom natural em conversas curtas. Ideal para auto-reply, triagem e FAQs no WhatsApp quando o volume é alto e o custo por mensagem importa.',
        },
        'gpt-4o-mini': {
          label: 'GPT-4o mini',
          summary: 'Muito barato, ótimo para alto volume',
          details:
            'Modelo leve e consolidado. Bom para perguntas repetitivas, confirmações e respostas objetivas. Gasta poucos tokens — recomendado se você prioriza economia máxima e não precisa de raciocínio complexo.',
        },
        'gpt-4.1-mini': {
          label: 'GPT-4.1 mini',
          summary: 'Barato com qualidade geral sólida',
          details:
            'Equilíbrio entre preço e compreensão de contexto. Lida melhor com instruções mais longas e variações de linguagem do que o 4o mini. Boa opção intermediária para equipes que querem economia sem abrir mão de um pouco mais de nuance.',
        },
        'gpt-5.4': {
          label: 'GPT-5.4',
          summary: 'Mais inteligente — casos que exigem raciocínio',
          details:
            'Modelo completo, melhor para dúvidas ambíguas, múltiplas intenções na mesma mensagem ou quando a base de conhecimento é extensa. Custo médio por resposta; use quando o mini não resolve bem e você pode investir um pouco mais por conversa.',
        },
        'gpt-4o': {
          label: 'GPT-4o',
          summary: 'Qualidade comprovada, custo moderado',
          details:
            'Referência estável da OpenAI para chat. Boa aderência a persona e contexto, útil para rascunhos na inbox e auto-reply em negócios com perguntas variadas. Custo maior que os modelos mini, mas previsível e confiável.',
        },
        'claude-haiku-4-5-20251001': {
          label: 'Claude Haiku 4.5',
          summary: 'Melhor custo-benefício Anthropic para WhatsApp',
          details:
            'Mais rápido e econômico da linha Claude atual. Excelente para respostas curtas, tom cordial e handoff quando não sabe responder. Recomendado como padrão para auto-reply e alto volume com chave Anthropic.',
        },
        'claude-3-5-haiku-20241022': {
          label: 'Claude 3.5 Haiku',
          summary: 'Econômico e estável para volume alto',
          details:
            'Geração anterior, ainda muito eficiente em custo. Bom para mensagens diretas e fluxos simples. Prefira o Haiku 4.5 se sua conta tiver acesso — ele entende contexto e instruções com mais precisão.',
        },
        'claude-sonnet-4-5-20250929': {
          label: 'Claude Sonnet 4.5',
          summary: 'Equilíbrio entre inteligência e preço',
          details:
            'Meio-termo da Anthropic: melhor raciocínio que o Haiku, mais barato que o Opus. Indicado para atendimentos com base de conhecimento rica, objeções ou quando o cliente escreve mensagens longas e detalhadas.',
        },
        'claude-opus-4-6-20250514': {
          label: 'Claude Opus 4.6',
          summary: 'Máxima capacidade — use com parcimônia',
          details:
            'Topo de linha para casos difíceis: negociação sensível, muitas regras de negócio ou respostas que exigem máxima precisão. Custo alto por mensagem; reserve para rascunhos manuais ou contas premium, não para auto-reply em massa.',
        },
      },
    },
    behaviour: {
      title: 'Persona e comportamento',
      description:
        'Quem é o agente, tom de voz e o que pode ou não prometer. A persona tem prioridade sobre instruções genéricas do sistema.',
      promptLabel: 'Persona e instruções',
      promptPlaceholder:
        'Ex.: Você é Gabriella, da Wepost. Cordial, objetiva, estilo WhatsApp. Apresente-se em saudações…',
      examplesLabel: 'Exemplos de conversa (opcional)',
      examplesPlaceholder:
        'Cliente: oi boa tarde\nVocê: Oi, boa tarde! Sou a Gabriella…\n\nCliente: quanto custa?\nVocê: O investimento depende do escopo…',
      examplesHint:
        'Pares Cliente/Você que mostram o tom desejado. O agente adapta ao contexto — não copia literalmente.',
      previewTitle: 'Prévia do tom',
      previewEmpty: 'Configure a persona e exemplos para ver como o agente deve soar.',
      enableTitle: 'Ativar assistente de IA',
      enableDescription:
        'Interruptor principal. Ativa o botão “Rascunhar com IA” na inbox.',
      autoReplyTitle: 'Resposta automática a mensagens recebidas',
      autoReplyDescription:
        'O bot responde novas mensagens automaticamente (somente quando nenhum fluxo trata delas e nenhum agente está atribuído). Encaminha para um humano quando não consegue ajudar.',
      maxRepliesLabel: 'Máx. de respostas automáticas por conversa',
      maxRepliesDescription:
        'Após esse número de respostas do bot em uma conversa, o bot para de responder.',
      handoffTo: 'Encaminhar para',
      handoffToDesc:
        'Quando o bot não puder ajudar, atribui a conversa a este membro (ou deixa na fila compartilhada).',
      handoffQueue: 'Fila compartilhada (sem atribuição)',
    },
    knowledge: {
      title: 'Base de conhecimento',
      description: 'Documentos que o agente pode consultar ao responder clientes.',
      semanticOn: ' Busca semântica ativa (chave de embeddings configurada).',
      semanticOff:
        ' Usando busca por palavras-chave — adicione uma chave de embeddings acima para busca semântica.',
      empty: 'Nenhum documento ainda.',
      edit: 'Editar',
      delete: 'Excluir',
      titleLabel: 'Título',
      titlePlaceholder: 'Ex.: Política de trocas e reembolsos',
      contentLabel: 'Conteúdo',
      contentPlaceholder:
        'Cole a resposta da FAQ, texto da política ou detalhes do produto…',
      cancel: 'Cancelar',
      saveDocument: 'Salvar documento',
      addDocument: 'Adicionar documento',
      reindex: 'Reindexar',
      reindexTitle:
        'Re-embedar todos os documentos (ex.: após adicionar chave de embeddings)',
    },
    actions: {
      remove: 'Remover',
      save: 'Salvar',
    },
    toast: {
      loadFailed: 'Falha ao carregar configuração de IA',
      loadKnowledgeFailed: 'Falha ao carregar base de conhecimento',
      testSuccess: 'Chave válida — o provedor respondeu.',
      testFailed: 'O provedor rejeitou a solicitação.',
      testUnreachable: 'Não foi possível contatar o provedor.',
      modelRequired: 'Informe o nome do modelo.',
      keyRequired: 'Informe sua chave de API.',
      saveSuccess: 'Assistente de IA salvo.',
      saveFailed: 'Falha ao salvar.',
      removeSuccess: 'Configuração de IA removida.',
      removeFailed: 'Falha ao remover.',
      openDocFailed: 'Falha ao abrir documento',
      titleContentRequired: 'Título e conteúdo são obrigatórios.',
      docAdded: 'Documento adicionado.',
      docUpdated: 'Documento atualizado.',
      docRemoved: 'Documento removido.',
      reindexed: '{count} documento(s) reindexado(s).',
      reindexFailed: 'Falha ao reindexar.',
    },
  },
} as const;

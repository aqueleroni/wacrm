export const settings = {
  title: 'Settings',
  subtitle:
    'Everything in one place — your account and your workspace. Pick a section to manage it.',
  rail: {
    ariaLabel: 'Settings sections',
    groups: {
      account: 'Account',
      workspace: 'Workspace',
    },
  },
  sections: {
    overview: 'Overview',
    profile: 'Your profile',
    security: 'Login & security',
    appearance: 'Appearance',
    whatsapp: 'WhatsApp',
    templates: 'Templates',
    quickReplies: 'Quick replies',
    fields: 'Fields & tags',
    deals: 'Deals & currency',
    members: 'Team members',
    api: 'API keys',
  },
  overview: {
    yourAccount: 'Your account',
    loading: 'Loading…',
    whatsapp: {
      notSetup: 'Not set up yet',
      connected: 'Connected',
      needsReconnect: 'Needs reconnecting',
    },
    members: {
      viewTeam: 'View team members',
      count: '{count} member',
      count_plural: '{count} members',
      pendingInvite: '{count} pending invite',
      pendingInvites: '{count} pending invites',
    },
    templates: {
      manage: 'Manage message templates',
      count: '{count} template',
      count_plural: '{count} templates',
      pendingReview: '{count} pending review',
    },
    fields: {
      summary: 'Tags and custom fields',
      tagsAndFields: '{tags} tag · {fields} custom field',
      tagsAndFields_plural: '{tags} tags · {fields} custom fields',
    },
    appearance: {
      subtitle: '{mode} mode · {theme} accent',
    },
  },
  appearance: {
    title: 'Appearance',
    description:
      'Customize your account brand (name, logo, accent color) and set the mode and accent theme for this device.',
    mode: {
      title: 'Mode',
      ariaLabel: 'Color mode',
      light: 'Light',
      lightDescription: 'Bright surfaces, dark text.',
      dark: 'Dark',
      darkDescription: 'The default — easy on the eyes.',
      useMode: 'Use {mode} mode',
    },
    accent: {
      title: 'Accent color',
      selected: 'Selected',
      active: 'Active',
      useTheme: 'Use {name} theme',
    },
    themes: {
      violet: {
        name: 'Violet',
        tagline: 'The default — confident, slightly playful.',
      },
      emerald: {
        name: 'Emerald',
        tagline: 'Growth-coded, nods at messaging without copying WhatsApp green.',
      },
      cobalt: {
        name: 'Cobalt',
        tagline: 'Clean B2B-SaaS blue — calm and product-y.',
      },
      amber: {
        name: 'Amber',
        tagline: 'Warm and friendly — feels good for SMB teams.',
      },
      rose: {
        name: 'Rose',
        tagline: 'Bold and modern — D2C, creator-economy, lifestyle.',
      },
    },
    branding: {
      title: 'Brand & white-label',
      description:
        'Customize how the app looks for everyone on this account. Logo and name appear in the sidebar; the accent color overrides the preset themes below.',
      nameLabel: 'App name',
      logoLabel: 'Logo',
      uploadLogo: 'Upload logo',
      removeLogo: 'Remove logo',
      logoHint: 'PNG, JPG, WebP, GIF or SVG. Up to 2 MB. Shown in white on the accent background.',
      colorLabel: 'Accent color',
      pickColor: 'Pick accent color',
      clearColor: 'Clear',
      colorHint:
        'Applies to buttons, links and highlights for all team members. Leave empty to use the preset themes below.',
      previewHint: 'Preview of the sidebar brand',
      resetDefaults: 'Reset to defaults',
      adminOnly: 'Only admins and owners can change account branding.',
      toast: {
        saved: 'Branding saved.',
        saveFailed: 'Failed to save branding.',
        uploadFailed: 'Failed to upload logo.',
        nameTooLong: 'App name must be 60 characters or fewer.',
        invalidColor: 'Enter a valid hex color (e.g. #7c3aed).',
      },
    },
  },
  profile: {
    title: 'Your profile',
    description:
      'How you show up across the app. Your avatar and name appear in the header, sidebar, and anywhere your teammates see you.',
    fullName: 'Full name',
    displayName: 'Display name',
    email: 'Email address',
    emailPending: 'Check your inbox to confirm the new address.',
    emailConfirmBoth:
      'Check the inbox for {oldEmail} and {newEmail} — both need to confirm before the change takes effect.',
    avatar: 'Profile photo',
    uploadPhoto: 'Upload photo',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    avatarHint: 'PNG, JPG, WebP, or GIF. Up to 2 MB.',
    placeholderName: 'Ada Lovelace',
    accountDetails: 'Account details',
    role: 'Role',
    joined: 'Joined',
    userId: 'User ID',
    loadingProfile: 'Loading your profile…',
    saveChanges: 'Save changes',
    errors: {
      unsupportedImage: 'Unsupported image type',
      unsupportedImageHint: 'Use PNG, JPG, WebP, or GIF.',
      imageTooLarge: 'Image is too large',
      imageTooLargeHint: 'Maximum 2 MB.',
      invalidEmail: 'Enter a valid email address',
      displayNameRequired: 'Display name is required',
      saveFailed: 'Save failed',
      emailChangeFailed: 'Email change failed: {message}',
    },
    success: {
      saved: 'Profile saved',
      savedEmailPending:
        'Profile saved — check your email to confirm the address change',
      avatarRemoved: 'Avatar removed',
    },
  },
  security: {
    title: 'Login & security',
    description:
      'Change your password and sign out of your devices. These keep your account safe.',
  },
  password: {
    title: 'Password',
    description:
      'Use at least {min} characters. You will stay signed in on this device after changing it.',
    current: 'Current password',
    new: 'New password',
    confirm: 'Confirm new password',
    update: 'Update password',
    updating: 'Updating…',
    errors: {
      noEmail: 'Cannot change password without a current email',
      tooShort: 'Password must be at least {min} characters',
      mismatch: 'New password and confirmation do not match',
      wrongCurrent: 'Current password is incorrect',
      updateFailed: 'Password update failed: {message}',
    },
    success: {
      updated: 'Password updated',
    },
  },
  sessions: {
    title: 'Active sessions',
    description:
      "Sign out of every device where you're logged in — including this one. Useful if you lost a laptop or shared your password.",
    signOutAll: 'Sign out of all devices',
    dialog: {
      title: 'Sign out everywhere?',
      description:
        'Every device logged into this account will be signed out and will need to log in again. You will be redirected to the login page.',
      confirm: 'Sign out everywhere',
    },
    errors: {
      signOutFailed: 'Sign-out failed: {message}',
    },
  },
  members: {
    title: 'Team members',
    description:
      'People with access to this account. Roles control what each teammate can do.',
    invite: 'Invite member',
    pending: 'Pending invitations',
    remove: 'Remove member',
    changeRole: 'Change role',
    you: 'You',
    joined: 'Joined {date}',
    onlineCount: '{count} online',
    awayCount: '{count} away',
    offlineCount: '{count} offline',
    memberCount: '{count} member',
    memberCount_plural: '{count} members',
    pendingSecurityHint:
      'The plaintext invite URL is only shown once at creation for security — to re-share, revoke the invite below and create a new one.',
    emptyPending: 'No pending invitations.',
    emptyPendingHint:
      'Click {action} above to generate a shareable link.',
    revoke: 'Revoke',
    untitledInvite: 'Untitled invite',
    created: 'Created {date}',
    expired: 'expired',
    expiresInDays: 'expires in {days} day',
    expiresInDays_plural: 'expires in {days} days',
    expiresInHours: 'expires in {hours} hour',
    expiresInHours_plural: 'expires in {hours} hours',
    removeTitle: 'Remove member',
    removeDescription:
      "Remove {name} from the account? They'll be signed out of this account and given a fresh personal account on their next sign-in. Their login isn't deleted.",
    thisTeammate: 'this teammate',
    removing: 'Removing...',
    roleHints: {
      admin: 'Manage members + everything',
      agent: 'Use features; no settings',
      viewer: 'Read-only across the app',
    },
    presence: {
      onlineActive: 'Online — active now',
      awayIdle: 'Away — idle',
      offlineLastSeen: 'Offline — last seen {when}',
    },
    toast: {
      loadMembersFailed: 'Failed to load members',
      loadInvitationsFailed: 'Failed to load invitations',
      updateRoleFailed: 'Failed to update role',
      roleUpdated: 'Updated {name} to {role}',
      memberFallback: 'member',
      removeFailed: 'Failed to remove member',
      memberRemoved: 'Removed {name}',
      revokeFailed: 'Failed to revoke invitation',
      inviteRevoked: 'Invitation revoked',
    },
    inviteDialog: {
      title: 'Invite a teammate',
      description:
        'Generate a one-time invite link. Share it via WhatsApp, Slack, or any channel you like — no email service required.',
      role: 'Role',
      validFor: 'Link valid for',
      label: 'Label',
      labelOptional: '(optional)',
      labelPlaceholder: 'e.g. Sara — support team',
      labelHint: 'Helps you remember who you sent the link to in the pending list below.',
      expiry: {
        oneDay: '1 day',
        sevenDays: '7 days',
        thirtyDays: '30 days',
      },
      roleDescriptions: {
        admin:
          'Can invite teammates, manage settings, send messages, and edit data.',
        agent:
          'Can use the inbox, contacts, broadcasts, automations, and flows. No settings or member access.',
        viewer: 'Read-only access across every page. Cannot send or edit anything.',
      },
      generate: 'Generate link',
      created: {
        title: 'Invite created',
        description:
          "Share this link with your new teammate. They'll be able to sign up (or sign in) and join the account as {role}. The link is valid for {days} day.",
        description_plural:
          "Share this link with your new teammate. They'll be able to sign up (or sign in) and join the account as {role}. The link is valid for {days} days.",
        linkLabel: 'Invite link',
        saveWarning:
          'Save this link now. We never store the plaintext — once you close this dialog the URL is gone. To re-share, revoke this invite and create a new one.',
        whatsappShare: 'Send via WhatsApp',
        whatsappMessage:
          'Join {account} on wacrm using this link (valid for {days} days): {url}',
        accountFallback: 'our wacrm account',
      },
      done: 'Done',
      errors: {
        labelTooLong: 'Label must be {max} characters or fewer',
        createFailed: 'Failed to create invitation',
      },
      success: {
        copied: 'Invite link copied',
        clipboardBlocked: 'Clipboard blocked — copy the link manually',
      },
    },
  },
  whatsapp: {
    title: 'WhatsApp connection',
    description:
      'Connect your Meta WhatsApp Business API. Credentials, webhook, and setup steps all live here.',
    connection: {
      valid: 'Credentials valid',
      notConnected: 'Not Connected',
      validHint:
        'Your access token authenticates with Meta. See Registration status below for whether webhooks are actually wired.',
      notConnectedHint:
        'Configure your Meta API credentials below to connect your WhatsApp Business account.',
    },
    registration: {
      registered: 'Registered — Meta will deliver events to wacrm',
      notRegistered: 'Not registered — Meta will not deliver events',
      verify: 'Verify with Meta',
      subscribedSince: 'Subscribed since {date}.',
      subscribedUnknown: 'unknown',
      verifyHint: 'Click Verify with Meta if events stop arriving.',
      lastFailed: 'Last attempt failed with: "{error}".',
      retryHint: 'Enter (or correct) the 2-step PIN below and click Save Configuration to retry.',
      legacyHint:
        'This number is not fully registered yet (skipped or saved before tracking existed). If Meta requires a 2-step PIN, enter it below and click Save Configuration. Test numbers often have no PIN — in that case configure the webhook in Meta and click Verify with Meta.',
      diagnostic: 'Diagnostic — last run:',
      live: 'live',
      notLive: 'not live',
    },
    resetBanner: {
      title: "Stored token can't be decrypted",
      reset: 'Reset Configuration',
      resetting: 'Resetting...',
    },
    credentials: {
      title: 'API Credentials',
      description: 'Enter your Meta WhatsApp Business API credentials.',
      phoneNumberId: 'Phone Number ID',
      phoneNumberIdPlaceholder: 'e.g. 100234567890123',
      wabaId: 'WhatsApp Business Account ID',
      wabaIdPlaceholder: 'e.g. 100234567890456',
      accessToken: 'Permanent Access Token',
      accessTokenPlaceholder: 'Enter your access token',
      tokenHidden: 'Token is hidden for security. Re-enter it to update configuration.',
      verifyToken: 'Webhook Verify Token',
      verifyTokenPlaceholder: 'Create a custom verify token',
      verifyTokenHint:
        'A custom string you create. Must match the token you set in Meta webhook settings.',
      pin: 'Two-step verification PIN',
      pinOptional: '(optional)',
      pinPlaceholder: '6-digit PIN from Meta WhatsApp Manager',
    },
    webhook: {
      title: 'Webhook Configuration',
      description: 'Use this URL as your webhook callback in the Meta App Dashboard.',
      callbackUrl: 'Webhook Callback URL',
    },
    actions: {
      save: 'Save Configuration',
      saving: 'Saving...',
      test: 'Test API Connection',
      testing: 'Testing...',
      reset: 'Reset Configuration',
    },
    setup: {
      title: 'Setup Instructions',
      description: 'Follow these steps to connect your WhatsApp Business API.',
      docsLink: 'Meta WhatsApp API Documentation',
      steps: {
        createApp: {
          title: 'Create a Meta App',
          item1: 'Go to developers.facebook.com',
          item2: 'Click "My Apps" and then "Create App"',
          item3: 'Select "Business" as the app type',
          item4: 'Fill in app details and create',
        },
        addProduct: {
          title: 'Add WhatsApp Product',
          item1: 'In your app dashboard, click "Add Product"',
          item2: 'Find "WhatsApp" and click "Set Up"',
          item3: 'Follow the setup wizard to link your business',
        },
        credentials: {
          title: 'Get API Credentials',
          item1: 'Go to WhatsApp > API Setup',
          item2Before: 'Copy your',
          phoneNumberId: 'Phone Number ID',
          item3Before: 'Copy your',
          wabaId: 'WhatsApp Business Account ID',
          item4Before: 'Generate a',
          permanentToken: 'Permanent Access Token',
          item4After: 'from Business Settings > System Users',
        },
        webhooks: {
          title: 'Configure Webhooks',
          item1: 'Go to WhatsApp > Configuration',
          item2: 'Click "Edit" on the Webhook section',
          item3Before: 'Paste the',
          callbackUrl: 'Webhook Callback URL',
          item3After: 'from above',
          item4Before: 'Enter the same',
          verifyToken: 'Verify Token',
          item4After: 'you set here',
          item5: 'Subscribe to "messages" webhook field',
        },
      },
    },
    toast: {
      loadFailed: 'Failed to load WhatsApp configuration',
      phoneRequired: 'Phone Number ID is required',
      tokenRequired: 'Access Token is required for initial setup',
      reenterToken: 'Please re-enter the Access Token to save changes',
      saveFailed: 'Failed to save configuration',
      registeredFailed: "Saved, but Meta couldn't register the number: {error}",
      registeredSkipped:
        'Credentials saved and verified. Inbound registration was skipped (no PIN) — see Registration status below.',
      connectedNamed: 'Live — {name} can now receive events.',
      connected: 'WhatsApp connected. Events will start flowing within a minute.',
      testSuccessNamed: 'Connected to {name}',
      testSuccess: 'API connection successful',
      testFailed: 'API connection failed',
      testNetworkFailed: 'Connection test failed. Check network and try again.',
      verifySuccess: 'Number is fully wired — Meta is delivering events.',
      verifyFailed:
        'Number is not fully registered. See the checks below for which step failed.',
      verifyEndpointFailed: 'Could not reach the verification endpoint.',
      resetConfirm:
        'This will delete the current WhatsApp config so you can re-enter it. Continue?',
      resetFailed: 'Failed to reset configuration',
      resetSuccess: 'Configuration cleared. You can now re-enter your credentials.',
      webhookCopied: 'Webhook URL copied to clipboard',
    },
  },
  quickReplies: {
    title: 'Quick replies',
    description:
      'Reusable snippets — plain text or a saved interactive message — that agents can insert from the inbox composer.',
    new: 'New quick reply',
    empty: 'No quick replies yet. Create one to reuse it across conversations.',
    editTitle: 'Edit quick reply',
    createTitle: 'New quick reply',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Business hours',
    nameRequired: 'Give the quick reply a name.',
    kindText: 'Text',
    kindInteractive: 'Interactive',
    textPlaceholder: 'The message text to insert',
    cancel: 'Cancel',
    save: 'Save',
    created: 'Quick reply created.',
    updated: 'Quick reply updated.',
    saveFailed: "Couldn't save the quick reply.",
    deleteConfirm: 'Delete this quick reply?',
    deleteFailed: "Couldn't delete the quick reply.",
  },
  templates: {
    title: 'Message templates',
    description:
      'Create templates and submit them to Meta for approval. Use "Sync from Meta" to pull templates approved elsewhere.',
    sync: 'Sync from Meta',
    syncing: 'Syncing…',
    syncTitle: 'Pull approved templates from your Meta WhatsApp Business Account',
    new: 'New Template',
    empty: 'No templates yet.',
    emptyHint: 'Create your first message template to get started.',
    qualityScore: 'Meta quality score',
    edit: 'Edit',
    delete: 'Delete',
    submit: 'Submit for Approval',
    submitting: 'Submitting…',
    deleteDialog: {
      title: 'Delete template?',
      meta:
        '"{name}" will be deleted from Meta and from wacrm. Active broadcasts using this template will start failing on their next send. This can\'t be undone.',
      local:
        '"{name}" will be deleted from wacrm. It was never submitted to Meta, so no remote cleanup is needed.',
    },
    toast: {
      loadFailed: 'Failed to load templates',
      submitFailed: 'Failed to submit',
      syncFailed: 'Failed to sync templates',
      syncPartial: 'Failed to sync: {names}{suffix}',
      deleted: 'Template deleted',
      deleteFailed: 'Failed to delete template',
      headerImageType: 'Header image must be a JPEG or PNG.',
      headerImageSize: 'Header image must be under {maxMb} MB.',
      imageUploaded: 'Image uploaded.',
      uploadFailed: 'Upload failed.',
    },
  },
  fields: {
    title: 'Fields & tags',
    description:
      'Two ways to organize contacts: colour-coded tags for quick grouping, and custom fields for structured data.',
    tags: {
      title: 'Tags',
      description: 'Colour-coded labels for grouping and filtering contacts.',
      empty: 'No tags yet — create your first one below.',
      placeholder: 'e.g. Newsletter',
      add: 'Add tag',
      deleteTitle: 'Delete tag',
      deleteDescription:
        'Delete the tag "{name}"? This removes it from all contacts and cannot be undone.',
      deleteConfirm: 'Delete tag',
      useColor: 'Use {name}',
      deleteAria: 'Delete {name}',
      toast: {
        loadFailed: 'Failed to load tags',
        nameRequired: 'Tag name is required',
        notAuthenticated: 'Not authenticated',
        created: 'Tag created',
        createFailed: 'Failed to create tag',
        deleted: 'Tag deleted',
        deleteFailed: 'Failed to delete tag',
      },
    },
    customFields: {
      title: 'Custom fields',
      description:
        'Extra contact fields (e.g. ZIP code, lead source). They appear on every contact and in the “Update Contact Field” automation action.',
    },
  },
  deals: {
    title: 'Deals & currency',
    description:
      'The currency used for new deals and for pipeline and dashboard totals.',
    defaultCurrency: 'Default currency',
    cardDescription:
      'New deals default to this currency, and pipeline and dashboard totals are shown in it. Existing deals keep the currency they were saved with.',
    currency: 'Currency',
    adminOnly: 'Only account admins can change the default currency.',
    toast: {
      saveFailed: 'Failed to save default currency',
      saved: 'Default currency updated',
    },
  },
  api: {
    title: 'API keys',
    description: 'Create and manage API keys for integrations.',
    descriptionRich:
      'Keys authenticate the public REST API ({path}) so you can build your own automations. Send them as {authHeader}.',
    new: 'New API key',
    empty: 'No API keys yet.',
    emptyAdmin: 'Click New API key to create one.',
    emptyViewer: 'Ask an admin to create one.',
    revoked: 'Revoked',
    expired: 'Expired',
    noScopes: 'No scopes',
    created: 'Created {date}',
    lastUsed: 'last used {date}',
    neverUsed: 'never used',
    expires: 'expires {date}',
    revoke: 'Revoke',
    revokedToast: 'Revoked "{name}"',
    create: {
      title: 'New API key',
      description:
        'Name it after the integration that will use it, and grant only the scopes it needs.',
      revealTitle: 'Copy your API key',
      revealDescription:
        'This is the only time the full key is shown. Store it somewhere safe — if you lose it, revoke it and create a new one.',
      keyLabel: 'API key',
      name: 'Name',
      namePlaceholder: 'e.g. Zapier automation',
      scopes: 'Scopes',
      noScopesHint:
        'A key with no scopes can still call GET /api/v1/me to verify it works.',
      create: 'Create key',
      done: 'Done',
      errors: {
        nameRequired: 'Give the key a name',
        createFailed: 'Failed to create key',
        loadFailed: 'Failed to load API keys',
        revokeFailed: 'Failed to revoke key',
        copyManual: 'Copy failed — select and copy manually',
      },
      success: {
        copied: 'API key copied',
      },
    },
  },
  ai: {
    title: 'Agent setup',
    description: 'Configure the AI agent that replies in your inbox.',
    adminOnly: 'Only admins and owners can change the AI configuration.',
    loading: 'Loading…',
    provider: {
      title: 'Provider & key',
      description:
        'Your key is encrypted at rest (AES-256-GCM) and never shown again after saving.',
      providerLabel: 'Provider',
      modelLabel: 'Model',
      apiKeyLabel: 'API key',
      testKey: 'Test key',
      embeddingsKeyLabel: 'Embeddings key',
      embeddingsKeyOptional: '(optional — enables semantic knowledge-base search)',
      embeddingsPlaceholder: 'sk-... (OpenAI)',
      embeddingsHint:
        'An OpenAI key used only to embed your knowledge base (text-embedding-3-small){sameKey}. Leave blank to use keyword search instead. Clear it to turn semantic search off.',
      embeddingsSameKey: ' — can be the same key as above',
      providers: {
        openai: 'OpenAI',
        anthropic: 'Anthropic (Claude)',
      },
      modelHint:
        'Economy models work best for WhatsApp auto-replies. Premium models cost more tokens per message.',
      modelTiers: {
        economy: 'Economy',
        balanced: 'Balanced',
        premium: 'Premium',
      },
      modelRecommended: 'Recommended',
      modelCustom: 'Saved model (not in list)',
      models: {
        'gpt-5.4-mini': {
          label: 'GPT-5.4 mini',
          summary: 'Best value for automated customer replies',
          details:
            'OpenAI’s latest compact model. Fast responses, strong instruction-following, and natural tone in short threads. Best for WhatsApp auto-reply, triage, and FAQs when volume is high and cost per message matters.',
        },
        'gpt-4o-mini': {
          label: 'GPT-4o mini',
          summary: 'Very cheap, great for high volume',
          details:
            'Lightweight and well-established. Handles repetitive questions, confirmations, and short answers well. Uses few tokens — pick this when maximum savings matter more than deep reasoning.',
        },
        'gpt-4.1-mini': {
          label: 'GPT-4.1 mini',
          summary: 'Low cost with solid general quality',
          details:
            'Balance of price and context understanding. Coping better with longer business instructions and varied customer phrasing than 4o mini. A good middle ground when you want savings with a bit more nuance.',
        },
        'gpt-5.4': {
          label: 'GPT-5.4',
          summary: 'Smarter — for harder customer questions',
          details:
            'Full model for ambiguous questions, multiple intents in one message, or a large knowledge base. Moderate cost per reply; use when mini models fall short and you can spend a little more per conversation.',
        },
        'gpt-4o': {
          label: 'GPT-4o',
          summary: 'Proven quality, moderate cost',
          details:
            'OpenAI’s stable chat benchmark. Strong persona and context adherence — useful for inbox drafts and auto-reply when questions vary. Costs more than mini models but is predictable and reliable.',
        },
        'claude-haiku-4-5-20251001': {
          label: 'Claude Haiku 4.5',
          summary: 'Best Anthropic value for WhatsApp',
          details:
            'Fastest and cheapest in the current Claude line. Great for short replies, warm tone, and handoff when unsure. Recommended default for auto-reply and high volume with an Anthropic key.',
        },
        'claude-3-5-haiku-20241022': {
          label: 'Claude 3.5 Haiku',
          summary: 'Affordable and stable at scale',
          details:
            'Previous generation, still very cost-efficient. Fine for direct messages and simple flows. Prefer Haiku 4.5 if your account has access — it follows context and instructions more accurately.',
        },
        'claude-sonnet-4-5-20250929': {
          label: 'Claude Sonnet 4.5',
          summary: 'Balance of intelligence and price',
          details:
            'Anthropic’s middle tier: sharper reasoning than Haiku, cheaper than Opus. Good for rich knowledge bases, objections, or when customers send long, detailed messages.',
        },
        'claude-opus-4-6-20250514': {
          label: 'Claude Opus 4.6',
          summary: 'Top capability — use sparingly',
          details:
            'Flagship for hard cases: sensitive negotiations, many business rules, or answers that need maximum precision. High cost per message — reserve for manual drafts or premium accounts, not bulk auto-reply.',
        },
      },
    },
    behaviour: {
      title: 'Persona & behaviour',
      description:
        'Who the agent is, tone of voice, and what it may or may not promise. Persona takes priority over generic system instructions.',
      promptLabel: 'Persona & instructions',
      promptPlaceholder:
        'e.g. You are Gabriella from Wepost. Warm, concise WhatsApp tone. Introduce yourself on greetings…',
      examplesLabel: 'Conversation examples (optional)',
      examplesPlaceholder:
        'Customer: hi good afternoon\nYou: Hi! I\'m Gabriella from Wepost…\n\nCustomer: how much does it cost?\nYou: Investment depends on scope…',
      examplesHint:
        'Customer/You pairs that show the desired tone. The agent adapts to context — does not copy verbatim.',
      previewTitle: 'Tone preview',
      previewEmpty: 'Set persona and examples to preview how the agent should sound.',
      enableTitle: 'Enable AI assistant',
      enableDescription:
        'Master switch. Turns on the “Draft with AI” button in the inbox.',
      autoReplyTitle: 'Auto-reply to inbound messages',
      autoReplyDescription:
        'The bot answers new inbound messages automatically (only when no flow handles them and no agent is assigned). Hands off to a human when it can’t help.',
      maxRepliesLabel: 'Max auto-replies per conversation',
      maxRepliesDescription:
        'After this many bot replies in one thread, the bot goes quiet.',
      handoffTo: 'Hand off to',
      handoffToDesc:
        'When the bot can’t help, assign the conversation to this teammate (or leave it in the shared queue).',
      handoffQueue: 'Shared queue (unassigned)',
    },
    knowledge: {
      title: 'Knowledge base',
      description: 'Documents the agent can search when answering customers.',
      semanticOn: ' Semantic search is on (embeddings key set).',
      semanticOff:
        ' Using keyword search — add an embeddings key above for semantic search.',
      empty: 'No documents yet.',
      edit: 'Edit',
      delete: 'Delete',
      titleLabel: 'Title',
      titlePlaceholder: 'e.g. Returns & refunds policy',
      contentLabel: 'Content',
      contentPlaceholder:
        'Paste the FAQ answer, policy text, or product details…',
      cancel: 'Cancel',
      saveDocument: 'Save document',
      addDocument: 'Add document',
      reindex: 'Reindex',
      reindexTitle: 'Re-embed all documents (e.g. after adding an embeddings key)',
    },
    actions: {
      remove: 'Remove',
      save: 'Save',
    },
    toast: {
      loadFailed: 'Failed to load AI configuration',
      loadKnowledgeFailed: 'Failed to load knowledge base',
      testSuccess: 'Key works — the provider responded.',
      testFailed: 'The provider rejected the request.',
      testUnreachable: 'Could not reach the provider.',
      modelRequired: 'Enter a model name.',
      keyRequired: 'Enter your API key.',
      saveSuccess: 'AI assistant saved.',
      saveFailed: 'Failed to save.',
      removeSuccess: 'AI configuration removed.',
      removeFailed: 'Failed to remove.',
      openDocFailed: 'Failed to open document',
      titleContentRequired: 'Title and content are required.',
      docAdded: 'Document added.',
      docUpdated: 'Document updated.',
      docRemoved: 'Document removed.',
      reindexed: 'Reindexed {count} document(s).',
      reindexFailed: 'Reindex failed.',
    },
  },
} as const;

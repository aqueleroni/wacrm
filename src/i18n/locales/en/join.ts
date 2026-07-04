export const join = {
  loading: 'Verifying invitation…',
  invite: {
    title: "You're invited to {account}",
    role: "You'll join as {role}",
    validUntil: 'Link valid until {date}',
    accept: 'Accept invitation',
    accepting: 'Accepting…',
    acceptNote: 'Accepting moves your login into {account}. Your empty personal account from signup will be cleaned up.',
    createAndJoin: 'Create account & join',
    alreadyHaveAccount: 'I already have an account',
  },
  errors: {
    notFound: {
      title: 'Invite not found',
      body: "This link doesn't match a valid invitation. Double-check the URL or ask the person who invited you to send a new one.",
    },
    used: {
      title: 'Invite already used',
      body: "This invitation has already been accepted. If that wasn't you, ask the account admin to send a fresh link.",
    },
    expired: {
      title: 'Invite expired',
      body: 'This invitation has expired. Ask the account admin to send a new one — they take a few seconds to generate.',
    },
    serverError: {
      title: 'Something went wrong',
      body: "We couldn't verify this invitation right now. Try refreshing the page in a moment.",
    },
  },
  actions: {
    tryAgain: 'Try again',
    createAccount: 'Create a new account instead',
    signIn: 'Sign in',
  },
  conflict: {
    title: "Can't join {account} with this account",
    defaultMessage: 'You are already in another account. Sign in with a different email to join this one.',
    instructions: 'To join {account}, sign out and sign up again with a different email address. The invite link stays valid as long as it hasn\'t expired.',
    staySignedIn: 'Stay signed in',
    signOutAndRetry: 'Sign out & use a different email',
    signingOut: 'Signing out…',
  },
  toast: {
    welcome: 'Welcome to the team',
    acceptFailed: 'Failed to accept invitation',
    signOutFailed: 'Could not sign out. Try refreshing the page.',
  },
} as const;

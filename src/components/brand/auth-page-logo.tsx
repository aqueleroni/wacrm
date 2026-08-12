import { UsersRound } from 'lucide-react';
import { AppLogo } from './app-logo';

/** Centered brand mark for login / signup — always uses the default Wepost logo. */
export function AuthPageLogo({ inviteMode = false }: { inviteMode?: boolean }) {
  if (inviteMode) {
    return (
      <div className="mb-3 flex w-full justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <UsersRound className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 flex w-full justify-center">
      <div className="flex h-14 items-center justify-center rounded-xl bg-primary px-5 py-2.5">
        <AppLogo size={120} className="h-7 w-auto max-h-8 object-contain" />
      </div>
    </div>
  );
}

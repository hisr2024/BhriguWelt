'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { useAccount } from '@/lib/account';

/** "Me" page: optional sign-in, or who is signed in. */
export function AccountCard() {
  const { account, signedIn, ready } = useAccount();
  if (!ready) return null;
  return (
    <section className="nadi-card flex items-center justify-between gap-3" aria-labelledby="account-card-title">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full border border-[color:var(--line)] text-gold-300">
          <UserRound size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="nadi-eyebrow !text-[0.62rem]">Account</p>
          <h2 id="account-card-title" className="truncate text-[0.95rem] text-ivory">
            {signedIn ? account?.email : 'Keep Premium and profiles on all your devices'}
          </h2>
        </div>
      </div>
      <Link href="/account" className={signedIn ? 'nadi-btn-ghost flex-none' : 'nadi-btn flex-none'}>
        {signedIn ? 'Manage' : 'Sign in'}
      </Link>
    </section>
  );
}

export default AccountCard;

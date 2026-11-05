import Link from 'next/link';

export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/" className="flex h-11 w-fit items-center font-display text-lg uppercase tracking-[0.08em] text-gold-200">BhriguWelt</Link>
      <h1 className="mt-6 text-4xl text-ivory">{title}</h1>
      {updated && <p className="mt-2 text-xs text-ivory-muted">Last updated {updated}</p>}
      <div className="legal-prose mt-8 space-y-6 text-[0.95rem] leading-relaxed text-ivory-2">{children}</div>
      <nav aria-label="Legal" className="mt-12 flex gap-1 border-t border-[color:var(--line)] pt-4 text-sm text-ivory-muted">
        <Link href="/privacy" className="flex h-11 items-center px-2 hover:text-ivory">Privacy</Link>
        <Link href="/terms" className="flex h-11 items-center px-2 hover:text-ivory">Terms</Link>
        <Link href="/impressum" className="flex h-11 items-center px-2 hover:text-ivory">Impressum</Link>
      </nav>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-2xl text-ivory">{title}</h2>
      {children}
    </section>
  );
}

export function OperatorBlock({ name, address, email, phone }: { name: string; address: string; email: string; phone?: string }) {
  if (!name || !address || !email) {
    return (
      <p className="rounded-xl border border-[color:var(--line)] px-4 py-3 text-ivory-muted">
        Operator name, postal address and contact email are being added.
      </p>
    );
  }
  return (
    <address className="not-italic">
      {name}
      <br />
      {address.split('\n').map((line) => (
        <span key={line}>{line}<br /></span>
      ))}
      Email: <a className="text-gold-300 underline underline-offset-4" href={`mailto:${email}`}>{email}</a>
      {phone && (<><br />Phone: {phone}</>)}
    </address>
  );
}

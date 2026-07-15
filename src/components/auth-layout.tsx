import Link from "next/link";

export function AuthLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Link href="/" className="font-display text-2xl text-brand-dark">
          Prateleira
        </Link>
        <h1 className="mt-4 font-display text-3xl">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

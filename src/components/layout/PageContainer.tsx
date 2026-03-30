import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function PageContainer({ title, description, children }: Props) {
  return (
    <main className="space-y-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </header>
      {children}
    </main>
  );
}


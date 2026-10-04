interface PagePlaceholderProps {
  title: string;
  description: string;
  note: string;
}

export function PagePlaceholder({
  title,
  description,
  note,
}: PagePlaceholderProps) {
  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-secondary">{description}</p>
      </header>

      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
        {note}
      </p>
    </section>
  );
}

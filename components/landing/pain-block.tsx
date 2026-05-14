type PainBlockProps = {
  children: React.ReactNode;
};

export function PainBlock({ children }: PainBlockProps) {
  return (
    <section className="py-12 px-4">
      <div className="max-w-2xl mx-auto prose prose-sm prose-p:text-muted-foreground prose-strong:text-foreground">
        {children}
      </div>
    </section>
  );
}

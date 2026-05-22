export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-1px)] flex-1 flex-col bg-warm">
      <div className="flex flex-1 flex-col bg-background pb-12 pt-8">{children}</div>
    </div>
  );
}

export default function SuspendedSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-soft-pink text-text">{children}</div>;
}

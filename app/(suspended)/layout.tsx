import { Toaster } from "sonner";

export default function SuspendedSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-soft-pink text-text">
      {children}
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

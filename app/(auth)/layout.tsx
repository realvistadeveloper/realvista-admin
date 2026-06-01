// app/(auth)/layout.tsx
// Bare shell for unauthenticated pages (login, etc.).
// Route protection is handled by middleware.ts — no async session check needed here.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

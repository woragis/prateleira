import { LoginForm } from "@/components/auth-forms";
import { AuthLayout } from "@/components/auth-layout";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AuthLayout title="Entrar">
      <LoginForm callbackUrl={sp.callbackUrl} />
    </AuthLayout>
  );
}

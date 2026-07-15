import { RegisterForm } from "@/components/auth-forms";
import { AuthLayout } from "@/components/auth-layout";

export default function RegisterPage() {
  return (
    <AuthLayout title="Criar conta">
      <RegisterForm />
    </AuthLayout>
  );
}

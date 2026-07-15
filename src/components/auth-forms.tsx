"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  registerAction,
  type AuthActionState,
} from "@/actions/auth";

const initial: AuthActionState = {};

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl || "/app/dashboard"} />
      <Field label="E-mail" name="email" type="email" required />
      <Field label="Senha" name="password" type="password" required />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link href="/register" className="text-brand underline">
          Começar trial
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <form action={action} className="space-y-4">
      <Field label="Seu nome" name="name" required />
      <Field label="E-mail" name="email" type="email" required />
      <Field label="Senha" name="password" type="password" required />
      <Field label="Nome do negócio" name="organizationName" required />
      <Field label="Nome da loja" name="shopName" placeholder="Opcional" />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Criando…" : "Criar conta (14 dias grátis)"}
      </button>
      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
      />
    </label>
  );
}

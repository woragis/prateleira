import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { addMemberAction } from "@/actions/shops";

export default async function TeamPage() {
  const { org, session } = await requireRole(["OWNER", "MANAGER"]);
  const members = await prisma.membership.findMany({
    where: { organizationId: org.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Equipe</h1>
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
          >
            <div>
              <div className="font-medium">{m.user.name}</div>
              <div className="text-muted">{m.user.email}</div>
            </div>
            <span className="text-muted">{m.role}</span>
          </li>
        ))}
      </ul>

      {(session.user.role === "OWNER" || session.user.role === "MANAGER") && (
        <form action={addMemberAction} className="max-w-md space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Adicionar funcionário</h2>
          <input name="name" required placeholder="Nome" className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="E-mail" className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input name="password" type="password" required placeholder="Senha temporária" className="w-full rounded-xl border px-3 py-2 text-sm" />
          <select name="role" className="w-full rounded-xl border px-3 py-2 text-sm" defaultValue="CASHIER">
            <option value="CASHIER">Caixa</option>
            <option value="MANAGER">Gerente</option>
          </select>
          <button type="submit" className="rounded-xl bg-brand px-4 py-2 text-sm text-white">
            Adicionar
          </button>
        </form>
      )}
    </div>
  );
}

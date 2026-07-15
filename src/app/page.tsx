import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 0%, #d9ecd9 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 20%, #f0e0c4 0%, transparent 50%), linear-gradient(180deg, #f4f7f2 0%, #e8f0e6 100%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="flex items-center justify-between">
          <span className="font-display text-3xl text-brand-dark">Prateleira</span>
          <div className="flex gap-3 text-sm">
            {session ? (
              <Link
                href="/app/dashboard"
                className="rounded-full bg-brand px-4 py-2 text-white"
              >
                Abrir app
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-full px-4 py-2 text-brand-dark">
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-brand px-4 py-2 text-white"
                >
                  Trial 14 dias
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="mt-20 max-w-2xl">
          <h1 className="font-display text-5xl leading-tight text-brand-dark sm:text-6xl">
            A prateleira do seu mercado, em ordem.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Estoque com lotes e validade, PDV com dinheiro/PIX/cartão, equipe com
            papéis e assinatura Stripe — feito para mercearias que precisam vender
            e controlar o que tem na prateleira.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Começar grátis
            </Link>
            <a
              href="#precos"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium"
            >
              Ver planos
            </a>
          </div>
        </section>

        <section className="mt-24 grid gap-6 sm:grid-cols-3">
          {[
            ["Lotes & validade", "Entrada por lote, baixa FIFO e alertas de vencimento."],
            ["PDV real", "Caixa escolhe forma de pagamento; estoque atualiza na hora."],
            ["Equipe & Stripe", "Dono, gerente e caixa. Cobrança recorrente pronta."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur">
              <h2 className="font-display text-xl">{t}</h2>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </div>
          ))}
        </section>

        <section id="precos" className="mt-24 pb-24">
          <h2 className="font-display text-3xl text-brand-dark">Planos</h2>
          <p className="mt-2 text-muted">
            Trial de 14 dias inclusos. Cancele quando quiser no portal Stripe.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <PlanCard
              name="Essencial"
              price="R$ 97"
              items={["1 loja", "Até 5 usuários", "Catálogo, lotes e PDV", "Dashboard"]}
            />
            <PlanCard
              name="Profissional"
              price="R$ 197"
              highlight
              items={[
                "Até 20 lojas",
                "Até 50 usuários",
                "Tudo do Essencial",
                "Ideal multi-filial",
              ]}
            />
          </div>
          <p className="mt-6 text-sm text-muted">
            Fora do escopo atual: NFC-e/NF-e e TEF de maquininha (roadmap).
          </p>
        </section>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  items,
  highlight,
}: {
  name: string;
  price: string;
  items: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight
          ? "border-accent bg-card shadow-sm"
          : "border-border bg-card/80"
      }`}
    >
      <h3 className="font-display text-2xl">{name}</h3>
      <p className="mt-2 text-3xl font-semibold">
        {price}
        <span className="text-base font-normal text-muted">/mês</span>
      </p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {items.map((i) => (
          <li key={i}>• {i}</li>
        ))}
      </ul>
      <Link
        href="/register"
        className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 text-sm text-white"
      >
        Começar trial
      </Link>
    </div>
  );
}

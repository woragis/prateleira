"use client";

import { useTransition } from "react";
import { setActiveShopAction } from "@/actions/shops";

export function ShopSwitcher({
  shops,
  activeShopId,
}: {
  shops: { id: string; name: string }[];
  activeShopId: string | null;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted" htmlFor="shopId">
        Loja
      </label>
      <select
        id="shopId"
        name="shopId"
        disabled={pending || shops.length === 0}
        defaultValue={activeShopId ?? undefined}
        onChange={(e) => {
          const id = e.target.value;
          start(async () => {
            await setActiveShopAction(id);
          });
        }}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
      >
        {shops.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

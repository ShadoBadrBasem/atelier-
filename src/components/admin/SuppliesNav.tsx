import { Tabs } from "./kit";

/** Sub-navigation shared by the Supplies & costs pages. */
export function SuppliesNav({ current }: { current: "stock" | "suppliers" | "costs" }) {
  return (
    <div>
      <Tabs
        current={current}
        items={[
          { key: "stock", label: "Stock", href: "/admin/supplies" },
          { key: "suppliers", label: "Suppliers", href: "/admin/supplies/suppliers" },
          { key: "costs", label: "Costs", href: "/admin/supplies/costs" },
        ]}
      />
    </div>
  );
}

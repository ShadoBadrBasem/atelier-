import { db } from "@/lib/db";
import { GalleryView } from "./GalleryView";

/** Server wrapper: loads a client's or an order's attachments. */
export async function Gallery({
  orderId,
  clientId,
  defaultCategory,
}: {
  orderId?: string;
  clientId?: string;
  defaultCategory?: string;
}) {
  const rows = await db.attachment.findMany({
    where: orderId ? { orderId } : { clientId, orderId: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return (
    <GalleryView
      owner={orderId ? { orderId } : { clientId }}
      allowShare={!!orderId}
      defaultCategory={defaultCategory}
      items={rows.map((a) => ({
        id: a.id,
        category: a.category,
        caption: a.caption,
        isCover: a.isCover,
        sharedOnTracking: a.sharedOnTracking,
        isPdf: a.mime === "application/pdf",
        sizeBytes: a.sizeBytes,
      }))}
    />
  );
}

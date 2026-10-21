-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "eventType" TEXT,
    "eventDate" DATETIME,
    "notes" TEXT,
    "discountKind" TEXT NOT NULL DEFAULT 'none',
    "discountMode" TEXT NOT NULL DEFAULT 'percent',
    "discountValue" INTEGER NOT NULL DEFAULT 0,
    "discountReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("createdAt", "email", "eventDate", "eventType", "id", "language", "name", "notes", "phone", "updatedAt", "whatsapp") SELECT "createdAt", "email", "eventDate", "eventType", "id", "language", "name", "notes", "phone", "updatedAt", "whatsapp" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

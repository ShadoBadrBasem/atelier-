-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueDate" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" DATETIME,
    "recurrence" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "clientId" TEXT,
    "orderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("clientId", "createdAt", "done", "doneAt", "dueDate", "id", "notes", "orderId", "priority", "recurrence", "title") SELECT "clientId", "createdAt", "done", "doneAt", "dueDate", "id", "notes", "orderId", "priority", "recurrence", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

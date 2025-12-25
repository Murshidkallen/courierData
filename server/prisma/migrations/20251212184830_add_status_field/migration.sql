-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Courier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slipNo" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unit" TEXT,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "salesExecutiveId" INTEGER,
    "commissionPct" REAL,
    "commissionAmount" REAL,
    "courierPaid" REAL,
    "totalPaid" REAL,
    "address" TEXT,
    "courierCost" REAL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "trackingId" TEXT NOT NULL,
    "packingCost" REAL,
    "profit" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Courier_salesExecutiveId_fkey" FOREIGN KEY ("salesExecutiveId") REFERENCES "SalesExecutive" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Courier" ("address", "commissionAmount", "commissionPct", "courierCost", "courierPaid", "createdAt", "customerName", "date", "id", "packingCost", "phoneNumber", "profit", "salesExecutiveId", "slipNo", "totalPaid", "trackingId", "unit", "updatedAt") SELECT "address", "commissionAmount", "commissionPct", "courierCost", "courierPaid", "createdAt", "customerName", "date", "id", "packingCost", "phoneNumber", "profit", "salesExecutiveId", "slipNo", "totalPaid", "trackingId", "unit", "updatedAt" FROM "Courier";
DROP TABLE "Courier";
ALTER TABLE "new_Courier" RENAME TO "Courier";
CREATE UNIQUE INDEX "Courier_trackingId_key" ON "Courier"("trackingId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

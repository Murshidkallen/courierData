-- CreateTable
CREATE TABLE "Partner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "month" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "visibleFields" TEXT NOT NULL DEFAULT '*',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "id", "password", "role", "username") SELECT "createdAt", "id", "password", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
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
    "pincode" TEXT,
    "courierCost" REAL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "trackingId" TEXT NOT NULL,
    "packingCost" REAL,
    "profit" REAL,
    "partnerId" INTEGER,
    "enteredById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Courier_salesExecutiveId_fkey" FOREIGN KEY ("salesExecutiveId") REFERENCES "SalesExecutive" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Courier_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Courier_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Courier" ("address", "commissionAmount", "commissionPct", "courierCost", "courierPaid", "createdAt", "customerName", "date", "id", "packingCost", "phoneNumber", "profit", "salesExecutiveId", "slipNo", "status", "totalPaid", "trackingId", "unit", "updatedAt") SELECT "address", "commissionAmount", "commissionPct", "courierCost", "courierPaid", "createdAt", "customerName", "date", "id", "packingCost", "phoneNumber", "profit", "salesExecutiveId", "slipNo", "status", "totalPaid", "trackingId", "unit", "updatedAt" FROM "Courier";
DROP TABLE "Courier";
ALTER TABLE "new_Courier" RENAME TO "Courier";
CREATE UNIQUE INDEX "Courier_trackingId_key" ON "Courier"("trackingId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Partner_name_key" ON "Partner"("name");

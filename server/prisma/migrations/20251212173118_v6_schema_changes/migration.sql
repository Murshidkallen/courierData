-- CreateTable
CREATE TABLE "Courier" (
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
    "trackingId" TEXT NOT NULL,
    "packingCost" REAL,
    "profit" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Courier_salesExecutiveId_fkey" FOREIGN KEY ("salesExecutiveId") REFERENCES "SalesExecutive" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cost" REAL,
    "price" REAL,
    "courierId" INTEGER NOT NULL,
    CONSTRAINT "Product_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesExecutive" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "rate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Courier_trackingId_key" ON "Courier"("trackingId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

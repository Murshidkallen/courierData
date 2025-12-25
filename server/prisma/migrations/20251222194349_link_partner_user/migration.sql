-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Partner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rate" REAL,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Partner" ("createdAt", "id", "name", "rate") SELECT "createdAt", "id", "name", "rate" FROM "Partner";
DROP TABLE "Partner";
ALTER TABLE "new_Partner" RENAME TO "Partner";
CREATE UNIQUE INDEX "Partner_name_key" ON "Partner"("name");
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

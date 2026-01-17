import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const cleanupStaleUploads = async () => {
  const staleUploads = await prisma.upload.findMany({
    where: {
      status: "UPLOADING",
      created_at: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  for (const upload of staleUploads) {
    const filePath = path.join("storage", `${upload.id}.bin`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.upload.delete({
      where: { id: upload.id },
    });
  }
};

import prisma from "@/lib/prisma";

export async function logSystemAction(source, severity, message) {
  try {
    // Write log to DB
    await prisma.systemLog.create({
      data: {
        source,
        severity,
        message,
      }
    });

    // Handle pruning
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" }
    });

    if (settings && settings.logRetentionDays && settings.logRetentionDays !== "0") {
      const days = parseInt(settings.logRetentionDays, 10);
      if (!isNaN(days) && days > 0) {
        const pruneDate = new Date();
        pruneDate.setDate(pruneDate.getDate() - days);
        
        await prisma.systemLog.deleteMany({
          where: {
            createdAt: {
              lt: pruneDate
            }
          }
        });
      }
    }
  } catch (err) {
    console.error("Failed to log system action:", err);
  }
}

"use server";

import { prisma } from "@/lib/db/client";
import { UserSettingsSchema, type UserSettingsData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

const DEFAULT_USER_ID = "local";

export async function getSettings() {
  const settings = await prisma.userSettings.findUnique({
    where: { userId: DEFAULT_USER_ID },
  });
  if (!settings) {
    return prisma.userSettings.create({
      data: { userId: DEFAULT_USER_ID },
    });
  }
  return settings;
}

export async function updateSettings(raw: UserSettingsData) {
  const data = UserSettingsSchema.parse(raw);
  await prisma.userSettings.upsert({
    where: { userId: DEFAULT_USER_ID },
    update: data,
    create: { userId: DEFAULT_USER_ID, ...data },
  });
  revalidatePath("/settings");
  return { success: true };
}

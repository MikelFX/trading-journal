"use server";

import { prisma } from "@/lib/db/client";
import { SetupFormSchema, type SetupFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

const DEFAULT_USER_ID = "local";

export async function getSetups() {
  return prisma.setup.findMany({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { name: "asc" },
  });
}

export async function createSetup(raw: SetupFormData) {
  const data = SetupFormSchema.parse(raw);
  const setup = await prisma.setup.create({
    data: { userId: DEFAULT_USER_ID, ...data },
  });
  revalidatePath("/settings");
  revalidatePath("/trades/new");
  return { success: true, setupId: setup.id };
}

export async function updateSetup(id: string, raw: SetupFormData) {
  const data = SetupFormSchema.parse(raw);
  await prisma.setup.update({ where: { id }, data });
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteSetup(id: string) {
  await prisma.setup.delete({ where: { id } });
  revalidatePath("/settings");
  revalidatePath("/trades");
  return { success: true };
}

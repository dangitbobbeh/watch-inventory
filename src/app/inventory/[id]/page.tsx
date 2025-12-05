import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WatchForm from "./watch-form";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const watch = await prisma.watch.findUnique({
    where: { id },
  });

  if (!watch) {
    notFound();
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Edit Watch</h1>
      <WatchForm watch={watch} />
    </main>
  );
}

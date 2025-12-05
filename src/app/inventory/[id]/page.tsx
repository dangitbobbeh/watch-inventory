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

  // Serialize Decimal fields to numbers for the client component
  const serializedWatch = {
    ...watch,
    purchasePrice: watch.purchasePrice ? Number(watch.purchasePrice) : null,
    additionalCosts: watch.additionalCosts
      ? Number(watch.additionalCosts)
      : null,
    salePrice: watch.salePrice ? Number(watch.salePrice) : null,
    platformFees: watch.platformFees ? Number(watch.platformFees) : null,
    salesTax: watch.salesTax ? Number(watch.salesTax) : null,
    marketingCosts: watch.marketingCosts ? Number(watch.marketingCosts) : null,
    shippingCosts: watch.shippingCosts ? Number(watch.shippingCosts) : null,
  };

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Edit Watch</h1>
      <WatchForm watch={serializedWatch} />
    </main>
  );
}

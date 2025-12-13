import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const {
    outgoingWatchId,
    tradeValue,
    cashDifference,
    tradeCounterparty,
    tradeDate,
    incomingWatch,
  } = data;

  const outgoing = await prisma.watch.findUnique({
    where: { id: outgoingWatchId },
  });

  if (!outgoing || outgoing.userId !== session.user.id) {
    return NextResponse.json({ error: "Watch not found" }, { status: 404 });
  }

  if (outgoing.status !== "in_stock") {
    return NextResponse.json(
      { error: "Can only trade watches that are in stock" },
      { status: 400 }
    );
  }

  const incomingCostBasis = tradeValue - (cashDifference || 0);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newWatch = await tx.watch.create({
        data: {
          userId: session.user.id,
          brand: incomingWatch.brand,
          model: incomingWatch.model,
          reference: incomingWatch.reference || null,
          serial: incomingWatch.serial || null,
          year: incomingWatch.year || null,
          caliber: incomingWatch.caliber || null,
          caseMaterial: incomingWatch.caseMaterial || null,
          dialColor: incomingWatch.dialColor || null,
          diameter: incomingWatch.diameter
            ? parseInt(incomingWatch.diameter)
            : null,
          condition: incomingWatch.condition || null,
          accessories: incomingWatch.accessories || null,
          notes: incomingWatch.notes || null,
          purchasePrice: incomingCostBasis,
          purchaseDate: tradeDate ? new Date(tradeDate) : new Date(),
          purchaseSource: `Trade - ${tradeCounterparty || "Unknown"}`,
          status: "in_stock",
        },
      });

      const updatedOutgoing = await tx.watch.update({
        where: { id: outgoingWatchId },
        data: {
          status: "traded",
          saleDate: tradeDate ? new Date(tradeDate) : new Date(),
          salePrice: tradeValue,
          salePlatform: "Trade",
          tradeValue: tradeValue,
          tradeCounterparty: tradeCounterparty || null,
          tradedForWatchId: newWatch.id,
        },
      });

      return { outgoing: updatedOutgoing, incoming: newWatch };
    });

    return NextResponse.json({
      success: true,
      outgoingWatch: result.outgoing,
      incomingWatch: result.incoming,
      summary: {
        tradedAway: `${result.outgoing.brand} ${result.outgoing.model}`,
        received: `${result.incoming.brand} ${result.incoming.model}`,
        tradeValue,
        cashDifference,
        costBasis: incomingCostBasis,
      },
    });
  } catch (error) {
    console.error("Trade error:", error);
    return NextResponse.json(
      { error: "Failed to process trade" },
      { status: 500 }
    );
  }
}

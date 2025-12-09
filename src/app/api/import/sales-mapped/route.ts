import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { parseDate, parseNumber, cleanString } from '@/lib/import-utils';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await request.json();
  
  let success = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const importId = cleanString(row.importId);
      
      if (!importId) {
        errors.push(`Row ${i + 1}: missing Watch ID`);
        continue;
      }

      const watch = await prisma.watch.findFirst({
        where: { 
          importId,
          userId: session.user.id,
        },
      });

      if (!watch) {
        errors.push(`Row ${i + 1}: Watch ID "${importId}" not found in inventory`);
        continue;
      }

      // Parse and merge custom data
      let customData = (watch.customData as Record<string, unknown>) || {};
      if (row._customData) {
        try {
          const newCustomData = JSON.parse(row._customData);
          customData = { ...customData, ...newCustomData };
        } catch {
          // Ignore parse errors
        }
      }

      await prisma.watch.update({
        where: { id: watch.id },
        data: {
          saleDate: parseDate(row.saleDate),
          salePrice: parseNumber(row.salePrice),
          salePlatform: cleanString(row.salePlatform),
          platformFees: parseNumber(row.platformFees),
          salesTax: parseNumber(row.salesTax),
          marketingCosts: parseNumber(row.marketingCosts),
          shippingCosts: parseNumber(row.shippingCosts),
          status: 'sold',
          customData: Object.keys(customData).length > 0 ? customData as Prisma.JsonObject : Prisma.JsonNull,
        },
      });

      success++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Row ${i + 1}: ${msg}`);
    }
  }

  return NextResponse.json({ success, errors });
}

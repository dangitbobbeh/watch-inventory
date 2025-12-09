import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { transformInventoryRow, validateRequiredFields } from '@/lib/import-utils';

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
      // Validate required fields
      const validation = validateRequiredFields(row, ['brand', 'model']);
      if (!validation.valid) {
        errors.push(`Row ${i + 1}: missing ${validation.missing.join(', ')}`);
        continue;
      }

      // Transform the row
      const { data, customData } = transformInventoryRow(row);

      await prisma.watch.create({
        data: {
          userId: session.user.id,
          importId: data.importId as string | null,
          brand: data.brand as string,
          model: data.model as string,
          reference: data.reference as string | null,
          serial: data.serial as string | null,
          year: data.year as string | null,
          caseMaterial: data.caseMaterial as string | null,
          dialColor: data.dialColor as string | null,
          diameter: data.diameter as number | null,
          condition: data.condition as string | null,
          accessories: data.accessories as string | null,
          notes: data.notes as string | null,
          purchaseDate: data.purchaseDate as Date | null,
          purchaseSource: data.purchaseSource as string | null,
          purchasePrice: data.purchasePrice as number | null,
          purchaseShippingCost: data.purchaseShippingCost as number | null,
          additionalCosts: data.additionalCosts as number | null,
          saleDate: data.saleDate as Date | null,
          salePrice: data.salePrice as number | null,
          salePlatform: data.salePlatform as string | null,
          platformFees: data.platformFees as number | null,
          salesTax: data.salesTax as number | null,
          marketingCosts: data.marketingCosts as number | null,
          shippingCosts: data.shippingCosts as number | null,
          status: data.status as string,
          customData: Object.keys(customData).length > 0 ? customData : null,
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

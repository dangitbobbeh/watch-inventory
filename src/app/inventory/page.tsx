import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import InventoryFilters from "./inventory-filters";
import InventoryTable from "./inventory-table";

type SearchParams = {
  q?: string;
  status?: string;
  source?: string;
  platform?: string;
  sort?: string;
  order?: string;
  page?: string;
  pageSize?: string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const {
    q,
    status,
    source,
    platform,
    sort = "createdAt",
    order = "desc",
    page = "1",
    pageSize = String(DEFAULT_PAGE_SIZE),
  } = params;

  const currentPage = Math.max(1, parseInt(page));
  const currentPageSize = PAGE_SIZE_OPTIONS.includes(parseInt(pageSize))
    ? parseInt(pageSize)
    : DEFAULT_PAGE_SIZE;

  const where: Record<string, unknown> = { userId: session.user.id };

  if (q) {
    where.OR = [
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { serial: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (source) {
    where.purchaseSource = { contains: source, mode: "insensitive" };
  }

  if (platform) {
    where.salePlatform = { contains: platform, mode: "insensitive" };
  }

  const totalCount = await prisma.watch.count({ where });
  const totalPages = Math.ceil(totalCount / currentPageSize);

  const orderBy: Record<string, string> = {};
  const validSortFields = [
    "brand",
    "model",
    "createdAt",
    "purchasePrice",
    "salePrice",
    "status",
    "purchaseDate",
  ];
  if (validSortFields.includes(sort)) {
    orderBy[sort] = order === "asc" ? "asc" : "desc";
  } else {
    orderBy.createdAt = "desc";
  }

  const watches = await prisma.watch.findMany({
    where,
    orderBy,
    skip: (currentPage - 1) * currentPageSize,
    take: currentPageSize,
  });

  const allWatches = await prisma.watch.findMany({
    where: { userId: session.user.id },
    select: { purchaseSource: true, salePlatform: true },
  });

  const sources = [
    ...new Set(allWatches.map((w) => w.purchaseSource).filter(Boolean)),
  ] as string[];
  const platforms = [
    ...new Set(allWatches.map((w) => w.salePlatform).filter(Boolean)),
  ] as string[];

  const serializedWatches = watches.map((w) => ({
    id: w.id,
    brand: w.brand,
    model: w.model,
    reference: w.reference,
    status: w.status,
    purchaseSource: w.purchaseSource,
    purchasePrice: w.purchasePrice ? Number(w.purchasePrice) : null,
    purchaseShippingCost: w.purchaseShippingCost
      ? Number(w.purchaseShippingCost)
      : null,
    additionalCosts: w.additionalCosts ? Number(w.additionalCosts) : null,
    salePrice: w.salePrice ? Number(w.salePrice) : null,
    platformFees: w.platformFees ? Number(w.platformFees) : null,
    marketingCosts: w.marketingCosts ? Number(w.marketingCosts) : null,
    shippingCosts: w.shippingCosts ? Number(w.shippingCosts) : null,
    salesTax: w.salesTax ? Number(w.salesTax) : null,
  }));

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Inventory</h1>
      </div>

      <InventoryFilters
        sources={sources}
        platforms={platforms}
        currentFilters={params}
      />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalCount} {totalCount === 1 ? "watch" : "watches"} found
        </p>
        <div className="flex items-center gap-4">
          <PageSizeSelector
            currentPageSize={currentPageSize}
            searchParams={params}
          />
          {totalPages > 1 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
          )}
        </div>
      </div>

      <InventoryTable watches={serializedWatches} sort={sort} order={order} />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={params}
        />
      )}
    </main>
  );
}

function PageSizeSelector({
  currentPageSize,
  searchParams,
}: {
  currentPageSize: number;
  searchParams: SearchParams;
}) {
  function getPageSizeUrl(size: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "pageSize" && key !== "page") params.set(key, value);
    });
    params.set("pageSize", size.toString());
    return `/inventory?${params.toString()}`;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400">Show:</span>
      <div className="flex gap-1">
        {PAGE_SIZE_OPTIONS.map((size) => (
          <Link
            key={size}
            href={getPageSizeUrl(size)}
            className={`px-2 py-1 rounded ${
              size === currentPageSize
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {size}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: SearchParams;
}) {
  function getPageUrl(page: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") params.set(key, value);
    });
    params.set("page", page.toString());
    return `/inventory?${params.toString()}`;
  }

  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Link
        href={getPageUrl(currentPage - 1)}
        className={`px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm ${
          currentPage === 1
            ? "pointer-events-none opacity-50"
            : "hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        Previous
      </Link>

      {pages.map((page, i) =>
        typeof page === "number" ? (
          <Link
            key={i}
            href={getPageUrl(page)}
            className={`px-3 py-2 rounded-lg text-sm ${
              page === currentPage
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {page}
          </Link>
        ) : (
          <span key={i} className="px-2 text-gray-400">
            ...
          </span>
        )
      )}

      <Link
        href={getPageUrl(currentPage + 1)}
        className={`px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm ${
          currentPage === totalPages
            ? "pointer-events-none opacity-50"
            : "hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        Next
      </Link>
    </div>
  );
}

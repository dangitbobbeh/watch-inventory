export default function Home() {
  return (
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Watch Inventory</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard title="In Stock" value={0} />
        <DashboardCard title="Total Sold" value={0} />
        <DashboardCard title="Total Profit" value="$0" />
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

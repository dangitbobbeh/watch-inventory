import Link from "next/link";
import {
  Package,
  BarChart3,
  MessageSquare,
  Upload,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
};

export default function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white border rounded-lg p-12 text-center">
      <Icon className="mx-auto text-gray-300 mb-4" size={48} />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export const emptyStates = {
  inventory: {
    icon: Package,
    title: "No watches yet",
    description:
      "Get started by adding your first watch to track your inventory and profits.",
    action: { label: "Add Watch", href: "/inventory/new" },
  },
  reports: {
    icon: BarChart3,
    title: "No sales data yet",
    description:
      "Once you record some sales, you'll see detailed analytics and reports here.",
    action: { label: "View Inventory", href: "/inventory" },
  },
  chat: {
    icon: MessageSquare,
    title: "Start a conversation",
    description:
      "Ask me anything about your watch business—inventory, profits, trends, and more.",
  },
  search: {
    icon: Package,
    title: "No watches found",
    description:
      "Try adjusting your search or filters to find what you're looking for.",
    action: { label: "Clear Filters", href: "/inventory" },
  },
  import: {
    icon: Upload,
    title: "Import your data",
    description: "Upload your inventory and sales CSVs to get started quickly.",
  },
  profit: {
    icon: TrendingUp,
    title: "No profit data yet",
    description:
      "Sell some watches to start tracking your profits and performance.",
    action: { label: "View Inventory", href: "/inventory" },
  },
};

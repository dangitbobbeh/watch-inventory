import { render, screen } from "@testing-library/react";
import EmptyState, { emptyStates } from "../../app/components/empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={emptyStates.inventory.icon}
        title="No watches"
        description="Add your first watch"
      />
    );

    expect(screen.getByText("No watches")).toBeInTheDocument();
    expect(screen.getByText("Add your first watch")).toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    render(
      <EmptyState
        icon={emptyStates.inventory.icon}
        title="No watches"
        description="Add your first watch"
        action={{ label: "Add Watch", href: "/inventory/new" }}
      />
    );

    const link = screen.getByRole("link", { name: "Add Watch" });
    expect(link).toHaveAttribute("href", "/inventory/new");
  });

  it("does not render action button when not provided", () => {
    render(
      <EmptyState
        icon={emptyStates.inventory.icon}
        title="No watches"
        description="Add your first watch"
      />
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

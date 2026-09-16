// Component tests for Kbd, Badge, Separator, Skeleton, and Spinner primitives
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, Kbd, Separator, Skeleton, Spinner } from "@/shared/ui";

describe("Kbd", () => {
  it("renders as a <kbd> with a label", () => {
    render(<Kbd>Ctrl+K</Kbd>);
    expect(screen.getByText("Ctrl+K").tagName).toBe("KBD");
  });
});

describe("Badge", () => {
  it("applies variant classes for each tone", () => {
    const { rerender } = render(<Badge variant="default">Info</Badge>);
    expect(screen.getByText("Info")).toHaveClass("text-fg-muted");
    rerender(<Badge variant="success">Saved</Badge>);
    expect(screen.getByText("Saved")).toHaveClass("text-success");
    rerender(<Badge variant="warning">Pending</Badge>);
    expect(screen.getByText("Pending")).toHaveClass("text-warning");
    rerender(<Badge variant="danger">Failed</Badge>);
    expect(screen.getByText("Failed")).toHaveClass("text-danger");
    rerender(<Badge variant="info">Notice</Badge>);
    expect(screen.getByText("Notice")).toHaveClass("text-info");
  });
});

describe("Separator", () => {
  it("renders a decorative horizontal rule by default", () => {
    render(<Separator />);
    const rule = document.querySelector('[data-orientation="horizontal"]');
    expect(rule).not.toBeNull();
    expect(rule).toHaveClass("h-px", "w-full");
  });

  it("renders a vertical rule when requested", () => {
    render(<Separator orientation="vertical" />);
    expect(document.querySelector('[data-orientation="vertical"]')).toHaveClass(
      "h-full",
      "w-px",
    );
  });
});

describe("Skeleton", () => {
  it("renders a pulsing placeholder element", () => {
    render(<Skeleton className="h-4 w-20" />);
    expect(document.querySelector(".animate-pulse")).toHaveClass("h-4", "w-20");
  });
});

describe("Spinner", () => {
  it("is announced as a status region with an accessible label", () => {
    render(<Spinner label="Saving" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Saving")).toHaveClass("sr-only");
  });

  it("renders without a label when not provided", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

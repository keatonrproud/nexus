import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default props", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole("progressbar");
    expect(spinner).toBeInTheDocument();
  });

  it("renders with custom size", () => {
    render(<LoadingSpinner size={60} />);

    const spinner = screen.getByRole("progressbar");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ width: "60px", height: "60px" });
  });

  it("renders with custom message", () => {
    const message = "Loading data...";
    render(<LoadingSpinner message={message} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("renders with default message when not provided", () => {
    render(<LoadingSpinner />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders without message when empty string provided", () => {
    render(<LoadingSpinner message="" />);

    const spinner = screen.getByRole("progressbar");
    expect(spinner).toBeInTheDocument();
  });
});

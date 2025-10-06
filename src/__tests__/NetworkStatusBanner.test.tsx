import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import * as useNetworkStatusModule from "@/hooks/useNetworkStatus";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the useNetworkStatus hook
vi.mock("@/hooks/useNetworkStatus");

const mockUseNetworkStatus = vi.mocked(useNetworkStatusModule.useNetworkStatus);

describe("NetworkStatusBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when user is online", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isOffline: false
    });

    render(<NetworkStatusBanner />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders banner when user is offline", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    render(<NetworkStatusBanner />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it("shows appropriate offline message", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    render(<NetworkStatusBanner />);

    // Use getAllByText to handle StrictMode double-rendering
    expect(screen.getAllByText("You're offline. Some features may not work until you reconnect.")[0]).toBeInTheDocument();
  });

  it("shows WiFi off icon when offline", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    const { container } = render(<NetworkStatusBanner />);

    // Check for the WifiOff icon
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("shows dismiss button when offline", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    render(<NetworkStatusBanner />);

    // Use getAllByLabelText to handle StrictMode double-rendering
    const dismissButton = screen.getAllByLabelText(/dismiss offline banner/i)[0];
    expect(dismissButton).toBeInTheDocument();
  });

  it("hides banner when dismiss button is clicked", async () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    render(<NetworkStatusBanner />);

    // Use getAllByLabelText to handle StrictMode double-rendering
    const dismissButton = screen.getAllByLabelText(/dismiss offline banner/i)[0];
    fireEvent.click(dismissButton);

    // Wait for the banner to be dismissed
    await waitFor(() => {
      expect(screen.queryAllByRole("alert")).toHaveLength(0);
    });
  });

  it("shows banner again after dismissal if still offline", async () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    const { rerender } = render(<NetworkStatusBanner />);

    // Dismiss the banner - use getAllByLabelText to handle StrictMode
    const dismissButton = screen.getAllByLabelText(/dismiss offline banner/i)[0];
    fireEvent.click(dismissButton);

    // Wait for the banner to be dismissed
    await waitFor(() => {
      expect(screen.queryAllByRole("alert")).toHaveLength(0);
    });

    // Simulate going online
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isOffline: false
    });

    rerender(<NetworkStatusBanner />);

    expect(screen.queryAllByRole("alert")).toHaveLength(0);

    // Simulate going offline again
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    rerender(<NetworkStatusBanner />);

    // Banner should reappear
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders with proper styling classes", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    const { container } = render(<NetworkStatusBanner />);

    const banner = container.querySelector(".fixed.top-0");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveClass("z-50");
  });

  it("is positioned at the top of the viewport", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    const { container } = render(<NetworkStatusBanner />);

    const banner = container.querySelector(".fixed.top-0.left-0.right-0");
    expect(banner).toBeInTheDocument();
  });

  it("has amber/warning color scheme", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    const { container } = render(<NetworkStatusBanner />);

    const banner = container.querySelector("[role='alert']");
    expect(banner).toHaveClass("bg-amber-500/95");
  });

  it("maintains dismiss state when offline", async () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true
    });

    const { rerender } = render(<NetworkStatusBanner />);

    // Dismiss the banner - use getAllByLabelText to handle StrictMode
    const dismissButton = screen.getAllByLabelText(/dismiss offline banner/i)[0];
    fireEvent.click(dismissButton);

    // Wait for the banner to be dismissed
    await waitFor(() => {
      expect(screen.queryAllByRole("alert")).toHaveLength(0);
    });

    // Rerender while still offline
    rerender(<NetworkStatusBanner />);

    // Banner should remain dismissed
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });
});

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useNetworkStatus", () => {
  let onlineGetter: vi.SpyInstance;
  let addEventListenerSpy: vi.SpyInstance;
  let removeEventListenerSpy: vi.SpyInstance;

  beforeEach(() => {
    // Mock navigator.onLine
    onlineGetter = vi.spyOn(navigator, "onLine", "get");

    // Mock window.addEventListener and removeEventListener
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns online status from navigator.onLine on mount", () => {
    onlineGetter.mockReturnValue(true);

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it("returns offline status when navigator.onLine is false", () => {
    onlineGetter.mockReturnValue(false);

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it("sets up event listeners on mount", () => {
    renderHook(() => useNetworkStatus());

    expect(addEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });

  it("removes event listeners on unmount", () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });

  it("updates status when online event fires", () => {
    onlineGetter.mockReturnValue(false);

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);

    // Simulate online event
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it("updates status when offline event fires", () => {
    onlineGetter.mockReturnValue(true);

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);

    // Simulate offline event
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it("handles multiple online/offline transitions", () => {
    onlineGetter.mockReturnValue(true);

    const { result } = renderHook(() => useNetworkStatus());

    // Start online
    expect(result.current.isOnline).toBe(true);

    // Go offline
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);

    // Go online again
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.isOnline).toBe(true);

    // Go offline again
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);
  });

  it("provides correct isOffline inverse value", () => {
    onlineGetter.mockReturnValue(true);

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });
});

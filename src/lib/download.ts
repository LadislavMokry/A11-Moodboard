/**
 * Downloads an image file by fetching it as a blob and triggering a browser download.
 * On iOS devices, opens the image in a new tab to allow saving to photo library.
 * @param url - The URL of the image to download
 * @param filename - The desired filename for the downloaded file
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  // Check if we're on iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // On iOS Safari, open image in new tab for gallery saving
  if (isIOS && isSafari) {
    try {
      // Open image in new tab - user can then long-press to save to gallery
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (!newWindow) {
        // Popup blocked, fall back to standard download
        throw new Error("Popup blocked");
      }
      return;
    } catch (error) {
      // Fall back to standard download if popup fails
      console.warn("iOS gallery save failed, falling back to download:", error);
    }
  }

  try {
    // Standard download for non-iOS browsers
    // Fetch the image as a blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Create object URL for the blob
    const objectUrl = URL.createObjectURL(blob);

    // Create temporary anchor element to trigger download
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = "none";

    // Append to body, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Clean up object URL after a short delay to ensure download starts
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 100);
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}

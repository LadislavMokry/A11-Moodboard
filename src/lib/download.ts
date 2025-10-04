/**
 * Downloads an image file by fetching it as a blob and triggering a browser download.
 * @param url - The URL of the image to download
 * @param filename - The desired filename for the downloaded file
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    // Fetch the image as a blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Create object URL for the blob
    const objectUrl = URL.createObjectURL(blob);

    // Create temporary anchor element to trigger download
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';

    // Append to body, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Clean up object URL after a short delay to ensure download starts
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 100);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

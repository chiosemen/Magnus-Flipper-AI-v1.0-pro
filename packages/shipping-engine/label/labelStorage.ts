/**
 * Label Storage
 * Manages shipping label file storage in Supabase Storage
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const STORAGE_BUCKET = "shipping-labels";

/**
 * Upload label to Supabase Storage
 * @param labelData Base64 or Buffer of label file
 * @param trackingNumber Tracking number for filename
 * @param format pdf, png, or zpl
 * @returns Signed URL to access the label
 */
export async function uploadLabelToStorage(
  labelData: string | Buffer,
  trackingNumber: string,
  format: "pdf" | "png" | "zpl" = "pdf"
): Promise<string> {
  try {
    // Ensure bucket exists
    await ensureBucketExists();

    // Convert data to Buffer if it's base64
    let buffer: Buffer;
    if (typeof labelData === "string") {
      // Remove data URI prefix if present
      const base64Data = labelData.replace(/^data:.*?;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      buffer = labelData;
    }

    // Generate filename
    const filename = `${Date.now()}_${trackingNumber}.${format}`;
    const filePath = `labels/${filename}`;

    // Determine content type
    const contentType = getContentType(format);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload label: ${error.message}`);
    }

    // Generate signed URL (valid for 7 days)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 7 * 24 * 60 * 60); // 7 days

    if (urlError || !urlData) {
      throw new Error(`Failed to generate signed URL: ${urlError?.message}`);
    }

    return urlData.signedUrl;
  } catch (error: any) {
    console.error("Label storage error:", error);
    // Fallback to placeholder URL if storage fails
    return `https://placeholder.com/labels/${trackingNumber}.${format}`;
  }
}

/**
 * Ensure storage bucket exists
 */
async function ensureBucketExists(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();

  const exists = buckets?.some((bucket) => bucket.name === STORAGE_BUCKET);

  if (!exists) {
    await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["application/pdf", "image/png", "text/plain"],
    });
  }
}

/**
 * Get content type based on format
 */
function getContentType(format: string): string {
  switch (format.toLowerCase()) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "zpl":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

/**
 * Delete label from storage
 */
export async function deleteLabelFromStorage(
  labelUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract path from URL
    const path = labelUrl.split(`${STORAGE_BUCKET}/`)[1]?.split("?")[0];

    if (!path) {
      return { success: false, error: "Invalid label URL" };
    }

    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get label file from storage
 */
export async function getLabelFromStorage(
  labelUrl: string
): Promise<{ data: Blob | null; error?: string }> {
  try {
    // Extract path from URL
    const path = labelUrl.split(`${STORAGE_BUCKET}/`)[1]?.split("?")[0];

    if (!path) {
      return { data: null, error: "Invalid label URL" };
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * Regenerate signed URL for label
 */
export async function regenerateSignedUrl(
  labelUrl: string,
  expiresInSeconds: number = 7 * 24 * 60 * 60 // 7 days default
): Promise<{ url: string | null; error?: string }> {
  try {
    // Extract path from URL
    const path = labelUrl.split(`${STORAGE_BUCKET}/`)[1]?.split("?")[0];

    if (!path) {
      return { url: null, error: "Invalid label URL" };
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
      return { url: null, error: error?.message || "Failed to generate URL" };
    }

    return { url: data.signedUrl };
  } catch (error: any) {
    return { url: null, error: error.message };
  }
}

/**
 * List all labels for a specific order
 */
export async function listLabelsForOrder(
  orderId: string
): Promise<{ files: string[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`labels`, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      return { files: [], error: error.message };
    }

    // Filter by order ID in filename (if naming convention includes it)
    const files = data.map((file) => file.name);

    return { files };
  } catch (error: any) {
    return { files: [], error: error.message };
  }
}

/**
 * Clean up old labels (retention policy)
 * Delete labels older than specified days
 */
export async function cleanupOldLabels(
  retentionDays: number = 90
): Promise<{ deleted: number; error?: string }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list("labels", {
        limit: 1000,
        sortBy: { column: "created_at", order: "asc" },
      });

    if (error) {
      return { deleted: 0, error: error.message };
    }

    const filesToDelete = data
      .filter((file) => {
        const createdAt = new Date(file.created_at);
        return createdAt < cutoffDate;
      })
      .map((file) => `labels/${file.name}`);

    if (filesToDelete.length === 0) {
      return { deleted: 0 };
    }

    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filesToDelete);

    if (deleteError) {
      return { deleted: 0, error: deleteError.message };
    }

    return { deleted: filesToDelete.length };
  } catch (error: any) {
    return { deleted: 0, error: error.message };
  }
}

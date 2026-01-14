/**
 * Migration script to upload existing photos to Supabase Storage
 * and insert metadata into the photos table.
 *
 * Run with: npx tsx scripts/migrate-photos-to-supabase.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Photo metadata from initial-photos.ts
const photos = [
  { id: "IMG_0375", filename: "IMG_0375.jpeg", timestamp: "2025-12-14T15:00:30.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0396", filename: "IMG_0396.jpeg", timestamp: "2025-12-17T11:20:44.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0398", filename: "IMG_0398.jpeg", timestamp: "2025-12-17T11:20:56.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0524", filename: "IMG_0524.jpeg", timestamp: "2025-12-28T11:33:07.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0532", filename: "IMG_0532.jpeg", timestamp: "2025-12-28T15:56:17.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0542", filename: "IMG_0542.jpeg", timestamp: "2025-12-29T09:12:32.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0584", filename: "IMG_0584.jpeg", timestamp: "2026-01-05T18:16:38.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0588", filename: "IMG_0588.jpeg", timestamp: "2026-01-05T18:43:34.000Z", isFavorite: false, collections: ["food"] },
  { id: "IMG_0638", filename: "IMG_0638.jpeg", timestamp: "2026-01-09T11:58:37.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0640", filename: "IMG_0640.jpeg", timestamp: "2026-01-09T12:00:34.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0653", filename: "IMG_0653.jpeg", timestamp: "2024-01-07T09:37:07.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0670", filename: "IMG_0670.jpeg", timestamp: "2026-01-10T17:49:12.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0675", filename: "IMG_0675.jpeg", timestamp: "2026-01-10T18:28:35.000Z", isFavorite: false, collections: ["flowers"] },
  { id: "IMG_0685", filename: "IMG_0685.jpeg", timestamp: "2026-01-10T19:21:02.000Z", isFavorite: false, collections: ["food"] },
  { id: "IMG_0688", filename: "IMG_0688.jpeg", timestamp: "2026-01-11T13:32:35.000Z", isFavorite: false, collections: [] },
  { id: "IMG_0692", filename: "IMG_0692.jpeg", timestamp: "2026-01-11T15:19:40.000Z", isFavorite: false, collections: ["flowers"] },
  { id: "IMG_1403", filename: "IMG_1403.jpeg", timestamp: "2022-11-19T17:28:17.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_1626", filename: "IMG_1626.jpeg", timestamp: "2024-03-17T13:55:15.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_1824", filename: "IMG_1824.jpeg", timestamp: "2025-01-11T18:08:41.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_2166", filename: "IMG_2166.jpeg", timestamp: "2024-05-04T15:27:19.000Z", isFavorite: false, collections: [] },
  { id: "IMG_2251", filename: "IMG_2251.jpeg", timestamp: "2022-12-21T08:01:50.000Z", isFavorite: false, collections: [] },
  { id: "IMG_2266", filename: "IMG_2266.jpeg", timestamp: "2024-05-16T14:02:03.000Z", isFavorite: false, collections: [] },
  { id: "IMG_2372", filename: "IMG_2372.jpeg", timestamp: "2024-05-22T20:39:54.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_2892", filename: "IMG_2892.jpeg", timestamp: "2024-06-15T18:09:02.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_4331", filename: "IMG_4331.jpeg", timestamp: "2023-04-15T17:20:12.000Z", isFavorite: false, collections: [] },
  { id: "IMG_4690", filename: "IMG_4690.jpeg", timestamp: "2024-10-20T15:13:25.000Z", isFavorite: false, collections: [] },
  { id: "IMG_5179", filename: "IMG_5179.jpeg", timestamp: "2024-11-30T20:23:45.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_5240", filename: "IMG_5240.jpeg", timestamp: "2024-12-07T14:46:46.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_5476", filename: "IMG_5476.jpeg", timestamp: "2024-12-24T18:34:55.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_5630", filename: "IMG_5630.jpeg", timestamp: "2024-12-28T10:03:06.000Z", isFavorite: false, collections: [] },
  { id: "IMG_5671", filename: "IMG_5671.jpeg", timestamp: "2024-12-30T13:51:47.000Z", isFavorite: false, collections: [] },
  { id: "IMG_5739", filename: "IMG_5739.jpeg", timestamp: "2025-01-04T20:48:56.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_6180", filename: "IMG_6180.jpeg", timestamp: "2025-02-15T15:01:51.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_6282", filename: "IMG_6282.jpeg", timestamp: "2025-02-22T16:03:27.000Z", isFavorite: false, collections: ["flowers"] },
  { id: "IMG_6317", filename: "IMG_6317.jpeg", timestamp: "2025-02-24T16:26:21.000Z", isFavorite: false, collections: [] },
  { id: "IMG_6350", filename: "IMG_6350.jpeg", timestamp: "2025-02-26T19:06:14.000Z", isFavorite: false, collections: ["food"] },
  { id: "IMG_6537", filename: "IMG_6537.jpeg", timestamp: "2025-03-19T14:59:11.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_6559", filename: "IMG_6559.jpeg", timestamp: "2025-03-19T16:50:03.000Z", isFavorite: false, collections: [] },
  { id: "IMG_6950", filename: "IMG_6950.jpeg", timestamp: "2023-06-05T18:13:29.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_7184", filename: "IMG_7184.jpeg", timestamp: "2025-04-06T13:44:10.000Z", isFavorite: false, collections: [] },
  { id: "IMG_7430", filename: "IMG_7430.jpeg", timestamp: "2025-05-10T18:42:38.000Z", isFavorite: false, collections: ["food"] },
  { id: "IMG_7508", filename: "IMG_7508.jpeg", timestamp: "2025-05-17T14:05:35.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_7663", filename: "IMG_7663.jpeg", timestamp: "2025-05-24T14:00:42.000Z", isFavorite: false, collections: [] },
  { id: "IMG_7937", filename: "IMG_7937.jpeg", timestamp: "2025-06-17T11:19:08.000Z", isFavorite: false, collections: [] },
  { id: "IMG_8122", filename: "IMG_8122.jpeg", timestamp: "2025-06-28T15:17:09.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_8243", filename: "IMG_8243.jpeg", timestamp: "2023-08-04T13:00:17.000Z", isFavorite: false, collections: ["flowers"] },
  { id: "IMG_8534", filename: "IMG_8534.jpeg", timestamp: "2025-08-03T09:38:35.000Z", isFavorite: false, collections: ["food"] },
  { id: "IMG_8578", filename: "IMG_8578.jpeg", timestamp: "2025-08-05T15:10:00.000Z", isFavorite: false, collections: [] },
  { id: "IMG_8698", filename: "IMG_8698.jpeg", timestamp: "2025-08-16T16:29:48.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_9002", filename: "IMG_9002.jpeg", timestamp: "2025-09-10T17:47:31.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_9111", filename: "IMG_9111.jpeg", timestamp: "2025-09-21T18:48:24.000Z", isFavorite: false, collections: ["food"] },
  { id: "IMG_9318", filename: "IMG_9318.jpeg", timestamp: "2025-10-04T18:05:27.000Z", isFavorite: false, collections: [] },
  { id: "IMG_9415", filename: "IMG_9415.jpeg", timestamp: "2025-10-10T18:43:48.000Z", isFavorite: false, collections: [] },
  { id: "IMG_9499", filename: "IMG_9499.jpeg", timestamp: "2025-10-11T20:47:18.000Z", isFavorite: false, collections: ["friends"] },
  { id: "IMG_9524", filename: "IMG_9524.jpeg", timestamp: "2025-10-12T09:06:42.000Z", isFavorite: false, collections: [] },
  { id: "IMG_9550", filename: "IMG_9550.jpeg", timestamp: "2025-10-12T18:35:01.000Z", isFavorite: false, collections: ["friends"] },
];

async function main() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Environment variables:");
  console.log("  SUPABASE_URL:", supabaseUrl);
  console.log("  SERVICE_ROLE_KEY:", serviceRoleKey || "NOT SET");
  console.log("");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Error: Missing environment variables");
    console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const photosDir = path.join(process.cwd(), "public", "photos");

  console.log(`Starting migration of ${photos.length} photos...`);
  console.log(`Photos directory: ${photosDir}`);
  console.log("");

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const photo of photos) {
    const filePath = path.join(photosDir, photo.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] ${photo.filename} - File not found`);
      skipCount++;
      continue;
    }

    try {
      // Read file
      const fileBuffer = fs.readFileSync(filePath);

      // Check if already uploaded (by filename)
      const { data: existing } = await supabase.storage
        .from("photos")
        .list("", { search: photo.filename });

      if (existing && existing.length > 0) {
        console.log(`[SKIP] ${photo.filename} - Already exists in storage`);
        skipCount++;
        continue;
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(photo.filename, fileBuffer, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) {
        console.log(`[ERROR] ${photo.filename} - Upload failed: ${uploadError.message}`);
        errorCount++;
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(uploadData.path);

      // Insert metadata into database
      const { error: insertError } = await supabase.rpc("insert_photo", {
        filename_arg: photo.filename,
        url_arg: publicUrl,
        timestamp_arg: photo.timestamp,
        collections_arg: photo.collections,
      });

      if (insertError) {
        console.log(`[ERROR] ${photo.filename} - Database insert failed: ${insertError.message}`);
        // Clean up uploaded file
        await supabase.storage.from("photos").remove([photo.filename]);
        errorCount++;
        continue;
      }

      console.log(`[OK] ${photo.filename}`);
      successCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(`[ERROR] ${photo.filename} - ${message}`);
      errorCount++;
    }
  }

  console.log("");
  console.log("Migration complete!");
  console.log(`  Success: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors:  ${errorCount}`);
}

main().catch(console.error);

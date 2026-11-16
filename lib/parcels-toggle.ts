import fs from "fs";
import path from "path";

/**
 * Checks whether the Parcels API is currently disabled.
 * Parcels can be disabled via:
 * 1. Environment variable: DISABLE_PARCELS="true" or PARCEL_PROVIDER="none"
 * 2. Presence of a toggle file named "parcels_disabled" on disk:
 *    - /tmp/parcels_disabled
 *    - /app/parcels_disabled
 *    - /app/data/parcels_disabled
 *    - /app/uploads/parcels_disabled
 *    - <cwd>/parcels_disabled
 *
 * This allows instant SSH-based or script-based toggling without restarting
 * the application or container:
 *   Disable: touch /tmp/parcels_disabled
 *   Enable:  rm -f /tmp/parcels_disabled
 */
export function isParcelsApiDisabled(): boolean {
  if (
    process.env.DISABLE_PARCELS === "true" ||
    process.env.DISABLE_PARCELS === "1" ||
    process.env.PARCEL_PROVIDER === "none"
  ) {
    return true;
  }

  const flagFiles = [
    path.join(process.cwd(), "parcels_disabled"),
    "/tmp/parcels_disabled",
    "/app/parcels_disabled",
    "/app/data/parcels_disabled",
    "/app/uploads/parcels_disabled",
  ];

  if (process.env.UPLOAD_DIR) {
    flagFiles.push(path.join(process.env.UPLOAD_DIR, "parcels_disabled"));
  }

  for (const file of flagFiles) {
    try {
      if (fs.existsSync(file)) {
        return true;
      }
    } catch {
      // ignore filesystem errors
    }
  }

  return false;
}

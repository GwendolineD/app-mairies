export type ScanResult =
  | { isClean: true }
  | { isClean: false; virus: string };

export class AntivirusServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AntivirusServiceError";
  }
}

/**
 * Scan a file buffer via the external clamav-service microservice.
 * Must run before any Cloudinary / disk persistence.
 */
export async function scanFile(
  fileBuffer: Buffer | ArrayBuffer,
  originalName: string,
): Promise<ScanResult> {
  if (process.env.CLAMAV_SERVICE_ENABLED !== "true") {
    return { isClean: true };
  }

  const baseUrl = process.env.CLAMAV_SERVICE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    return { isClean: true };
  }

  const bytes =
    fileBuffer instanceof Buffer
      ? new Uint8Array(fileBuffer)
      : new Uint8Array(fileBuffer);

  const blob = new Blob([bytes]);
  const formData = new FormData();
  formData.append("file", blob, originalName);

  const headers: HeadersInit = {};
  const apiKey = process.env.CLAMAV_API_KEY;
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const timeoutMs = Number.parseInt(
    process.env.CLAMAV_SERVICE_TIMEOUT ?? "30000",
    10,
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/scan`, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (process.env.CLAMAV_FAIL_MODE === "fail_open") {
        console.warn("Antivirus scan HTTP error, allowing upload (fail_open)");
        return { isClean: true };
      }
      throw new AntivirusServiceError(
        "Service antivirus indisponible. Veuillez réessayer.",
      );
    }

    const data = (await response.json()) as {
      isInfected?: boolean;
      virus?: string;
    };

    if (data.isInfected) {
      return {
        isClean: false,
        virus: data.virus ?? "Unknown virus",
      };
    }

    return { isClean: true };
  } catch (error) {
    if (error instanceof AntivirusServiceError) {
      throw error;
    }
    if (process.env.CLAMAV_FAIL_MODE === "fail_open") {
      console.warn("Antivirus unavailable, allowing upload (fail_open)", error);
      return { isClean: true };
    }
    throw new AntivirusServiceError(
      "Service antivirus indisponible. Veuillez réessayer.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database.types";

export type AuditCategory =
  | "auth"
  | "moderation"
  | "content"
  | "admin"
  | "billing";

export type AuditSeverity = "critical" | "warning" | "info";

export type AuditLogParams = {
  action: string;
  category: AuditCategory;
  severity?: AuditSeverity;
  userId?: string | null;
  targetType?: string;
  targetId?: string;
  communeId?: string | null;
  metadata?: Record<string, unknown>;
  success?: boolean;
};

type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  osName: string | null;
  osVersion: string | null;
  browserName: string | null;
};

function parseUserAgent(userAgent: string | null): Omit<RequestContext, "ipAddress" | "userAgent"> {
  if (!userAgent) {
    return {
      deviceType: null,
      osName: null,
      osVersion: null,
      browserName: null,
    };
  }

  const result = new UAParser(userAgent).getResult();
  const rawDeviceType = result.device.type;
  const deviceType =
    rawDeviceType === "mobile" || rawDeviceType === "tablet"
      ? rawDeviceType
      : "desktop";

  return {
    deviceType,
    osName: result.os.name ?? null,
    osVersion: result.os.version ?? null,
    browserName: result.browser.name ?? null,
  };
}

async function extractRequestContext(): Promise<RequestContext> {
  try {
    const reqHeaders = await headers();
    const forwarded = reqHeaders.get("x-forwarded-for");
    const ipAddress =
      forwarded?.split(",")[0]?.trim() ??
      reqHeaders.get("x-real-ip")?.trim() ??
      null;
    const userAgent = reqHeaders.get("user-agent");
    const parsed = parseUserAgent(userAgent);

    return {
      ipAddress,
      userAgent,
      ...parsed,
    };
  } catch {
    return {
      ipAddress: null,
      userAgent: null,
      deviceType: null,
      osName: null,
      osVersion: null,
      browserName: null,
    };
  }
}

/**
 * Persists an audit log entry. Fire-and-forget safe: never throws.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const ctx = await extractRequestContext();
    const service = await createServiceClient();

    const { error } = await service.from("audit_logs").insert({
      user_id: params.userId ?? null,
      ip_address: ctx.ipAddress,
      user_agent: ctx.userAgent,
      device_type: ctx.deviceType,
      os_name: ctx.osName,
      os_version: ctx.osVersion,
      browser_name: ctx.browserName,
      action: params.action,
      category: params.category,
      severity: params.severity ?? "info",
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      commune_id: params.communeId ?? null,
      metadata: (params.metadata ?? {}) as Json,
      success: params.success ?? true,
    });

    if (error) {
      console.error("[audit] insert failed:", error.message);
    }
  } catch (err) {
    console.error("[audit] logAudit error:", err);
  }
}

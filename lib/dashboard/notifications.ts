export type DashboardNotificationStatus = "completed" | "failed";

export interface BatchNotificationInput {
  jobId: string;
  network: "testnet" | "mainnet";
  status: DashboardNotificationStatus;
  completedBatches?: number;
  totalBatches?: number;
  error?: string;
  createdAt?: string;
}

export interface DashboardNotification {
  id: string;
  jobId: string;
  network: "testnet" | "mainnet";
  status: DashboardNotificationStatus;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export const DASHBOARD_NOTIFICATION_STORAGE_KEY = "stellar-batch-pay-dashboard-notifications";
export const DASHBOARD_NOTIFICATION_LIMIT = 20;

function shortJobId(jobId: string) {
  return jobId.length > 10 ? `${jobId.slice(0, 8)}…` : jobId;
}

function formatNetwork(network: "testnet" | "mainnet") {
  return network === "mainnet" ? "Mainnet" : "Testnet";
}

export function formatBatchNotification(input: BatchNotificationInput) {
  const batchLabel = shortJobId(input.jobId);
  const networkLabel = formatNetwork(input.network);

  if (input.status === "completed") {
    const batchProgress =
      input.totalBatches && input.totalBatches > 0
        ? ` (${input.completedBatches ?? input.totalBatches}/${input.totalBatches})`
        : "";
    return {
      title: `Batch ${batchLabel} completed`,
      description: `The ${networkLabel.toLowerCase()} batch finished successfully${batchProgress}.`,
      href: `/dashboard/history/${input.jobId}`,
    };
  }

  return {
    title: `Batch ${batchLabel} failed`,
    description: input.error
      ? `The ${networkLabel.toLowerCase()} batch failed: ${input.error}`
      : `The ${networkLabel.toLowerCase()} batch failed before completion.`,
    href: `/dashboard/history/${input.jobId}`,
  };
}

export function buildDashboardNotification(
  input: BatchNotificationInput,
  overrides?: Partial<Pick<DashboardNotification, "id" | "createdAt" | "read">>,
): DashboardNotification {
  const formatted = formatBatchNotification(input);
  const id =
    overrides?.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  return {
    id,
    jobId: input.jobId,
    network: input.network,
    status: input.status,
    title: formatted.title,
    description: formatted.description,
    href: formatted.href,
    createdAt: overrides?.createdAt ?? input.createdAt ?? new Date().toISOString(),
    read: overrides?.read ?? false,
  };
}

export function hydrateDashboardNotifications(raw: string | null): DashboardNotification[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is DashboardNotification => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Partial<DashboardNotification>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.jobId === "string" &&
        (candidate.network === "testnet" || candidate.network === "mainnet") &&
        (candidate.status === "completed" || candidate.status === "failed") &&
        typeof candidate.title === "string" &&
        typeof candidate.description === "string" &&
        typeof candidate.href === "string" &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.read === "boolean"
      );
    });
  } catch {
    return [];
  }
}

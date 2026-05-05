// types/system-health-check.ts
// Shared types for the System Health Check feature.

export type TestStatus = "pending" | "running" | "pass" | "fail" | "warn" | "skip";

export type JobStatus = "running" | "complete" | "complete_no_bundle" | "error";

export type TestCategory =
  | "binaries"
  | "permissions"
  | "at_transport"
  | "sms"
  | "sudoers"
  | "services"
  | "network"
  | "configuration";

export interface HealthCheckTest {
  id: string;
  category: TestCategory;
  label: string;
  status: TestStatus;
  duration_ms: number;
  detail: string;
}

export interface HealthCheckSummary {
  pass: number;
  fail: number;
  warn: number;
  skip: number;
  total: number;
}

export interface HealthCheckJob {
  job_id: string;
  status: JobStatus;
  started_at: number;
  finished_at: number | null;
  pid: number;
  summary: HealthCheckSummary;
  tests: HealthCheckTest[];
  tarball_path: string | null;
  tarball_size: number | null;
  error: string | null;
}

export interface RunResponse {
  success: boolean;
  job_id?: string;
  started_at?: number;
  error?: string;
  detail?: string;
}

export interface TestOutputResponse {
  success: boolean;
  test_id?: string;
  output?: string;
  truncated?: boolean;
  error?: string;
}

export const CATEGORY_LABELS: Record<TestCategory, string> = {
  binaries: "二进制与版本",
  permissions: "文件系统与权限",
  at_transport: "AT Transport",
  sms: "SMS 子系统",
  sudoers: "Sudoers",
  services: "Systemd 服务",
  network: "网络",
  configuration: "配置",
};

export const CATEGORY_DESCRIPTIONS: Record<TestCategory, string> = {
  binaries: "必需二进制文件及其版本检查",
  permissions: "文件系统所有者、权限与组成员关系",
  at_transport: "通过 qcmd / atcli_smd11 与模组进行的往返检测",
  sms: "sms_tool 就绪状态与 SIM 在位情况",
  sudoers: "www-data sudoers 辅助脚本可见性",
  services: "Systemd 单元存在性、开机启用与运行状态",
  network: "DNS、IPv4、模组数据通路、lighttpd、防火墙",
  configuration: "QManager 配置文件与轮询缓存时效",
};

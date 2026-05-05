"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TbInfoCircleFilled } from "react-icons/tb";
import {
  TriangleAlertIcon,
  CheckCircle2Icon,
  MinusCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import type { FailoverState } from "@/types/band-locking";
import type { CarrierComponent } from "@/types/modem-status";

// =============================================================================
// BandSettingsComponent — 故障转移开关与当前频段展示
// =============================================================================
// 属性由 BandLockingComponent（协调器）传入。
// 在用频段由 carrier_components（QCAINFO 数据）推导。
// =============================================================================

interface BandSettingsProps {
  /** 故障转移开关与激活状态 */
  failover: FailoverState;
  /** useModemStatus 返回的载波分量（QCAINFO Tier 2） */
  carrierComponents: CarrierComponent[];
  /** 切换故障转移开/关 */
  onToggleFailover: (enabled: boolean) => Promise<boolean>;
  /** 初始数据加载中 */
  isLoading: boolean;
  /** 连接场景接管频段时禁用故障转移开关 */
  isScenarioControlled?: boolean;
}

/**
 * 从 carrier_components 提取指定制式的在用频段名。
 * 返回排序后以逗号分隔的字符串（例如 "B1, B3, B7"）。
 */
function getActiveBandDisplay(
  components: CarrierComponent[],
  technology: "LTE" | "NR",
): string {
  const bands = components
    .filter((c) => c.technology === technology)
    .map((c) => c.band)
    .filter(Boolean);

  // Deduplicate (same band can appear as PCC + SCC in rare cases)
  const unique = [...new Set(bands)];

  if (unique.length === 0) return "—";

  // Sort numerically by band number (strip prefix for comparison)
  unique.sort((a, b) => {
    const numA = parseInt(a.replace(/^[BN]/, ""), 10);
    const numB = parseInt(b.replace(/^[BN]/, ""), 10);
    return numA - numB;
  });

  return unique.join(", ");
}

/**
 * 从 carrier_components 提取在用 EARFCN/ARFCN。
 * 返回逗号分隔字符串（例如 "1850, 3050"）。
 * 不同载波可能共享同一 ARFCN，因此列表可能含重复值。
 */
function getActiveArfcnDisplay(
  components: CarrierComponent[],
  technology: "LTE" | "NR",
): string {
  const arfcns = components
    .filter((c) => c.technology === technology && c.earfcn != null)
    .map((c) => c.earfcn as number);

  if (arfcns.length === 0) return "—";

  // Sort numerically, deduplicate
  const unique = [...new Set(arfcns)].sort((a, b) => a - b);
  return unique.join(", ");
}

const BandSettingsComponent = ({
  failover,
  carrierComponents,
  onToggleFailover,
  isLoading,
  isScenarioControlled = false,
}: BandSettingsProps) => {
  // --- Derive active bands from carrier_components --------------------------
  const activeLte = getActiveBandDisplay(carrierComponents, "LTE");
  const activeLteArfcn = getActiveArfcnDisplay(carrierComponents, "LTE");
  const activeNr = getActiveBandDisplay(carrierComponents, "NR");
  const activeNrArfcn = getActiveArfcnDisplay(carrierComponents, "NR");

  // --- Failover toggle handler ----------------------------------------------
  const handleFailoverToggle = async (checked: boolean) => {
    const success = await onToggleFailover(checked);
    if (success) {
      toast.success(checked ? "频段故障转移已启用" : "频段故障转移已关闭");
    } else {
      toast.error("更新频段故障转移失败");
    }
  };

  // --- Failover status badge ------------------------------------------------
  const renderFailoverStatus = () => {
    if (isLoading) return <Skeleton className="h-5 w-32" />;

    if (!failover.enabled) {
      return (
        <Badge
          variant="outline"
          className="bg-muted/50 text-muted-foreground border-muted-foreground/30"
        >
          <MinusCircleIcon className="h-3 w-3" />
          已关闭
        </Badge>
      );
    }

    if (failover.activated) {
      return (
        <Badge
          variant="outline"
          className="bg-warning/15 text-warning hover:bg-warning/20 border-warning/30"
        >
          <TriangleAlertIcon className="h-3 w-3" />
          已回退至全频段
        </Badge>
      );
    }

    if (failover.watcher_running) {
      return (
        <Badge
          variant="outline"
          className="bg-info/15 text-info hover:bg-info/20 border-info/30"
        >
          <Loader2Icon className="h-3 w-3 animate-spin" />
          监控中
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-success/15 text-success hover:bg-success/20 border-success/30"
      >
        <CheckCircle2Icon className="h-3 w-3" />
        就绪
      </Badge>
    );
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>频段锁定设置</CardTitle>
        <CardDescription>
          将模组限制在指定 LTE / 5G 频段；可启用故障转移，在锁定频段失信号后自动回到全频段。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <Separator />

          {/* Failover Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex" aria-label="更多信息">
                    <TbInfoCircleFilled className="size-5 text-info" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    启用后，若锁定频段连续约 15 秒不可用，设备将自动切换回默认（全）频段。
                  </p>
                </TooltipContent>
              </Tooltip>
              <p className="font-semibold text-muted-foreground text-sm">
                频段故障转移
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <>
                  <Switch
                    id="band-failover"
                    checked={failover.enabled}
                    onCheckedChange={handleFailoverToggle}
                    disabled={isScenarioControlled}
                  />
                  <Label htmlFor="band-failover">
                    {failover.enabled ? "已启用" : "已关闭"}
                  </Label>
                </>
              )}
            </div>
          </div>
          <Separator />

          {/* Failover Status */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              频段故障转移状态
            </p>
            <div className="flex items-center gap-1.5">
              {renderFailoverStatus()}
            </div>
          </div>
          <Separator />

          {/* Active LTE 频段 */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              当前 LTE 频段
            </p>
            <div className="flex items-center gap-1.5">
              {isLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                <p className="text-sm font-semibold">{activeLte}</p>
              )}
            </div>
          </div>
          <Separator />

          {/* Active LTE EARFCNs */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              当前 LTE 频点（EARFCN）
            </p>
            <div className="flex items-center gap-1.5">
              {isLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                <p className="text-sm font-semibold">{activeLteArfcn}</p>
              )}
            </div>
          </div>
          <Separator />

          {/* Active NR Bands */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              当前 5G 频段
            </p>
            <div className="flex items-center gap-1.5">
              {isLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <p className="text-sm font-semibold">{activeNr}</p>
              )}
            </div>
          </div>
          <Separator />

          {/* Active NR ARFCNs */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              当前 5G 频点（ARFCN）
            </p>
            <div className="flex items-center gap-1.5">
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <p className="text-sm font-semibold">{activeNrArfcn}</p>
              )}
            </div>
          </div>
          <Separator />
        </div>
      </CardContent>
    </Card>
  );
};

export default BandSettingsComponent;

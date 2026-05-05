"use client";

import { Fragment } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleArrowDownIcon, CircleArrowUpIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { AmbrData } from "@/types/cellular-settings";
import { formatBitrate } from "@/types/cellular-settings";
import { TbInfoCircleFilled } from "react-icons/tb";

interface CellularAMBRCardProps {
  ambr: AmbrData | null;
  isLoading: boolean;
}

const CellularAMBRCard = ({ ambr, isLoading }: CellularAMBRCardProps) => {
  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>数据速率上限（AMBR）</CardTitle>
          <CardDescription>
            运营商为每条数据连接允许的最大上行与下行速率上限，具体由运营商网络策略决定。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-y-6">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-20" />
              <Separator />
              <Skeleton className="h-6 w-full" />
              <Separator />
              <Skeleton className="h-6 w-full" />
              <Separator />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-4 w-24" />
              <Separator />
              <Skeleton className="h-6 w-full" />
              <Separator />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>数据速率上限（AMBR）</CardTitle>
        <CardDescription>
          运营商为每条数据连接允许的最大上行与下行速率上限，具体由运营商网络策略决定。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-y-6">
          {/* LTE AMBR Section */}
          <div className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex" aria-label="更多信息">
                    <TbInfoCircleFilled className="size-5 text-info" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    终端虽可请求特定 AMBR 数值，运营商{" "}
                    <br />
                    也可能不予采纳，并按套餐、网络策略或{" "}
                    <br />
                    拥塞等情况另行限速。
                  </p>
                </TooltipContent>
              </Tooltip>
              <h2 className="font-semibold text-sm">LTE 速率</h2>
            </div>

            <Separator />
            {ambr && ambr.lte.length > 0 ? (
              ambr.lte.map((entry, index) => (
                <Fragment key={`lte-${index}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-muted-foreground text-sm">
                      {entry.apn}
                    </p>
                    <div className="flex items-center gap-x-4">
                      <div className="flex items-center gap-x-1">
                        <CircleArrowDownIcon className="size-4 text-info" />
                        <p className="font-semibold text-sm">
                          {formatBitrate(entry.dl_kbps)}
                        </p>
                      </div>
                      <div className="flex items-center gap-x-1">
                        <CircleArrowUpIcon className="size-4 text-info" />
                        <p className="font-semibold text-sm">
                          {formatBitrate(entry.ul_kbps)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </Fragment>
              ))
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  无 LTE 速率数据 — 当前未连接到 LTE
                </p>
                <Separator />
              </>
            )}
          </div>

          {/* NR5G AMBR Section */}
          <div className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex" aria-label="更多信息">
                    <TbInfoCircleFilled className="size-5 text-info" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    终端虽可请求特定 AMBR 数值，运营商{" "}
                    <br />
                    也可能不予采纳，并按套餐、网络策略或{" "}
                    <br />
                    拥塞等情况另行限速。
                  </p>
                </TooltipContent>
              </Tooltip>
              <h2 className="font-semibold text-sm">5G 速率</h2>
            </div>
            <Separator />
            {ambr && ambr.nr5g.length > 0 ? (
              ambr.nr5g.map((entry, index) => (
                <Fragment key={`nr5g-${index}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-muted-foreground text-sm">
                      {entry.dnn}
                    </p>
                    <div className="flex items-center gap-x-4">
                      <div className="flex items-center gap-x-1">
                        <CircleArrowDownIcon className="size-4 text-info" />
                        <p className="font-semibold text-sm">
                          {formatBitrate(entry.dl_kbps)}
                        </p>
                      </div>
                      <div className="flex items-center gap-x-1">
                        <CircleArrowUpIcon className="size-4 text-info" />
                        <p className="font-semibold text-sm">
                          {formatBitrate(entry.ul_kbps)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </Fragment>
              ))
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  无 5G 速率数据 — 当前未连接到 5G
                </p>
                <Separator />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CellularAMBRCard;

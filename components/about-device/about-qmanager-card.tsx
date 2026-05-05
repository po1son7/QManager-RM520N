"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import QManagerLogo from "@/public/qmanager-logo.svg";
import packageJson from "@/package.json";

import type { AboutDeviceData } from "@/types/about-device";

// =============================================================================
// AboutQManagerCard — QManager info + network details
// =============================================================================

interface AboutQManagerCardProps {
  data: AboutDeviceData | null;
  isLoading: boolean;
}

const AboutQManagerCard = ({ data, isLoading }: AboutQManagerCardProps) => {
  const networkRows = [
    { label: "设备 IP", value: data?.network.device_ip },
    { label: "LAN 网关", value: data?.network.lan_gateway },
    { label: "WWAN IPv4", value: data?.network.wan_ipv4 },
    { label: "WWAN IPv6", value: data?.network.wan_ipv6 },
    { label: "公网 IPv4", value: data?.network.public_ipv4 },
    { label: "公网 IPv6", value: data?.network.public_ipv6 },
  ];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">关于 QManager</CardTitle>
        <CardDescription>
          面向 Quectel 模组的管理界面。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <Image
              src={QManagerLogo}
              alt="QManager 标志"
              className="size-24"
              priority
            />
          </div>

          {/* Description */}
          <div className="grid gap-y-4">
            <p className="text-sm text-muted-foreground text-pretty leading-relaxed font-medium">
              嗨！我是 Rus。QManager 是 QuecManager 的新一代作品，相较前身采用了更新、更可靠的实现方式——在为进阶用户提供详尽技术选项的同时，也为入门用户保留了简洁界面。QManager 致力于涵盖 QuecManager 的全部功能，并更好用、更稳定、更易上手。特别感谢 iamromulan、clndwhr 与 Wutang Clan！若您喜欢本项目，任何形式的支援都十分感激。谢谢！
            </p>

            {/* All rights reserved */}
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} QManager。保留所有权利。
            </p>
          </div>

          {/* QManager version */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              QManager
            </h3>
            <dl className="grid divide-y divide-border border-y border-border">
              <div className="flex items-center justify-between py-2">
                <dt className="text-sm font-semibold text-muted-foreground">
                  版本
                </dt>
                <dd className="text-sm font-semibold tabular-nums">
                  {packageJson.version}
                </dd>
              </div>
            </dl>
          </div>

          {/* Network info */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              网络
            </h3>
            <dl className="grid divide-y divide-border border-y border-border">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2"
                    >
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))
                : networkRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-2"
                    >
                      <dt className="text-sm font-semibold text-muted-foreground">
                        {row.label}
                      </dt>
                      <dd
                        className="text-sm font-semibold tabular-nums min-w-0 truncate ml-4"
                        title={row.value || undefined}
                      >
                        {row.value || "-"}
                      </dd>
                    </div>
                  ))}
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutQManagerCard;

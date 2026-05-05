"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MotionTableRow = motion.create(TableRow);

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface PingEntry {
  timestamp: number;
  latency: number;
  packet_loss: number;
  ok: boolean;
}

type SortOrder = "newest" | "oldest";

interface PingEntriesCardProps {
  entries: PingEntry[];
  emptyMessage: string;
  isRealtime: boolean;
}

// =============================================================================
// Component
// =============================================================================

const PingEntriesCard = ({
  entries,
  emptyMessage,
  isRealtime,
}: PingEntriesCardProps) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const sortedEntries = useMemo(
    () => (sortOrder === "newest" ? entries.toReversed() : entries),
    [entries, sortOrder],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>明细记录</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  排序
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>排序方式</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortOrder === "newest"}
                onCheckedChange={() => setSortOrder("newest")}
              >
                最新在上
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOrder === "oldest"}
                onCheckedChange={() => setSortOrder("oldest")}
              >
                最旧在上
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          所选时间范围内的单次 Ping 结果明细。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>延迟</TableHead>
              <TableHead>丢包率</TableHead>
              <TableHead>日期</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length > 0 ? (
              sortedEntries.map((ping, index) => (
                <MotionTableRow
                  key={ping.timestamp}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
                >
                  <TableCell>
                    {isRealtime && !ping.ok
                      ? "超时"
                      : `${ping.latency} ms`}
                  </TableCell>
                  <TableCell>{ping.packet_loss}%</TableCell>
                  <TableCell>
                    {new Date(ping.timestamp).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(ping.timestamp).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })}
                  </TableCell>
                </MotionTableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PingEntriesCard;

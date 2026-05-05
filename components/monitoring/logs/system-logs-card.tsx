"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { authFetch } from "@/lib/auth-fetch";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { motion } from "motion/react";

const MotionTableRow = motion.create(TableRow);

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCcwIcon,
  Loader2,
  Clock,
  SearchIcon,
  Trash2Icon,
  LogsIcon,
} from "lucide-react";

const CGI_ENDPOINT = "/cgi-bin/quecmanager/system/logs.sh";

interface LogEntry {
  timestamp: string;
  level: string;
  component: string;
  pid: string;
  message: string;
}

interface LogStats {
  current_size_kb: number;
  current_lines: number;
  rotated_files: number;
}

interface LogsResponse {
  success: boolean;
  entries: LogEntry[];
  total: number;
  stats: LogStats;
  available_components: string[];
  error?: string;
  detail?: string;
}

const getLevelBadgeVariant = (
  level: string
): "default" | "secondary" | "destructive" | "warning" | "info" => {
  switch (level) {
    case "ERROR":
      return "destructive";
    case "WARN":
      return "warning";
    case "INFO":
      return "info";
    case "DEBUG":
      return "secondary";
    default:
      return "secondary";
  }
};

const SystemLogsCard = () => {
  // Data state
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [availableComponents, setAvailableComponents] = useState<string[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);

  // Filter state
  const [level, setLevel] = useState<string>("all");
  const [component, setComponent] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [lines, setLines] = useState<string>("100");
  const [includeRotated, setIncludeRotated] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Refs
  const mountedRef = useRef(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch logs from backend
  // ---------------------------------------------------------------------------
  const fetchLogs = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("lines", lines);
        if (level !== "all") params.set("level", level);
        if (component !== "all") params.set("component", component);
        if (search.trim()) params.set("search", search.trim());
        if (includeRotated) params.set("include_rotated", "1");

        const resp = await authFetch(`${CGI_ENDPOINT}?${params.toString()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data: LogsResponse = await resp.json();
        if (!mountedRef.current) return;

        if (data.success) {
          setEntries(data.entries);
          setTotalEntries(data.total);
          setStats(data.stats);
          setAvailableComponents(data.available_components);
          setLastFetched(new Date());
        }
      } catch {
        if (mountedRef.current && !silent) {
          toast.error("加载系统日志失败");
        }
      } finally {
        if (mountedRef.current && !silent) {
          setIsLoading(false);
        }
      }
    },
    [level, component, search, lines, includeRotated]
  );

  // Initial fetch + re-fetch on filter change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh every 10s (silent)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // ---------------------------------------------------------------------------
  // Search debounce
  // ---------------------------------------------------------------------------
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
    }, 400);
  };

  // ---------------------------------------------------------------------------
  // Clear logs
  // ---------------------------------------------------------------------------
  const handleClearLogs = async () => {
    setIsClearing(true);

    try {
      const resp = await authFetch(CGI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      if (!mountedRef.current) return;

      if (data.success) {
        toast.success("日志已清空");
        setShowClearDialog(false);
        await fetchLogs(true);
      } else {
        toast.error(data.detail || "清空日志失败");
      }
    } catch {
      if (mountedRef.current) {
        toast.error("清空日志失败");
      }
    } finally {
      if (mountedRef.current) {
        setIsClearing(false);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>系统日志</CardTitle>
          <CardDescription>
            QManager 各组件的应用日志。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-2 @md/card:flex gap-2">
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9 col-span-2 @md/card:flex-1" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>系统日志</CardTitle>
          <CardDescription>
            QManager 各组件的应用日志。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="grid gap-2 mb-4">
            {/* Row 1: Filters */}
            <div className="grid grid-cols-2 @md/card:flex @md/card:flex-wrap items-center gap-2">
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="全部级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部级别</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                </SelectContent>
              </Select>

              <Select value={component} onValueChange={setComponent}>
                <SelectTrigger>
                  <SelectValue placeholder="全部组件" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部组件</SelectItem>
                  {availableComponents.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative col-span-2 @md/card:flex-1 @md/card:min-w-48">
                <label htmlFor="log-search" className="sr-only">
                  搜索日志
                </label>
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="log-search"
                  placeholder="搜索日志…"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Row 2: Options + Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={lines} onValueChange={setLines}>
                <SelectTrigger className="w-auto min-w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="include-rotated"
                  checked={includeRotated}
                  onCheckedChange={setIncludeRotated}
                />
                <label
                  htmlFor="include-rotated"
                  className="text-sm text-muted-foreground whitespace-nowrap"
                >
                  包含归档日志
                </label>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="刷新系统日志"
                  onClick={() => fetchLogs()}
                >
                  <RefreshCcwIcon className="size-4" />
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowClearDialog(true)}
                >
                  <Trash2Icon className="size-4 mr-1" />
                  清空
                </Button>
              </div>
            </div>
          </div>

          {/* Log table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">时间戳</TableHead>
                  <TableHead className="w-20">级别</TableHead>
                  <TableHead className="w-32 hidden @md/card:table-cell">
                    组件
                  </TableHead>
                  <TableHead>消息</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <LogsIcon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          暂无日志条目
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry, index) => (
                    <MotionTableRow
                      key={`${entry.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.4), ease: "easeOut" }}
                    >
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {entry.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getLevelBadgeVariant(entry.level)}
                        >
                          {entry.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden @md/card:table-cell">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {entry.component}
                        </code>
                      </TableCell>
                      <TableCell className="wrap-break-word text-sm">
                        {entry.message}
                      </TableCell>
                    </MotionTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            显示 <strong>{entries.length}</strong> /{" "}
            <strong>{totalEntries}</strong> 条
            {stats && (
              <span className="ml-2">
                （{stats.current_size_kb}KB，已轮转文件 {stats.rotated_files}{" "}
                个）
              </span>
            )}
          </div>
          {lastFetched && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              上次刷新：{lastFetched.toLocaleTimeString()}
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Clear confirmation dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清空系统日志</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除所有日志条目（含已轮转文件），此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isClearing}
              onClick={handleClearLogs}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  清空中…
                </>
              ) : (
                "清空全部日志"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SystemLogsCard;

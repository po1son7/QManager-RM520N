'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

// Map route segments to display names（简体中文）
const routeNameMap: Record<string, string> = {
  dashboard: '首页',
  home: '首页',
  cellular: '蜂窝信息',
  sms: '短信中心',
  'custom-profiles': 'SIM 档案',
  'connection-scenarios': '连接场景',
  'cell-locking': '频段锁定',
  'tower-locking': '基站锁定',
  'frequency-locking': '频率锁定',
  'cell-scanner': '小区扫描',
  'neighbourcell-scanner': '邻区扫描',
  'frequency-calculator': '频率计算器',
  settings: '蜂窝设置',
  'apn-management': 'APN 管理',
  'network-priority': '网络优先级',
  'imei-settings': 'IMEI 设置',
  'fplmn-settings': 'FPLMN 设置',
  'local-network': '局域网',
  'ip-passthrough': 'IP 透传',
  'ttl-settings': 'TTL 与 MTU',
  monitoring: '网络事件',
  latency: '延迟监控',
  logs: '日志',
  'email-alerts': '邮件告警',
  'sms-alerts': '短信告警',
  watchdog: '看门狗',
  tailscale: 'Tailscale VPN',
  'system-settings': '系统设置',
  'software-update': '软件更新',
  'system-health-check': '系统健康检查',
  'at-terminal': 'AT 终端',
  'web-console': 'Web 控制台',
  'antenna-statistics': '天线统计',
  'antenna-alignment': '天线对准',
  'about-device': '关于设备',
  support: '帮助与支持',
  reboot: '重启',
  setup: '首次向导',
  login: '登录',
};

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return [];
    }

    const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const label =
        routeNameMap[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      const isCurrentPage = index === segments.length - 1;

      return {
        label,
        href,
        isCurrentPage,
      };
    });

    return breadcrumbs;
  }, [pathname]);
}

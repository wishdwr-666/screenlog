"use client";
import { motion } from "framer-motion";

interface HeatmapProps {
  data: Record<string, number[]>; // date -> hourly seconds[24]
  days?: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensity(seconds: number): number {
  if (seconds === 0) return 0;
  if (seconds < 600) return 1;   // < 10分钟
  if (seconds < 1800) return 2;  // < 30分钟
  if (seconds < 3600) return 3;  // < 1小时
  return 4;                       // >= 1小时
}

const INTENSITY_COLORS = [
  "bg-[var(--heatmap-zero)]",          // 0: 无活动
  "bg-[#D3C9A8]/60",       // 1: 轻度
  "bg-[#E6AF2E]/40",       // 2: 中度
  "bg-[#D36E52]/50",       // 3: 较高
  "bg-[#D36E52]",          // 4: 高强度
];

export function HeatmapChart({ data, days = 14 }: HeatmapProps) {
  const dates = Object.keys(data).sort();
  const selectedDates = dates.slice(-days);

  // 只显示关键小时标签
  const hourLabels = [0, 6, 9, 12, 15, 18, 21, 23];

  return (
    <div className="w-full">
      {/* 小时轴标签 */}
      <div className="flex mb-1 pl-8">
        {HOURS.map((h) => (
          <div key={h} className="flex-1 text-center">
            {hourLabels.includes(h) && (
              <span className="text-[8px] text-[var(--app-text-muted)]">{h}</span>
            )}
          </div>
        ))}
      </div>

      {/* 热力图行 */}
      <div className="space-y-0.5">
        {selectedDates.map((date, di) => {
          const hourly = data[date] ?? new Array(24).fill(0);
          const d = new Date(date);
          const label = `${d.getMonth() + 1}/${d.getDate()}`;
          const isToday = date === new Date().toISOString().split("T")[0];

          return (
            <motion.div
              key={date}
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: di * 0.03 }}
            >
              <span className={`w-7 text-[8px] text-right shrink-0 ${isToday ? "text-[var(--app-primary)] font-bold" : "text-[var(--app-text-muted)]"}`}>
                {isToday ? "今天" : label}
              </span>
              <div className="flex flex-1 gap-px">
                {hourly.map((sec, hi) => {
                  const intensity = getIntensity(sec);
                  return (
                    <motion.div
                      key={hi}
                      className={`flex-1 h-3 rounded-[1px] ${INTENSITY_COLORS[intensity]} cursor-pointer`}
                      title={`${label} ${hi}:00 — ${Math.round(sec / 60)} 分钟`}
                      whileHover={{ scaleY: 1.5 }}
                      transition={{ duration: 0.15 }}
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[9px] text-[var(--app-text-muted)]">少</span>
        {INTENSITY_COLORS.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-[1px] ${cls}`} />
        ))}
        <span className="text-[9px] text-[var(--app-text-muted)]">多</span>
      </div>
    </div>
  );
}

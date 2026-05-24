"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/components/screens/AppCharts";
import { WallpaperPicker } from "@/components/wallpaper/WallpaperPicker";
import { useEnv } from "@/components/environment/DynamicEnvironment";

interface AppLabel {
  processName: string;
  appName: string;
  category: string;
  isProductivity: boolean;
  isBlackhole: boolean;
}

const CATEGORIES = ["work", "social", "entertainment", "tool", "other"];

export function SettingsScreen() {
  const [idleThreshold, setIdleThreshold] = useState(5);
  const [nightMode, setNightMode] = useState(true);
  const [labels, setLabels] = useState<AppLabel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 读取本地设置
    const stored = localStorage.getItem("screenlog-settings");
    if (stored) {
      const s = JSON.parse(stored);
      setIdleThreshold(s.idleThreshold ?? 5);
      setNightMode(s.nightMode ?? true);
    }
    // 读取应用标签
    fetch("/api/labels").then(r => r.json()).then(d => setLabels(d.labels ?? []));
  }, []);

  function saveSettings() {
    localStorage.setItem("screenlog-settings", JSON.stringify({ idleThreshold, nightMode }));
  }

  async function updateCategory(processName: string, category: string) {
    setSaving(true);
    try {
      const label = labels.find(l => l.processName === processName);
      if (!label) return;
      const updated = { ...label, category };
      await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setLabels(prev => prev.map(l => l.processName === processName ? updated : l));
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  }

  async function toggleLabel(processName: string, field: "isProductivity" | "isBlackhole") {
    const label = labels.find(l => l.processName === processName);
    if (!label) return;
    const updated = { ...label, [field]: !label[field] };
    await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setLabels(prev => prev.map(l => l.processName === processName ? updated : l));
  }

  return (
    <div className="relative min-h-svh pb-20 md:pb-0">
      <div className="absolute inset-0 pointer-events-none paper-texture opacity-80 z-0" />

      {/* 头部 */}
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-[var(--app-border)] bg-[var(--app-surface)]/80 backdrop-blur-sm sticky top-0">
        <h1 className="text-base font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>手帐参数设置</h1>
        <Link href="/">
          <button aria-label="关闭" className="p-2 rounded-full hover:bg-[var(--app-border)] text-[var(--app-text)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </Link>
      </header>

      <div className="relative z-10 w-full p-4 space-y-5 pb-10">

        {/* 壁纸设置 */}
        <motion.div
          className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-sm font-bold text-[var(--app-text)] mb-2" style={{ fontFamily: "var(--font-heading)" }}>外观 · 壁纸</h3>
          <p className="text-[10px] text-[var(--app-text-muted)] mb-3 leading-relaxed">
            上传图片作为应用背景，可调节透明度与模糊度。数据存储在本地与账号云端。
          </p>
          <WallpaperPicker />
        </motion.div>

        {/* UI 氛围效果 */}

        {/* 外观动态效果 */}
        <EnvSettingsCard />

        {/* 本地守护偏好 */}
        <motion.div
          className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 shadow-sm space-y-4"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h3 className="text-sm font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>本地守护偏好</h3>
            <p className="text-[10px] text-[var(--app-text-muted)] mt-1">微调手帐敏感度，数据仅留存本地。</p>
          </div>

          {/* 空闲阈值 */}
          <div className="border border-[var(--app-border)] rounded-xl p-3 bg-[var(--app-surface)]">
            <label className="text-[13px] font-bold text-[var(--app-text)] block mb-1">⏰ 屏幕空闲判定阈值</label>
            <span className="text-[10px] text-[var(--app-text-muted)] block mb-3">无动作超时自动记作"离开状态"</span>
            <div className="flex items-center gap-3">
              <input
                aria-label="空闲阈值"
                type="range" min={1} max={15} value={idleThreshold}
                onChange={e => { setIdleThreshold(Number(e.target.value)); saveSettings(); }}
                className="flex-1 accent-[var(--app-primary)]"
              />
              <span className="text-[11px] font-bold bg-[var(--app-text)] text-[var(--app-surface)] py-0.5 px-2 rounded-md shadow-sm">{idleThreshold} 分钟</span>
            </div>
          </div>

          {/* 深夜关怀模式 */}
          <div className="border border-[var(--app-border)] rounded-xl p-3 bg-[var(--app-surface)] flex items-center justify-between">
            <div className="pr-4">
              <label className="text-[13px] font-bold text-[var(--app-text)] block">深夜不评判关怀模式</label>
              <span className="text-[10px] text-[var(--app-text-muted)] block mt-0.5 leading-tight">晚上23点后，直接跳过娱乐警告与嘲讽</span>
            </div>
            <motion.button
              role="switch"
              aria-checked={nightMode}
              aria-label="深夜不评判模式"
              onClick={() => { setNightMode(v => !v); saveSettings(); }}
              className={`relative inline-flex items-center shrink-0 cursor-pointer w-10 h-[22px] rounded-full transition-colors ${nightMode ? "bg-[var(--app-success)]" : "bg-[var(--app-border)]"}`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className="inline-block w-4 h-4 bg-[var(--app-surface)] rounded-full shadow-sm"
                animate={{ translateX: nightMode ? 18 : 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            </motion.button>
          </div>
        </motion.div>

        {/* 自定义分类 */}
        <motion.div
          className="bg-[var(--card-warm)] border border-[var(--card-warm-border)] rounded-2xl p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <h3 className="text-sm font-bold text-[var(--app-text)] mb-1 flex items-center gap-1.5" style={{ fontFamily: "var(--font-heading)" }}>
            <svg className="w-4 h-4 text-[var(--app-primary)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>
            </svg>
            自定义分类修正
          </h3>
          <p className="text-[10px] text-[var(--app-text-muted)] mb-3 leading-relaxed">像修正错误笔画一样，自定义你的"避雷应用"。</p>

          <div className="space-y-2">
            {labels.slice(0, 8).map((label) => {
              const color = CATEGORY_COLORS[label.category] ?? "#B8A898";
              const catLabel = CATEGORY_LABELS[label.category] ?? label.category;
              const isEditing = editingId === label.processName;

              return (
                <motion.div
                  key={label.processName}
                  className="p-2.5 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl"
                  layout
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[var(--app-text)]">{label.appName}</span>
                      {label.isProductivity && <span className="text-[8px] px-1 py-0.5 rounded bg-[var(--chip-green-bg)] text-[var(--chip-green-text)]">生产力</span>}
                      {label.isBlackhole && <span className="text-[8px] px-1 py-0.5 rounded bg-[var(--chip-red-bg)] text-[var(--chip-red-text)]">黑洞</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <div className="flex gap-1 flex-wrap justify-end">
                          {CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              onClick={() => updateCategory(label.processName, cat)}
                              className="text-[8px] px-1.5 py-0.5 rounded border transition-colors"
                              style={{
                                color: CATEGORY_COLORS[cat] ?? "#B8A898",
                                backgroundColor: cat === label.category ? (CATEGORY_COLORS[cat] + "25") : "transparent",
                                borderColor: CATEGORY_COLORS[cat] + "60",
                              }}
                            >
                              {CATEGORY_LABELS[cat] ?? cat}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingId(label.processName)}
                          className="text-[9px] px-1.5 py-0.5 rounded border transition-colors"
                          style={{ color, backgroundColor: color + "20", borderColor: color + "40" }}
                        >
                          {catLabel} ▾
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-dashed border-[var(--card-warm-border)] pt-3 text-center">
            <span className="text-[9px] text-[var(--app-text-muted)]">VERSION 1.0.0 (LOCAL KEEPER)</span>
          </div>
        </motion.div>

        {/* 数据说明 */}
        <motion.div
          className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <h3 className="text-sm font-bold text-[var(--app-text)] mb-2" style={{ fontFamily: "var(--font-heading)" }}>隐私说明</h3>
          <ul className="space-y-1.5 text-[10px] text-[var(--app-text-muted)] leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="text-[var(--app-success)] mt-0.5">✓</span>所有数据仅存储在本地，不上传任何服务器
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[var(--app-success)] mt-0.5">✓</span>不包含任何追踪代码或分析服务
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[var(--app-success)] mt-0.5">✓</span>图表图标均本地渲染，无网络依赖
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

// ─── 外观动态效果设置卡片 ────────────────────────────────────────────────

function EnvSettingsCard() {
  const { settings, update } = useEnv();

  return (
    <motion.div
      className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 shadow-sm space-y-5"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-sm font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>
        外观动态效果
      </h3>

      {/* ── 1. 透明UI化 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[var(--app-text)]">透明 UI</p>
            <p className="text-[10px] text-[var(--app-text-muted)] mt-0.5">调低后界面半透明，配合壁纸效果最佳</p>
          </div>
          <span className="text-[11px] font-medium text-[var(--app-primary)] tabular-nums">
            {Math.round(settings.uiOpacity * 100)}%
          </span>
        </div>
        <input
          type="range" min={30} max={100} step={1}
          value={Math.round(settings.uiOpacity * 100)}
          onChange={e => update({ uiOpacity: Number(e.target.value) / 100 })}
          className="w-full accent-[var(--app-primary)]"
          aria-label="UI透明度"
        />
        <div className="flex justify-between text-[9px] text-[var(--app-text-muted)]">
          <span>30% 透明</span><span>100% 不透明</span>
        </div>
      </div>

      <div className="border-t border-[var(--app-border)]" />

      {/* ── 2. 夜间护眼模式 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-[var(--app-text)]">夜间护眼模式</p>
          <p className="text-[10px] text-[var(--app-text-muted)] mt-0.5 leading-relaxed">
            深色暖色调，类似读书App夜间阅读效果<br/>整体色温降低，护眼不刺激
          </p>
        </div>
        <ToggleSwitch value={settings.nightMode} onChange={v => update({ nightMode: v })} />
      </div>

      <div className="border-t border-[var(--app-border)]" />

      {/* ── 3. 雨滴动画 */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-[var(--app-text)]">雨滴动画</p>
            <p className="text-[10px] text-[var(--app-text-muted)] mt-0.5 leading-relaxed">
              全屏雨滴滑落，覆盖整个界面<br/>不影响任何点击操作
            </p>
          </div>
          <ToggleSwitch value={settings.rainEnabled} onChange={v => update({ rainEnabled: v })} />
        </div>

        {settings.rainEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[10px] text-[var(--app-text-muted)] mb-2">雨量大小</p>
            <div className="flex gap-2">
              {(["light", "moderate", "heavy"] as const).map(i => (
                <motion.button
                  key={i}
                  onClick={() => update({ rainIntensity: i })}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                    settings.rainIntensity === i
                      ? "bg-[var(--app-secondary)] text-white border-[var(--app-secondary)]"
                      : "text-[var(--app-text-secondary)] border-[var(--app-border)] hover:border-[var(--app-secondary)]"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {{ light: "小雨", moderate: "中雨", heavy: "大雨" }[i]}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      onClick={() => onChange(!value)}
      className={`relative shrink-0 rounded-full transition-colors ${value ? "bg-[var(--app-primary)]" : "bg-[var(--app-border)]"}`}
      style={{ width: 40, height: 22 }}
      whileTap={{ scale: 0.93 }}
      role="switch"
      aria-checked={value}
    >
      <motion.span
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ left: value ? "calc(100% - 19px)" : "3px" }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
      />
    </motion.button>
  );
}

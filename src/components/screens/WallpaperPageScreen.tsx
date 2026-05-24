"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useWallpaper, type WallpaperHistoryItem } from "@/components/wallpaper/WallpaperProvider";

export function WallpaperPageScreen() {
  const { wallpaper, history, uploading, upload, applyFromHistory, update, remove } = useWallpaper();
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    await upload(file);
  }

  return (
    <div className="relative min-h-svh pb-8">
      <div className="absolute inset-0 pointer-events-none paper-texture opacity-80 z-0" />
      <div className="relative z-10 max-w-2xl mx-auto px-5 py-6 space-y-6">

        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/settings">
            <button aria-label="返回设置" className="p-2 -ml-2 rounded-full hover:bg-[var(--sidebar-hover)] text-[var(--app-text-muted)] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>自定义壁纸</h1>
            <p className="text-[11px] text-[var(--app-text-muted)]">上传图片作为应用背景，所有页面通用</p>
          </div>
        </div>

        {/* 上传区 + 当前预览 */}
        <motion.div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-5 shadow-sm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${dragOver ? "border-[var(--app-primary)] bg-[var(--app-primary)]/5" : "border-[var(--app-border)] hover:border-[var(--app-primary)]/60"}`}
            style={{ height: 220 }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            {wallpaper.url ? (
              <>
                <img src={wallpaper.url} alt="当前壁纸" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full">点击更换图片</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                {uploading ? (
                  <motion.div className="w-10 h-10 rounded-full border-2 border-[var(--app-primary)] border-t-transparent" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                ) : (
                  <>
                    <svg className="w-10 h-10 text-[var(--app-text-muted)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p className="text-sm text-[var(--app-text-muted)] text-center">将图片拖拽到这里，或点击选择<br /><span className="text-[11px]">支持 JPG · PNG · WebP</span></p>
                  </>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {uploading && (
            <div className="mt-3 flex items-center gap-2">
              <motion.div className="w-4 h-4 rounded-full border-2 border-[var(--app-primary)] border-t-transparent shrink-0" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
              <span className="text-[11px] text-[var(--app-text-muted)]">正在上传…</span>
            </div>
          )}

          {/* 调节滑杆 */}
          {wallpaper.url && (
            <div className="mt-5 space-y-4">
              <SliderRow label="透明度" value={Math.round(wallpaper.opacity * 100)} unit="%" min={5} max={80} onChange={v => update({ opacity: v / 100 })} />
              <SliderRow label="模糊程度" value={wallpaper.blur} unit="px" min={0} max={20} onChange={v => update({ blur: v })} />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 mt-5">
            <motion.button onClick={() => fileRef.current?.click()}
              className="flex-1 py-2.5 rounded-xl border border-[var(--app-border)] text-xs text-[var(--app-text-secondary)] hover:border-[var(--app-primary)] hover:text-[var(--app-primary)] transition-colors"
              whileTap={{ scale: 0.97 }}>
              {wallpaper.url ? "更换图片" : "选择图片"}
            </motion.button>
            {wallpaper.url && (
              <motion.button onClick={remove}
                className="flex-1 py-2.5 rounded-xl border border-[var(--app-border)] text-xs text-[var(--app-text-secondary)] hover:border-red-300 hover:text-red-500 transition-colors"
                whileTap={{ scale: 0.97 }}>
                移除壁纸
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* 历史壁纸 */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-bold text-[var(--app-text)] mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            历史壁纸
            {history.length > 0 && <span className="ml-2 text-[10px] font-normal text-[var(--app-text-muted)]">{history.length} 张</span>}
          </h2>

          {history.length === 0 ? (
            <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 text-center">
              <p className="text-sm text-[var(--app-text-muted)]">还没有历史壁纸</p>
              <p className="text-[11px] text-[var(--app-text-muted)] mt-1">上传第一张后会在这里显示</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {history.map((item, i) => (
                <HistoryItem key={item.id} item={item} isActive={wallpaper.url === item.url} index={i} onClick={() => applyFromHistory(item)} />
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

function HistoryItem({ item, isActive, index, onClick }: { item: WallpaperHistoryItem; isActive: boolean; index: number; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${isActive ? "border-[var(--app-primary)] shadow-md" : "border-[var(--app-border)] hover:border-[var(--app-primary)]/50"}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <img src={item.url} alt={item.name ?? "壁纸"} className="w-full h-full object-cover" />
      {isActive && (
        <div className="absolute inset-0 bg-[var(--app-primary)]/20 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[var(--app-primary)] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
        <p className="text-[9px] text-white truncate">{item.name ?? "壁纸"}</p>
      </div>
    </motion.button>
  );
}

function SliderRow({ label, value, unit, min, max, onChange }: { label: string; value: number; unit: string; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] text-[var(--app-text-secondary)]">{label}</span>
        <span className="text-[11px] font-medium text-[var(--app-text)]">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-[var(--app-primary)]" />
    </div>
  );
}

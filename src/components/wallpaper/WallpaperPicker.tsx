"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallpaper } from "./WallpaperProvider";

export function WallpaperPicker() {
  const { wallpaper, uploading, upload, update, remove } = useWallpaper();
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    await upload(file);
    setOpen(false);
  }

  return (
    <>
      <motion.button onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left hover:bg-[var(--sidebar-hover)] transition-colors"
        whileTap={{ scale: 0.97 }}>
        <div className="w-8 h-8 rounded-lg border border-[var(--app-border)] overflow-hidden shrink-0 relative"
          style={wallpaper.url ? { backgroundImage: `url(${wallpaper.url})`, backgroundSize: "cover" } : { backgroundColor: "var(--app-surface)" }}>
          {!wallpaper.url && (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--app-text-muted)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-[var(--app-text)] leading-tight">自定义壁纸</div>
          <div className="text-[9px] text-[var(--app-text-muted)] truncate">{wallpaper.url ? "已设置，点击更改" : "点击上传图片"}</div>
        </div>
        <svg className="w-3.5 h-3.5 text-[var(--app-text-muted)] shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm" style={{ zIndex: 9998 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-[var(--app-surface)] rounded-t-3xl shadow-xl overflow-y-auto"
              style={{ zIndex: 9999, maxHeight: "90svh", paddingBottom: "env(safe-area-inset-bottom)" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}>
              <div className="p-5">
                <div className="w-10 h-1 rounded-full bg-[var(--app-border)] mx-auto mb-4" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>自定义壁纸</h3>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-[var(--sidebar-hover)] text-[var(--app-text-muted)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
                <div className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-colors ${dragOver ? "border-[var(--app-primary)]" : "border-[var(--app-border)] hover:border-[var(--app-primary)]/60"}`}
                  style={{ height: 160 }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>
                  {wallpaper.url ? (
                    <>
                      <img src={wallpaper.url} alt="当前壁纸" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs bg-black/50 px-3 py-1.5 rounded-full">点击更换</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      {uploading
                        ? <motion.div className="w-8 h-8 rounded-full border-2 border-[var(--app-primary)] border-t-transparent" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                        : <><svg className="w-7 h-7 text-[var(--app-text-muted)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p className="text-xs text-[var(--app-text-muted)] text-center">拖拽或点击上传<br/><span className="text-[10px]">JPG · PNG · WebP</span></p></>
                      }
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
                {wallpaper.url && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between mb-1"><span className="text-[11px] text-[var(--app-text-secondary)]">透明度</span><span className="text-[11px] font-medium text-[var(--app-text)]">{Math.round(wallpaper.opacity * 100)}%</span></div>
                      <input type="range" min={5} max={80} value={Math.round(wallpaper.opacity * 100)} onChange={e => update({ opacity: Number(e.target.value) / 100 })} className="w-full accent-[var(--app-primary)]" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1"><span className="text-[11px] text-[var(--app-text-secondary)]">模糊</span><span className="text-[11px] font-medium text-[var(--app-text)]">{wallpaper.blur}px</span></div>
                      <input type="range" min={0} max={20} value={wallpaper.blur} onChange={e => update({ blur: Number(e.target.value) })} className="w-full accent-[var(--app-primary)]" />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-5">
                  {wallpaper.url && (
                    <motion.button onClick={() => { remove(); setOpen(false); }}
                      className="flex-1 py-2.5 rounded-xl border border-[var(--app-border)] text-xs text-[var(--app-text-secondary)] hover:text-red-500 hover:border-red-300 transition-colors"
                      whileTap={{ scale: 0.97 }}>移除壁纸</motion.button>
                  )}
                  <motion.button onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--app-primary)] text-white text-xs font-medium"
                    whileTap={{ scale: 0.97 }}>完成</motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { getAchievements } from "@/lib/tauri-bridge";
import { motion } from "framer-motion";
import Link from "next/link";

interface AchievementItem {
  achievementId: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt: string | null;
  triggeredBy: string | null;
}

// 扩展成就定义（含更多趣味内容）
const EXTENDED_ACHIEVEMENTS: AchievementItem[] = [
  { achievementId: "owl", title: "猫头鹰", description: "凌晨4点还在用电脑", emoji: "🦉", unlocked: false, unlockedAt: null, triggeredBy: null },
  { achievementId: "streak_7", title: "七日连续", description: "连续7天使用电脑", emoji: "🔥", unlocked: false, unlockedAt: null, triggeredBy: null },
  { achievementId: "switch_master", title: "手速达人", description: "本周切换应用超5000次", emoji: "⚡", unlocked: false, unlockedAt: null, triggeredBy: null },
  { achievementId: "tool_collector", title: "工具收藏家", description: "单日使用超过20个不同应用", emoji: "🧰", unlocked: false, unlockedAt: null, triggeredBy: null },
  { achievementId: "holiday_worker", title: "劳模认证", description: "节假日打开了工作软件", emoji: "💼", unlocked: false, unlockedAt: null, triggeredBy: null },
  { achievementId: "persistent", title: "坚持不懈", description: "应用崩溃后5秒内重新打开", emoji: "💪", unlocked: false, unlockedAt: null, triggeredBy: null },
  { achievementId: "fish", title: "摸鱼大宗师", description: "单一娱乐连续 3小时", emoji: "🐟", unlocked: false, unlockedAt: null, triggeredBy: null },
  { achievementId: "settings_bug", title: "Bug探索者", description: "今天在设置里待了45分钟+", emoji: "🔍", unlocked: false, unlockedAt: null, triggeredBy: null },
];

export function BadgesScreen() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const list = await getAchievements();
        setAchievements(list as never[]);
      } catch {
        setAchievements(EXTENDED_ACHIEVEMENTS.map((a, i) => ({ ...a, unlocked: i < 3, unlockedAt: i < 3 ? new Date().toISOString() : null })));
      } finally { setLoading(false); }
    }
    fetchAchievements();
  }, []);

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
  }

  return (
    <div className="relative min-h-svh pb-20 md:pb-0">
      <div className="absolute inset-0 pointer-events-none paper-texture opacity-80 z-0" />

      {/* 页面头部 */}
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-[var(--app-border)] bg-[var(--app-surface)]/80 backdrop-blur-sm sticky top-0">
        <h1 className="text-base font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>手帐奇珍陈列柜</h1>
        <Link href="/">
          <button aria-label="关闭" className="p-2 rounded-full hover:bg-[var(--app-border)] text-[var(--app-text)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </Link>
      </header>

      <div className="relative z-10 w-full p-4 space-y-4 pb-12">
        <p className="text-[11px] text-[var(--app-text-muted)] leading-relaxed">
          你的坏习惯、摸鱼史与难得的心流，在这里均可酿成徽章。供君消遣，不设奖惩。
        </p>

        {/* 解锁进度 */}
        {!loading && (
          <motion.div
            className="flex items-center gap-3 bg-[var(--card-warm)] border border-dashed border-[var(--card-warm-border)] rounded-xl px-4 py-2.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <span className="text-xl">🏅</span>
            <div>
              <p className="text-[11px] text-[var(--app-text)]">已解锁 <strong className="text-[var(--app-primary)]">{unlocked.length}</strong> / {achievements.length} 枚</p>
              <div className="mt-1 w-32 h-1 rounded-full bg-[var(--app-border)] overflow-hidden">
                <motion.div className="h-full rounded-full bg-[var(--app-primary)]" initial={{ width: 0 }} animate={{ width: `${achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div>
        ) : (
          <>
            {/* 已解锁成就 */}
            {unlocked.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold tracking-wider text-[var(--app-text-muted)] uppercase mb-3">已解锁</h3>
                <div className="grid grid-cols-2 gap-3">
                  {unlocked.map((badge, i) => (
                    <motion.div
                      key={badge.achievementId}
                      className="relative group border rounded-2xl p-3 bg-[var(--app-surface)] border-[var(--card-warm-border)] flex flex-col items-center text-center shadow-sm cursor-pointer"
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.03, rotate: [-1, 1][i % 2] }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className="absolute top-2 right-2 bg-[var(--app-success)] text-white px-1.5 py-0.5 rounded-full text-[8px] tracking-wider">达成</div>
                      <div className="w-10 h-10 rounded-xl bg-[var(--app-surface)] flex items-center justify-center text-2xl mb-2 shadow-inner group-hover:scale-110 transition-transform">
                        {badge.emoji}
                      </div>
                      <h4 className="text-xs font-bold text-[var(--app-text)]">{badge.title}</h4>
                      <p className="text-[8px] text-[var(--app-text-muted)] mt-1 line-clamp-2">{badge.description}</p>
                      {badge.unlockedAt && (
                        <p className="text-[8px] text-[var(--app-primary)] mt-1">{formatDate(badge.unlockedAt)} 解锁</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 待解锁成就 */}
            {locked.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold tracking-wider text-[var(--app-text-muted)] uppercase mb-3">未解锁</h3>
                <div className="grid grid-cols-2 gap-3">
                  {locked.map((badge, i) => (
                    <motion.div
                      key={badge.achievementId}
                      className="relative border rounded-2xl p-3 bg-[var(--badge-locked-bg)] border-[var(--badge-locked-border)] flex flex-col items-center text-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                    >
                      {/* 锁定图标 */}
                      <div className="absolute top-2 right-2 bg-[var(--badge-locked-icon-bg)] text-[var(--app-text)] p-1 rounded-full">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                          <rect height="11" rx="2" ry="2" width="18" x="3" y="11"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[var(--badge-locked-emoji-bg)] flex items-center justify-center text-2xl mb-2 shadow-inner">
                        <span style={{ filter: "grayscale(100%)", opacity: 0.45 }}>{badge.emoji}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[var(--app-text)]">{badge.title}</h4>
                      <p className="text-[8px] text-[var(--app-text-muted)] mt-1 line-clamp-2">{badge.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/// 成就解锁检测：在每次应用切换后异步触发

use std::sync::Mutex;
use crate::database::Database;

pub async fn check(handle: &tauri::AppHandle) {
    let db_state = handle.state::<Mutex<Database>>();
    let mut db = db_state.lock().unwrap();
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let hour  = chrono::Local::now().hour();

    // 今日统计
    let Ok(stats) = db.day_stats(&today) else { return };

    // ── 连续使用记录
    let _ = check_usage_time(&mut db, stats.total_seconds);

    // ── 夜猫子（凌晨 0–5 点还在用）
    if hour < 5 {
        let _ = db.unlock_achievement(
            "night_owl", "夜猫子 🦉",
            "凌晨还在用电脑",
            "🦉", &format!("凌晨 {}:00 在使用电脑", hour)
        );
    }

    // ── 切换狂（今日超 300 次切换）
    if stats.session_count > 300 {
        let _ = db.unlock_achievement(
            "switcher_pro", "手速达人 ⚡",
            "今日应用切换超过 300 次",
            "⚡", &format!("切换 {} 次", stats.session_count)
        );
    }

    // ── 长时间沉浸（单日超 8 小时）
    if stats.total_seconds >= 8 * 3600 {
        let _ = db.unlock_achievement(
            "marathon", "马拉松选手 🏃",
            "单日使用超过 8 小时",
            "🏃", &format!("使用 {}h", stats.total_seconds / 3600)
        );
    }
}

fn check_usage_time(db: &mut Database, total_secs: i64) {
    // 累计 100 小时
    let all_time: i64 = db.conn_query_one(
        "SELECT COALESCE(SUM(duration_ms),0)/1000 FROM app_sessions WHERE is_idle=0",
        [],
        |r| r.get(0)
    ).unwrap_or(0);

    if all_time >= 100 * 3600 {
        let _ = db.unlock_achievement(
            "century", "百小时成就 💯",
            "累计使用时长突破 100 小时",
            "💯", "累计 100 小时"
        );
    }
}

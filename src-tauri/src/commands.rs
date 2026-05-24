use tauri::State;
use std::sync::Mutex;
use crate::database::Database;
use serde_json::{json, Value};
use chrono::Local;

pub type DbState = Mutex<Database>;

// ─── 今日统计 ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_today_stats(db: State<DbState>) -> Value {
    let today = Local::now().format("%Y-%m-%d").to_string();
    match db.lock().unwrap().day_stats(&today) {
        Ok(s) => json!({
            "stat": {
                "totalSeconds":   s.total_seconds,
                "activeSeconds":  s.active_seconds,
                "sessionCount":   s.session_count,
                "fragmentScore":  s.fragment_score,
                "humorQuip":      generate_quip(s.total_seconds, s.session_count),
            },
            "date": today,
        }),
        Err(e) => json!({ "error": e.to_string() }),
    }
}

// ─── 应用用时 ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_app_totals(db: State<DbState>, date: Option<String>) -> Value {
    let d = date.unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());
    match db.lock().unwrap().app_totals(&d) {
        Ok(totals) => json!(totals),
        Err(e) => json!({ "error": e.to_string() }),
    }
}

// ─── 时间线 ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_timeline(db: State<DbState>, date: Option<String>) -> Value {
    let d = date.unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());
    match db.lock().unwrap().timeline(&d) {
        Ok(events) => json!(events),
        Err(e) => json!({ "error": e.to_string() }),
    }
}

// ─── 热力图 ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_heatmap(db: State<DbState>, days: Option<u32>) -> Value {
    match db.lock().unwrap().heatmap(days.unwrap_or(14)) {
        Ok(data) => json!({ "heatmap": data }),
        Err(e) => json!({ "error": e.to_string() }),
    }
}

// ─── 当前活跃应用（实时）─────────────────────────────────────────────────────

#[tauri::command]
pub fn get_active_app() -> Value {
    match crate::tracker::platform::get_active_app() {
        Some(app) => json!({ "app": app }),
        None      => json!({ "app": null }),
    }
}

// ─── 空闲秒数 ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_idle_seconds() -> u32 {
    crate::idle::idle_seconds()
}

// ─── 成就 ──────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_achievements(db: State<DbState>) -> Value {
    match db.lock().unwrap().get_achievements() {
        Ok(list) => json!(list),
        Err(e)   => json!({ "error": e.to_string() }),
    }
}

// ─── 设置：应用标签 ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_labels(db: State<DbState>) -> Value {
    // 从 app_sessions 里聚合近 30 天出现过的应用作为标签列表
    let db = db.lock().unwrap();
    let since = chrono::Utc::now().timestamp_millis() - 30 * 86_400_000i64;
    let result: rusqlite::Result<Vec<Value>> = db.conn_query(
        "SELECT DISTINCT process_name, app_name, category FROM app_sessions
         WHERE started_at >= ?1 ORDER BY app_name LIMIT 50",
        rusqlite::params![since],
        |r| Ok(json!({
            "processName":    r.get::<_,String>(0)?,
            "appName":        r.get::<_,String>(1)?,
            "category":       r.get::<_,String>(2)?,
            "isProductivity": false,
            "isBlackhole":    false,
        })),
    );
    json!(result.unwrap_or_default())
}

// ─── 冷幽默文案生成器 ──────────────────────────────────────────────────────────

fn generate_quip(total_secs: i64, session_count: i64) -> String {
    let h = total_secs / 3600;
    let m = (total_secs % 3600) / 60;
    let hour = chrono::Local::now().hour();

    if total_secs == 0 {
        return "今天数据还没开始采集，先喝杯水吧。".to_string();
    }
    if hour >= 0 && hour < 6 {
        return format!("凌晨还在用电脑，共 {}h{}m，小心发际线。", h, m);
    }
    if session_count > 200 {
        return format!("今天切换了 {} 次应用，专注力已碎成马赛克。", session_count);
    }
    if h >= 10 {
        return format!("今天用了 {}h{}m，电脑比你还累。", h, m);
    }
    format!("今天累计 {}h{}m，{}次切换，持续观察中。", h, m, session_count)
}

// 需要在 Database 上暴露一个通用查询接口
// 为避免 Rust borrow 问题，在 database.rs 里补一个 conn_query

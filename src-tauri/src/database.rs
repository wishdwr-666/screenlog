use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use chrono::{Utc, TimeZone, Local};

// ─── 数据结构 ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct NewSession {
    pub app_name: String,
    pub process_name: String,
    pub window_title: String,
    pub exe_path: String,
    pub category: String,
    pub started_at: i64,
    pub power_source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppTotal {
    pub app_name: String,
    pub process_name: String,
    pub category: String,
    pub total_seconds: i64,
    pub session_count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DayStats {
    pub total_seconds: i64,
    pub active_seconds: i64,
    pub session_count: i64,
    pub fragment_score: f64,   // 0–100，越低越碎片化
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimelineEvent {
    pub id: i64,
    pub app_name: String,
    pub process_name: String,
    pub category: String,
    pub window_title: String,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub duration_seconds: i64,
    pub is_idle: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HeatmapEntry {
    pub date: String,          // "2024-05-01"
    pub hours: Vec<i64>,       // 24 个小时各活跃秒数
}

// ─── 数据库 ────────────────────────────────────────────────────────────────────

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        // 确保父目录存在
        if let Some(parent) = std::path::Path::new(db_path).parent() {
            std::fs::create_dir_all(parent).ok();
        }
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")?;
        Self::migrate(&conn)?;
        Ok(Self { conn })
    }

    fn migrate(conn: &Connection) -> Result<()> {
        conn.execute_batch("
            CREATE TABLE IF NOT EXISTS app_sessions (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                app_name      TEXT    NOT NULL,
                process_name  TEXT    NOT NULL,
                window_title  TEXT    DEFAULT '',
                exe_path      TEXT    DEFAULT '',
                category      TEXT    DEFAULT 'other',
                started_at    INTEGER NOT NULL,
                ended_at      INTEGER,
                duration_ms   INTEGER,
                is_idle       INTEGER DEFAULT 0,
                power_source  TEXT    DEFAULT 'ac'
            );
            CREATE INDEX IF NOT EXISTS idx_started ON app_sessions(started_at);
            CREATE INDEX IF NOT EXISTS idx_app     ON app_sessions(app_name, started_at);

            CREATE TABLE IF NOT EXISTS app_labels (
                process_name    TEXT PRIMARY KEY,
                app_name        TEXT NOT NULL,
                category        TEXT DEFAULT 'other',
                is_productivity INTEGER DEFAULT 0,
                is_blackhole    INTEGER DEFAULT 0,
                updated_at      INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS achievements (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                achievement_id  TEXT NOT NULL UNIQUE,
                title           TEXT NOT NULL,
                description     TEXT,
                emoji           TEXT,
                unlocked_at     INTEGER NOT NULL,
                triggered_by    TEXT
            );
        ")?;
        Ok(())
    }

    // ── Session CRUD ─────────────────────────────────────────────────────────

    pub fn insert_session(&self, s: &NewSession) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO app_sessions (app_name, process_name, window_title, exe_path,
             category, started_at, power_source) VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![s.app_name, s.process_name, s.window_title, s.exe_path,
                    s.category, s.started_at, s.power_source],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn end_session(&self, id: i64, ended_at: i64) -> Result<()> {
        self.conn.execute(
            "UPDATE app_sessions SET ended_at=?1, duration_ms=?1-started_at WHERE id=?2",
            params![ended_at, id],
        )?;
        Ok(())
    }

    // ── 统计查询 ──────────────────────────────────────────────────────────────

    pub fn day_stats(&self, date_str: &str) -> Result<DayStats> {
        let (start, end) = day_range_ms(date_str);
        let row = self.conn.query_row(
            "SELECT COALESCE(SUM(duration_ms),0), COUNT(*)
             FROM app_sessions
             WHERE started_at>=?1 AND started_at<?2 AND is_idle=0 AND duration_ms IS NOT NULL",
            params![start, end],
            |r| Ok((r.get::<_,i64>(0)?, r.get::<_,i64>(1)?)),
        )?;
        let total_ms = row.0;
        let count    = row.1;
        // 碎片度：平均会话时长越短，碎片越高
        let avg_ms = if count > 0 { total_ms / count } else { 0 };
        let frag = if avg_ms >= 1_800_000 { 100.0 }
                   else { (avg_ms as f64 / 1_800_000.0 * 100.0).clamp(0.0, 100.0) };
        Ok(DayStats {
            total_seconds:  total_ms / 1000,
            active_seconds: total_ms / 1000,
            session_count:  count,
            fragment_score: frag,
        })
    }

    pub fn app_totals(&self, date_str: &str) -> Result<Vec<AppTotal>> {
        let (start, end) = day_range_ms(date_str);
        let mut stmt = self.conn.prepare(
            "SELECT app_name, process_name, category,
                    COALESCE(SUM(duration_ms),0) as total_ms, COUNT(*) as cnt
             FROM app_sessions
             WHERE started_at>=?1 AND started_at<?2 AND is_idle=0
             GROUP BY app_name ORDER BY total_ms DESC LIMIT 30",
        )?;
        let rows = stmt.query_map(params![start, end], |r| {
            Ok(AppTotal {
                app_name:      r.get(0)?,
                process_name:  r.get(1)?,
                category:      r.get(2)?,
                total_seconds: r.get::<_,i64>(3)? / 1000,
                session_count: r.get(4)?,
            })
        })?;
        rows.collect()
    }

    pub fn timeline(&self, date_str: &str) -> Result<Vec<TimelineEvent>> {
        let (start, end) = day_range_ms(date_str);
        let mut stmt = self.conn.prepare(
            "SELECT id, app_name, process_name, category, window_title,
                    started_at, ended_at,
                    COALESCE(duration_ms, 0) / 1000, is_idle
             FROM app_sessions
             WHERE started_at>=?1 AND started_at<?2
             ORDER BY started_at ASC LIMIT 500",
        )?;
        let rows = stmt.query_map(params![start, end], |r| {
            Ok(TimelineEvent {
                id:               r.get(0)?,
                app_name:         r.get(1)?,
                process_name:     r.get(2)?,
                category:         r.get(3)?,
                window_title:     r.get(4)?,
                started_at:       r.get(5)?,
                ended_at:         r.get(6)?,
                duration_seconds: r.get(7)?,
                is_idle:          r.get::<_,i32>(8)? != 0,
            })
        })?;
        rows.collect()
    }

    /// 生成热力图数据（最近 N 天，每天 24 小时活跃秒数）
    pub fn heatmap(&self, days: u32) -> Result<Vec<HeatmapEntry>> {
        let mut result = Vec::new();
        let now = Utc::now();
        for d in 0..days {
            let date = now - chrono::Duration::days(d as i64);
            let date_str = date.format("%Y-%m-%d").to_string();
            let (start, end) = day_range_ms(&date_str);
            let mut hours = vec![0i64; 24];
            let mut stmt = self.conn.prepare(
                "SELECT started_at, COALESCE(duration_ms, 0)
                 FROM app_sessions
                 WHERE started_at>=?1 AND started_at<?2 AND is_idle=0",
            )?;
            let rows = stmt.query_map(params![start, end], |r| {
                Ok((r.get::<_,i64>(0)?, r.get::<_,i64>(1)?))
            })?;
            for row in rows.flatten() {
                let h = ((row.0 - start) / 3_600_000) as usize;
                if h < 24 { hours[h] += row.1 / 1000; }
            }
            result.push(HeatmapEntry { date: date_str, hours });
        }
        Ok(result)
    }

    // ── 成就解锁 ──────────────────────────────────────────────────────────────

    pub fn unlock_achievement(&self, id: &str, title: &str, desc: &str,
                              emoji: &str, trigger: &str) -> Result<bool> {
        let exists: bool = self.conn.query_row(
            "SELECT 1 FROM achievements WHERE achievement_id=?1",
            params![id], |_| Ok(true)
        ).unwrap_or(false);
        if exists { return Ok(false); }
        let now = Utc::now().timestamp_millis();
        self.conn.execute(
            "INSERT INTO achievements (achievement_id,title,description,emoji,unlocked_at,triggered_by)
             VALUES (?1,?2,?3,?4,?5,?6)",
            params![id, title, desc, emoji, now, trigger],
        )?;
        Ok(true)
    }

    pub fn get_achievements(&self) -> Result<Vec<serde_json::Value>> {
        let mut stmt = self.conn.prepare(
            "SELECT achievement_id,title,description,emoji,unlocked_at,triggered_by
             FROM achievements ORDER BY unlocked_at DESC"
        )?;
        let rows = stmt.query_map([], |r| {
            Ok(serde_json::json!({
                "achievementId": r.get::<_,String>(0)?,
                "title":         r.get::<_,String>(1)?,
                "description":   r.get::<_,String>(2)?,
                "emoji":         r.get::<_,String>(3)?,
                "unlockedAt":    r.get::<_,i64>(4)?,
                "triggeredBy":   r.get::<_,Option<String>>(5)?,
            }))
        })?;
        rows.collect()
    }
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

fn day_range_ms(date_str: &str) -> (i64, i64) {
    use chrono::NaiveDate;
    let date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
        .unwrap_or_else(|_| Local::now().date_naive());
    let start = date.and_hms_opt(0,0,0).unwrap()
        .and_local_timezone(Local).unwrap()
        .timestamp_millis();
    let end = date.and_hms_opt(23,59,59).unwrap()
        .and_local_timezone(Local).unwrap()
        .timestamp_millis() + 999;
    (start, end)
}

impl Database {
    pub fn conn_query<T, F>(
        &self, sql: &str, params: impl rusqlite::Params,
        f: F,
    ) -> rusqlite::Result<Vec<T>>
    where F: Fn(&rusqlite::Row<'_>) -> rusqlite::Result<T>
    {
        let mut stmt = self.conn.prepare(sql)?;
        stmt.query_map(params, f)?.collect()
    }

    pub fn conn_query_one<T>(
        &self, sql: &str, params: impl rusqlite::Params,
        f: impl Fn(&rusqlite::Row<'_>) -> rusqlite::Result<T>,
    ) -> rusqlite::Result<T> {
        self.conn.query_row(sql, params, f)
    }
}

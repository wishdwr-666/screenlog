#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod tracker;
mod idle;
mod database;
mod commands;
mod achievements;

use std::sync::Mutex;
use std::time::Duration;
use database::Database;
use tauri::Manager;
use tokio::time;

#[tokio::main]
async fn main() {
    env_logger::init();

    tauri::Builder::default()
        .setup(|app| {
            let db_path = {
                let handle = app.handle();
                let data_dir = handle.path().app_data_dir()
                    .expect("获取数据目录失败");
                data_dir.join("data.db").to_string_lossy().to_string()
            };
            let db = Database::new(&db_path).expect("数据库初始化失败");
            app.manage(Mutex::new(db));

            let handle = app.handle().clone();
            tokio::spawn(async move {
                run_tracker(handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_today_stats,
            commands::get_app_totals,
            commands::get_timeline,
            commands::get_heatmap,
            commands::get_active_app,
            commands::get_idle_seconds,
            commands::get_achievements,
            commands::get_labels,
        ])
        .run(tauri::generate_context!())
        .expect("Tauri 启动失败");
}

/// 每秒轮询前台应用，写入 SQLite
async fn run_tracker(handle: tauri::AppHandle) {
    let mut current_id: Option<i64> = None;
    let mut last_process: Option<String> = None;
    let idle_threshold: u32 = 6 * 60; // 默认 6 分钟

    let mut ticker = time::interval(Duration::from_secs(1));
    loop {
        ticker.tick().await;

        // 空闲检测
        if idle::is_idle(idle_threshold) {
            if let Some(id) = current_id.take() {
                let now = chrono::Utc::now().timestamp_millis();
                let db = handle.state::<Mutex<Database>>();
                let _ = db.lock().unwrap().end_session(id, now);
                last_process = None;
            }
            continue;
        }

        // 获取前台应用
        let Some(app) = tracker::platform::get_active_app() else { continue };
        let changed = last_process.as_deref() != Some(&app.process_name);

        if changed {
            let now = chrono::Utc::now().timestamp_millis();
            let db_state = handle.state::<Mutex<Database>>();
            let mut db = db_state.lock().unwrap();

            // 结束上一个 session
            if let Some(id) = current_id.take() {
                let _ = db.end_session(id, now);
            }

            // 开启新 session
            let new_session = database::NewSession {
                app_name:     app.app_name.clone(),
                process_name: app.process_name.clone(),
                window_title: app.window_title.clone(),
                exe_path:     app.exe_path.clone(),
                category:     tracker::ActiveApp::category(&app.process_name).to_string(),
                started_at:   now,
                power_source: idle::power_source().to_string(),
            };
            if let Ok(id) = db.insert_session(&new_session) {
                current_id = Some(id);
                last_process = Some(app.process_name);
            }

            // 异步检查成就
            let handle2 = handle.clone();
            tokio::spawn(async move {
                achievements::check(&handle2).await;
            });
        }
    }
}

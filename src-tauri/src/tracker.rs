use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ActiveApp {
    pub app_name: String,
    pub process_name: String,
    pub window_title: String,
    pub exe_path: String,
    pub pid: u32,
}

impl ActiveApp {
    /// 从进程名推断友好名称（中英文常见应用）
    pub fn friendly_name(process_name: &str) -> String {
        let n = process_name.to_lowercase();
        let mapped = match n.as_str() {
            // 开发工具
            "code.exe"            => "VS Code",
            "cursor.exe"          => "Cursor",
            "pycharm64.exe"       => "PyCharm",
            "idea64.exe"          => "IntelliJ IDEA",
            "webstorm64.exe"      => "WebStorm",
            "clion64.exe"         => "CLion",
            "goland64.exe"        => "GoLand",
            "rider64.exe"         => "Rider",
            "devenv.exe"          => "Visual Studio",
            "sublime_text.exe"    => "Sublime Text",
            "atom.exe"            => "Atom",
            "notepad++.exe"       => "Notepad++",
            "notepad.exe"         => "记事本",
            "windowsterminal.exe" => "Windows Terminal",
            "powershell.exe"      => "PowerShell",
            "cmd.exe"             => "命令提示符",
            // 浏览器
            "chrome.exe"          => "Chrome",
            "msedge.exe"          => "Edge",
            "firefox.exe"         => "Firefox",
            "brave.exe"           => "Brave",
            "opera.exe"           => "Opera",
            "vivaldi.exe"         => "Vivaldi",
            // 社交通讯
            "wechat.exe"          => "微信",
            "qq.exe"              => "QQ",
            "dingtalk.exe"        => "钉钉",
            "feishu.exe"          => "飞书",
            "lark.exe"            => "飞书",
            "slack.exe"           => "Slack",
            "discord.exe"         => "Discord",
            "teams.exe"           => "Microsoft Teams",
            "zoom.exe"            => "Zoom",
            "telegram.exe"        => "Telegram",
            // Office 套件
            "winword.exe"         => "Word",
            "excel.exe"           => "Excel",
            "powerpnt.exe"        => "PowerPoint",
            "onenote.exe"         => "OneNote",
            "outlook.exe"         => "Outlook",
            "wps.exe"             => "WPS Writer",
            "et.exe"              => "WPS Spreadsheet",
            "wpp.exe"             => "WPS Presentation",
            // 设计/创意
            "figma.exe"           => "Figma",
            "photoshop.exe"       => "Photoshop",
            "illustrator.exe"     => "Illustrator",
            "xd.exe"              => "Adobe XD",
            "premiere.exe"        => "Premiere",
            "afterfx.exe"         => "After Effects",
            "sketch.exe"          => "Sketch",
            // 笔记/知识库
            "obsidian.exe"        => "Obsidian",
            "notion.exe"          => "Notion",
            "logseq.exe"          => "Logseq",
            "typora.exe"          => "Typora",
            // 娱乐
            "steam.exe"           => "Steam",
            "epicgameslauncher.exe" => "Epic Games",
            "spotify.exe"         => "Spotify",
            "vlc.exe"             => "VLC",
            "potplayer.exe"       => "PotPlayer",
            // 系统
            "explorer.exe"        => "文件资源管理器",
            "taskmgr.exe"         => "任务管理器",
            "mmc.exe"             => "系统管理",
            _ => "",
        };
        if mapped.is_empty() {
            // 去掉 .exe 后缀作为兜底
            process_name.trim_end_matches(".exe")
                        .trim_end_matches(".EXE")
                        .to_string()
        } else {
            mapped.to_string()
        }
    }

    /// 根据进程名自动分类
    pub fn category(process_name: &str) -> &'static str {
        let n = process_name.to_lowercase();
        match n.as_str() {
            "code.exe" | "cursor.exe" | "pycharm64.exe" | "idea64.exe" |
            "webstorm64.exe" | "devenv.exe" | "sublime_text.exe" |
            "notepad++.exe" | "windowsterminal.exe" | "powershell.exe" |
            "cmd.exe" | "goland64.exe" | "rider64.exe"
                => "work",

            "wechat.exe" | "qq.exe" | "dingtalk.exe" | "feishu.exe" |
            "slack.exe" | "discord.exe" | "teams.exe" | "zoom.exe" |
            "telegram.exe"
                => "social",

            "chrome.exe" | "msedge.exe" | "firefox.exe" | "brave.exe" |
            "opera.exe"
                => "tool",

            "steam.exe" | "epicgameslauncher.exe" | "spotify.exe" |
            "vlc.exe" | "potplayer.exe"
                => "entertainment",

            "winword.exe" | "excel.exe" | "powerpnt.exe" | "onenote.exe" |
            "wps.exe" | "et.exe" | "wpp.exe" | "notion.exe" |
            "obsidian.exe" | "typora.exe" | "logseq.exe"
                => "study",

            _ => "other",
        }
    }
}

// ─── Windows 实现 ────────────────────────────────────────────────────────────

#[cfg(target_os = "windows")]
pub mod platform {
    use super::ActiveApp;
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId,
    };
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
        PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows::core::PWSTR;
    use std::path::PathBuf;

    pub fn get_active_app() -> Option<ActiveApp> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() { return None; }

            // 窗口标题
            let mut title_buf = [0u16; 512];
            let tlen = GetWindowTextW(hwnd, &mut title_buf);
            let window_title = String::from_utf16_lossy(&title_buf[..tlen as usize]);

            // 进程 ID
            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));
            if pid == 0 { return None; }

            // 可执行文件路径
            let process = OpenProcess(
                PROCESS_QUERY_LIMITED_INFORMATION, false, pid
            ).ok()?;
            let mut path_buf = [0u16; 1024];
            let mut size = path_buf.len() as u32;
            QueryFullProcessImageNameW(
                process,
                PROCESS_NAME_WIN32,
                PWSTR(path_buf.as_mut_ptr()),
                &mut size,
            ).ok()?;
            let exe_path = String::from_utf16_lossy(&path_buf[..size as usize]);
            let process_name = PathBuf::from(&exe_path)
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let app_name = ActiveApp::friendly_name(&process_name);

            Some(ActiveApp { app_name, process_name, window_title, exe_path, pid })
        }
    }
}

// ─── macOS 实现 ──────────────────────────────────────────────────────────────

#[cfg(target_os = "macos")]
pub mod platform {
    use super::ActiveApp;
    use std::process::Command;

    pub fn get_active_app() -> Option<ActiveApp> {
        // AppleScript 获取前台应用名
        let out = Command::new("osascript")
            .args(["-e",
                "tell application \"System Events\" to \
                 get name of first application process whose frontmost is true"])
            .output().ok()?;
        let app_name = String::from_utf8(out.stdout).ok()?.trim().to_string();
        if app_name.is_empty() { return None; }
        let process_name = app_name.clone();
        Some(ActiveApp {
            app_name: ActiveApp::friendly_name(&process_name),
            process_name,
            ..Default::default()
        })
    }
}

// ─── Linux 实现（备用）──────────────────────────────────────────────────────

#[cfg(target_os = "linux")]
pub mod platform {
    use super::ActiveApp;
    use std::process::Command;

    pub fn get_active_app() -> Option<ActiveApp> {
        let out = Command::new("xdotool")
            .args(["getactivewindow", "getwindowname"])
            .output().ok()?;
        let window_title = String::from_utf8(out.stdout).ok()?.trim().to_string();
        Some(ActiveApp { window_title, ..Default::default() })
    }
}

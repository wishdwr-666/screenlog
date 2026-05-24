/// 空闲检测：返回自上次输入以来的秒数

#[cfg(target_os = "windows")]
pub mod platform {
    use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    use windows::Win32::System::SystemInformation::GetTickCount;

    pub fn idle_seconds() -> u32 {
        unsafe {
            let mut info = LASTINPUTINFO {
                cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
                dwTime: 0,
            };
            if GetLastInputInfo(&mut info).as_bool() {
                let now = GetTickCount();
                now.wrapping_sub(info.dwTime) / 1000
            } else {
                0
            }
        }
    }

    pub fn power_source() -> &'static str {
        use windows::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};
        unsafe {
            let mut status = SYSTEM_POWER_STATUS::default();
            if GetSystemPowerStatus(&mut status).as_bool() {
                // ACLineStatus: 0=Battery, 1=AC, 255=Unknown
                if status.ACLineStatus == 1 { "ac" } else { "battery" }
            } else {
                "unknown"
            }
        }
    }
}

#[cfg(target_os = "macos")]
pub mod platform {
    use std::process::Command;

    pub fn idle_seconds() -> u32 {
        // 通过 ioreg 读取 HIDIdleTime（纳秒）
        let out = Command::new("ioreg")
            .args(["-c", "IOHIDSystem"])
            .output()
            .ok();
        if let Some(o) = out {
            let s = String::from_utf8_lossy(&o.stdout);
            for line in s.lines() {
                if line.contains("HIDIdleTime") {
                    if let Some(v) = line.split('=').nth(1) {
                        if let Ok(ns) = v.trim().parse::<u64>() {
                            return (ns / 1_000_000_000) as u32;
                        }
                    }
                }
            }
        }
        0
    }

    pub fn power_source() -> &'static str {
        let out = Command::new("pmset").args(["-g", "batt"]).output();
        if let Ok(o) = out {
            let s = String::from_utf8_lossy(&o.stdout);
            if s.contains("AC Power") { "ac" } else { "battery" }
        } else {
            "unknown"
        }
    }
}

#[cfg(target_os = "linux")]
pub mod platform {
    pub fn idle_seconds() -> u32 { 0 }
    pub fn power_source() -> &'static str { "unknown" }
}

pub fn idle_seconds() -> u32     { platform::idle_seconds() }
pub fn power_source() -> &'static str { platform::power_source() }
pub fn is_idle(threshold_secs: u32) -> bool { idle_seconds() >= threshold_secs }

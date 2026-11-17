use serde::Serialize;
use std::path::PathBuf;

/// 内核组件探测（EasyTier sidecar 是否随包存在）。
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KernelStatus {
    pub easytier_found: bool,
    pub easytier_version: Option<String>,
    pub path: Option<String>,
}

#[tauri::command]
pub fn kernel_status(app: tauri::AppHandle) -> KernelStatus {
    use tauri::Manager;

    let mut candidates: Vec<PathBuf> = Vec::new();

    // 开发期：直接指向源码目录里的资源
    candidates.push(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("resources")
            .join("easytier")
            .join("easytier-core.exe"),
    );
    // 打包后：Tauri 资源目录
    if let Ok(dir) = app.path().resource_dir() {
        candidates.push(dir.join("easytier").join("easytier-core.exe"));
        candidates.push(dir.join("resources").join("easytier").join("easytier-core.exe"));
    }
    // 便携模式：exe 同级
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            candidates.push(parent.join("easytier").join("easytier-core.exe"));
            candidates.push(parent.join("resources").join("easytier").join("easytier-core.exe"));
        }
    }

    let found = candidates.into_iter().find(|path| path.exists());

    let version = found.as_ref().and_then(|path| {
        std::process::Command::new(path)
            .arg("--version")
            .output()
            .ok()
            .and_then(|output| {
                let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if text.is_empty() {
                    None
                } else {
                    Some(text.lines().next().unwrap_or("").to_string())
                }
            })
    });

    KernelStatus {
        easytier_found: found.is_some(),
        easytier_version: version,
        path: found.map(|path| path.to_string_lossy().to_string()),
    }
}

/// 内核还没有接入，先用这个命令给前端确认运行环境。
#[derive(Serialize)]
pub struct RuntimeInfo {
    pub version: String,
    pub kernel: String,
    pub preview: bool,
}

#[tauri::command]
pub fn runtime_info() -> RuntimeInfo {
    RuntimeInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        kernel: "mock".to_string(),
        preview: true,
    }
}

/// 最小化 / 关闭。放到 Rust 侧执行，绕开前端 window API 的权限差异。
#[tauri::command]
pub fn window_minimize(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn window_close(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|error| error.to_string())
}

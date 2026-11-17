mod commands;
mod room;

use std::path::PathBuf;

/// 便携模式：WebView2 的缓存和运行数据放在可执行文件旁的 data/ 目录，不写系统盘。
fn setup_portable_data_dir() {
    if std::env::var_os("WEBVIEW2_USER_DATA_FOLDER").is_some() {
        return;
    }
    let base = std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(PathBuf::from))
        .unwrap_or_else(|| PathBuf::from("."));
    let dir = base.join("data").join("webview");
    if std::fs::create_dir_all(&dir).is_ok() {
        std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", dir);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    setup_portable_data_dir();

    tauri::Builder::default()
        .manage(room::RoomManager::default())
        .invoke_handler(tauri::generate_handler![
            commands::runtime_info,
            commands::kernel_status,
            commands::window_minimize,
            commands::window_close,
            room::room_create,
            room::room_join,
            room::room_leave,
            room::room_status
        ])
        .run(tauri::generate_context!())
        .expect("运行 BananaConnect 失败");
}

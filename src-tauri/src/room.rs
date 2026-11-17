use serde::Serialize;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Instant;

const ALPHABET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

pub struct Room {
    pub code: String,
    pub role: String,
    pub network: String,
    pub ip: String,
    pub port: u16,
    pub child: Child,
    pub started: Instant,
}

#[derive(Default)]
pub struct RoomManager {
    pub current: Mutex<Option<Room>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomInfo {
    pub code: String,
    pub role: String,
    pub ip: String,
    pub port: u16,
    pub uptime: u64,
    pub alive: bool,
}

fn hash64(text: &str) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in text.as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x1000_0000_01b3);
    }
    hash
}

fn secret_of(code: &str) -> String {
    format!("{:016x}{:016x}", hash64(code), hash64(&format!("bc:{code}")))
}

fn make_code() -> String {
    let mut seed = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|value| value.as_nanos() as u64)
        .unwrap_or(42);
    let mut code = String::new();
    for _ in 0..12 {
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        code.push(ALPHABET[(seed % ALPHABET.len() as u64) as usize] as char);
    }
    code
}

pub fn normalize(code: &str) -> String {
    code.chars()
        .filter(|ch| ch.is_ascii_alphanumeric())
        .map(|ch| ch.to_ascii_uppercase())
        .collect()
}

fn subnet(code: &str) -> String {
    let hash = hash64(code);
    let b1 = 1 + (hash % 200) as u8;
    let b2 = 1 + ((hash >> 8) % 200) as u8;
    format!("10.{b1}.{b2}.1")
}

pub fn find_core(app: &tauri::AppHandle) -> Option<PathBuf> {
    use tauri::Manager;

    let mut candidates: Vec<PathBuf> = vec![
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("resources")
            .join("easytier")
            .join("easytier-core.exe"),
    ];
    if let Ok(dir) = app.path().resource_dir() {
        candidates.push(dir.join("easytier").join("easytier-core.exe"));
        candidates.push(dir.join("resources").join("easytier").join("easytier-core.exe"));
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            candidates.push(parent.join("easytier").join("easytier-core.exe"));
            candidates.push(parent.join("resources").join("easytier").join("easytier-core.exe"));
        }
    }
    candidates.into_iter().find(|path| path.exists())
}

fn spawn(
    core: &PathBuf,
    network: &str,
    secret: &str,
    host_ip: Option<&str>,
    peers: &[String],
    broadcast_relay: bool,
) -> std::io::Result<Child> {
    let mut command = Command::new(core);
    command
        .arg("--network-name")
        .arg(network)
        .arg("--network-secret")
        .arg(secret)
        .arg("-l")
        .arg("tcp://0.0.0.0:11010")
        .arg("-l")
        .arg("udp://0.0.0.0:11010")
        .arg("--rpc-portal")
        .arg("127.0.0.1:15888")
        .arg("--console-log-level")
        .arg("warn")
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    if let Some(ip) = host_ip {
        command.arg("-i").arg(ip);
    } else {
        command.arg("-d");
    }

    if broadcast_relay {
        command.arg("--enable-udp-broadcast-relay").arg("true");
    }

    for peer in peers {
        command.arg("-p").arg(peer);
    }

    command.spawn()
}

fn alive(room: &mut Room) -> bool {
    matches!(room.child.try_wait(), Ok(None))
}

pub fn stop(manager: &RoomManager) {
    if let Ok(mut guard) = manager.current.lock() {
        if let Some(mut room) = guard.take() {
            let _ = room.child.kill();
            let _ = room.child.wait();
        }
    }
}

#[tauri::command]
pub fn room_create(
    app: tauri::AppHandle,
    manager: tauri::State<'_, RoomManager>,
    port: u16,
    note: String,
    relays: Vec<String>,
) -> Result<RoomInfo, String> {
    let _ = note;
    let core = find_core(&app).ok_or("找不到 easytier-core.exe")?;
    stop(&manager);

    let code = make_code();
    let network = format!("bc-{}", code.to_ascii_lowercase());
    let secret = secret_of(&code);
    let ip = subnet(&code);

    let mut child = spawn(&core, &network, &secret, Some(&ip), &relays, true)
        .map_err(|error| format!("启动 EasyTier 失败：{error}"))?;

    std::thread::sleep(std::time::Duration::from_millis(1500));
    if let Ok(Some(status)) = child.try_wait() {
        return Err(format!(
            "EasyTier 启动后退出（{status}）。通常是没有管理员权限、端口 11010 被占用，或虚拟网卡未安装。"
        ));
    }

    let info = RoomInfo {
        code: code.clone(),
        role: "host".into(),
        ip: ip.clone(),
        port,
        uptime: 0,
        alive: true,
    };

    if let Ok(mut guard) = manager.current.lock() {
        *guard = Some(Room {
            code,
            role: "host".into(),
            network,
            ip,
            port,
            child,
            started: Instant::now(),
        });
    }
    Ok(info)
}

#[tauri::command]
pub fn room_join(
    app: tauri::AppHandle,
    manager: tauri::State<'_, RoomManager>,
    code: String,
    relays: Vec<String>,
) -> Result<RoomInfo, String> {
    let core = find_core(&app).ok_or("找不到 easytier-core.exe")?;
    stop(&manager);

    let code = normalize(&code);
    if code.len() != 12 {
        return Err("邀请码应该是 12 位".into());
    }
    let network = format!("bc-{}", code.to_ascii_lowercase());
    let secret = secret_of(&code);

    let mut child = spawn(&core, &network, &secret, None, &relays, true)
        .map_err(|error| format!("启动 EasyTier 失败：{error}"))?;

    std::thread::sleep(std::time::Duration::from_millis(1500));
    if let Ok(Some(status)) = child.try_wait() {
        return Err(format!(
            "EasyTier 启动后退出（{status}）。通常是没有管理员权限、端口 11010 被占用，或虚拟网卡未安装。"
        ));
    }

    let info = RoomInfo {
        code: code.clone(),
        role: "guest".into(),
        ip: String::new(),
        port: 0,
        uptime: 0,
        alive: true,
    };

    if let Ok(mut guard) = manager.current.lock() {
        *guard = Some(Room {
            code,
            role: "guest".into(),
            network,
            ip: String::new(),
            port: 0,
            child,
            started: Instant::now(),
        });
    }
    Ok(info)
}

#[tauri::command]
pub fn room_leave(manager: tauri::State<'_, RoomManager>) {
    stop(&manager);
}

#[tauri::command]
pub fn room_status(manager: tauri::State<'_, RoomManager>) -> Option<RoomInfo> {
    let mut guard = manager.current.lock().ok()?;
    let room = guard.as_mut()?;
    let running = alive(room);
    Some(RoomInfo {
        code: room.code.clone(),
        role: room.role.clone(),
        ip: room.ip.clone(),
        port: room.port,
        uptime: room.started.elapsed().as_secs(),
        alive: running,
    })
}

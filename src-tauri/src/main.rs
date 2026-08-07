// Sawere Legal OS — Windows desktop shell.
//
// The Next.js app is NOT statically exported (it needs Prisma/Postgres
// access, server-side Supabase auth cookies, and streaming AI routes), so
// this shell doesn't load static files directly. Instead it spawns the
// `.next/standalone` Node server as a background process on startup and
// points the webview at it — see docs/DESKTOP.md for the packaging steps
// (bundling a portable Node runtime as a Tauri sidecar binary).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let shell = app.shell();
            // In production this resolves to the bundled Node sidecar
            // running `.next/standalone/server.js`; in `tauri dev` the
            // Next.js dev server is already started by `beforeDevCommand`.
            if !cfg!(debug_assertions) {
                let (_rx, _child) = shell
                    .command("node")
                    .args([".next/standalone/server.js"])
                    .spawn()
                    .expect("failed to start the Sawere Legal OS server");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Sawere Legal OS desktop shell");
}

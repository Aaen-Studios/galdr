use std::path::PathBuf;

use crate::ffmpeg::probe_file;
use crate::models::MediaInfo;

#[tauri::command]
pub async fn get_media_info(path: PathBuf) -> Result<MediaInfo, String> {
    probe_file(&path)
}

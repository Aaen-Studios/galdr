#![allow(dead_code)]

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::ConversionParams;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JobStatus {
    Queued,
    Running,
    Completed,
    Failed(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub id: Uuid,
    pub params: ConversionParams,
    pub status: JobStatus,
    pub progress: f64,
    pub output_path: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl Job {
    pub fn new(params: ConversionParams) -> Self {
        Self {
            id: Uuid::new_v4(),
            params,
            status: JobStatus::Queued,
            progress: 0.0,
            output_path: None,
            created_at: Utc::now(),
        }
    }
}

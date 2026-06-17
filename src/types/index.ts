export interface ConversionParams {
  input_path: string;
  output_dir: string;
  output_format: string;
  video_codec?: string;
  audio_codec?: string;
  video_bitrate?: string;
  audio_bitrate?: string;
  resolution?: [number, number];
  framerate?: number;
  crf?: number;
  preset?: string;
  quality?: number;
}

export interface StreamInfo {
  index: number;
  kind: string;
  codec: string;
  width?: number;
  height?: number;
  frame_rate?: number;
  sample_rate?: number;
  channels?: number;
  bitrate?: number;
  language?: string;
}

export interface MediaInfo {
  container: string;
  streams: StreamInfo[];
  duration: number;
  bitrate?: number;
  size: number;
}

export interface ConversionProgress {
  job_id: string;
  progress: number;
}

export interface ConversionDone {
  job_id: string;
  output_path: string;
}

export interface ScannedFile {
  path: string;
  name: string;
  size: number;
}

export interface BatchProgress {
  total: number;
  done: number;
  failed: number;
  current_file: string;
  file_progress: number;
}

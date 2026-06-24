import { MediaMetadata } from '../types.js';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg', 'ico', 'heic', 'raw']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a']);

export function isImageExtension(ext: string): boolean {
  return IMAGE_EXTENSIONS.has(ext);
}

export function isVideoExtension(ext: string): boolean {
  return VIDEO_EXTENSIONS.has(ext);
}

export function isAudioExtension(ext: string): boolean {
  return AUDIO_EXTENSIONS.has(ext);
}

export async function extractMediaMetadata(filePath: string, extension: string): Promise<MediaMetadata | undefined> {
  // Optional dependency — graceful fallback
  if (isImageExtension(extension)) {
    return extractImageMetadata(filePath);
  }
  if (isVideoExtension(extension) || isAudioExtension(extension)) {
    return extractAVMetadata(filePath);
  }
  return undefined;
}

async function extractImageMetadata(filePath: string): Promise<MediaMetadata | undefined> {
  try {
    // Dynamic import — sharp is an optional dependency
    const sharp = (await Function('return import("sharp")')()) as { default: (path: string) => { metadata: () => Promise<{ width?: number; height?: number }> } };
    const metadata = await sharp.default(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  } catch {
    return undefined;
  }
}

async function extractAVMetadata(_filePath: string): Promise<MediaMetadata | undefined> {
  // ffprobe integration — optional, returns undefined if not available
  try {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execFileAsync = promisify(execFile);

    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format', '-show_streams',
      _filePath,
    ]);

    const data = JSON.parse(stdout);
    const stream = data.streams?.[0];
    const format = data.format;

    return {
      width: stream?.width,
      height: stream?.height,
      duration: format?.duration ? parseFloat(format.duration) : undefined,
      bitrate: format?.bit_rate ? parseInt(format.bit_rate, 10) : undefined,
    };
  } catch {
    return undefined;
  }
}

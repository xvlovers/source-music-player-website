import type { MusicTrack } from "@/types/music";

export type ApiErrorCode =
  | "INVALID_QUERY"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_ERROR"
  | "NOT_FOUND"
  | "UNKNOWN_INTERNAL_ERROR";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
}

export interface ApiError {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** GET /api/search?q= */
export type SearchApiResponse = ApiResponse<MusicTrack[]>;

/** GET /api/track/[id] */
export type TrackApiResponse = ApiResponse<MusicTrack>;

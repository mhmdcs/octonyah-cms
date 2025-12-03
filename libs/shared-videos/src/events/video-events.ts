export const VideoEventPattern = {
  VideoCreated: 'video.created',
  VideoUpdated: 'video.updated',
  VideoDeleted: 'video.deleted',
  ReindexRequested: 'video.reindex_requested',
} as const;

export type VideoEventName =
  (typeof VideoEventPattern)[keyof typeof VideoEventPattern];

export interface VideoEventMessage<TPayload = unknown> {
  readonly video: TPayload;
}


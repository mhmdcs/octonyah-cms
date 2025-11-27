export const ProgramEventPattern = {
  ProgramCreated: 'program.created',
  ProgramUpdated: 'program.updated',
  ProgramDeleted: 'program.deleted',
} as const;

export type ProgramEventName =
  (typeof ProgramEventPattern)[keyof typeof ProgramEventPattern];

export interface ProgramEventMessage<TPayload = unknown> {
  readonly program: TPayload;
}


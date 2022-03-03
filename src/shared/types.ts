export type CorruptionIndex = number | "*";

export type ServiceError = {
  status: number;
  message: string;
};

export type TargetIndex = number | "*";

export type M3U = {
  items: {
    PlaylistItem: any[];
    StreamItem: any[];
    IframeStreamItem: any[];
    MediaItem: any[];
  };
  properties: {};
  toString(): string;
  get(key: any): any;
  set(key: any, value: any): void;
  serialize(): any;
  unserialize(): any;
};

export type Manifest = string;

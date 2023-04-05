export type CorruptionIndex = number | '*';

export type ServiceError = {
  status: number;
  message: string;
};

export type TargetIndex = number | '*';

/**
 * Cherrypicking explicitly what we need to type from
 * https://github.com/Eyevinn/node-m3u8/blob/master/m3u/Item.js
 * This obviously needs to be addressed
 */

/* eslint-disable */
export type M3UItem = {
  get: (key: 'uri') => string | any;
  set: (key: 'uri', value: string) => void;
};

export type M3U = {
  items: {
    PlaylistItem: M3UItem[];
    StreamItem: M3UItem[];
    IframeStreamItem: M3UItem[];
    MediaItem: M3UItem[];
  };
  properties: {};
  toString(): string;
  get(key: any): any;
  set(key: any, value: any): void;
  serialize(): any;
  unserialize(): any;
};
/* eslint-enable */

export type Manifest = string;

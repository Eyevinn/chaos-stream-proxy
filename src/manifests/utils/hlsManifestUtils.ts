import { M3U, Manifest, ServiceError, TargetIndex } from '../../shared/types';
import { proxyPathBuilder, segmentUrlParamString } from '../../shared/utils';
import {
  CorruptorConfig,
  CorruptorConfigMap,
  IndexedCorruptorConfigMap
} from './configs';
import clone from 'clone';

interface HLSManifestUtils {
  mergeMap: (
    segmentListSize: number,
    configsMap: IndexedCorruptorConfigMap
  ) => CorruptorConfigMap[];
}

export interface HLSManifestTools {
  createProxyMediaManifest: (
    originalM3U: M3U,
    sourceBaseURL: string,
    mutations: any
  ) => Manifest; // look def again
  createProxyMasterManifest: (
    originalM3U: M3U,
    originalUrlQuery: URLSearchParams
  ) => Manifest;
  utils: HLSManifestUtils;
}

export default function (): HLSManifestTools {
  const utils = Object.assign({
    mergeMap(
      segmentListSize: number,
      configsMap: IndexedCorruptorConfigMap
    ): CorruptorConfigMap[] {
      const corruptions = [...new Array(segmentListSize)].map((_, i) => {
        const d = configsMap.get('*');
        if (!d) {
          return null;
        }
        const c: CorruptorConfigMap = new Map();
        for (let name of d.keys()) {
          const { fields } = d.get(name);
          c.set(name, { fields: { ...fields } });
        }

        return c;
      });

      // Populate any explicitly defined corruptions into the list
      for (let i = 0; i < corruptions.length; i++) {
        const configCorruptions = configsMap.get(i);

        if (configCorruptions) {
          // Map values always take precedence
          for (let name of configCorruptions.keys()) {
            if (!corruptions[i]) {
              corruptions[i] = new Map();
            }

            // If fields isn't set, it means it's a skip if *, otherwise no-op
            if (!configCorruptions.get(name).fields) {
              corruptions[i].delete(name);
              continue;
            }

            corruptions[i].set(name, configCorruptions.get(name));
          }
        }

        // If we nooped anything, let's make sure it's null
        if (!corruptions[i]?.size) {
          corruptions[i] = null;
        }
      }

      return corruptions;
    }
  });

  return Object.assign({
    utils,
    createProxyMasterManifest(
      originalM3U: M3U,
      originalUrlQuery: URLSearchParams
    ) {
      const m3u: M3U = clone(originalM3U);

      // [Video]
      m3u.items.StreamItem = m3u.items.StreamItem.map((streamItem) => {
        const bitRate = (streamItem as any)?.attributes?.attributes?.bandwidth;
        const currentUri = streamItem.get('uri');
        // Clone params to avoid mutating input argument
        const urlQuery = new URLSearchParams(originalUrlQuery);
        if (bitRate) {
          urlQuery.set('bitrate', bitRate);
        }
        streamItem.set(
          'uri',
          proxyPathBuilder(currentUri, urlQuery, 'proxy-media.m3u8')
        );
        return streamItem;
      });

      // [Audio/Subtitles/IFrame]
      m3u.items.MediaItem = m3u.items.MediaItem.map((mediaItem) => {
        const currentUri = mediaItem.get('uri');
        mediaItem.set(
          'uri',
          proxyPathBuilder(currentUri, originalUrlQuery, 'proxy-media.m3u8')
        );
        return mediaItem;
      });

      return m3u.toString();

      //---------------------------------------------------------------
      // TODO: *Specialfall*, cover fall där StreamItem.get('uri')
      // är ett http://.... url, och inte en relativ
      //---------------------------------------------------------------
    },
    createProxyMediaManifest(
      originalM3U: M3U,
      sourceBaseURL: string,
      configsMap: IndexedCorruptorConfigMap
    ) {
      const that: HLSManifestTools = this;

      const m3u: M3U = clone(originalM3U);

      // configs for each index
      const corruptions = that.utils.mergeMap(
        m3u.items.PlaylistItem.length,
        configsMap
      );

      // Attach corruptions to manifest
      for (let i = 0; i < m3u.items.PlaylistItem.length; i++) {
        const item = m3u.items.PlaylistItem[i];
        const corruption = corruptions[i];
        let sourceSegURL: string = item.get('uri');
        if (!sourceSegURL.match(/^http/)) {
          sourceSegURL = `${sourceBaseURL}/${item.get('uri')}`;
        }

        if (!corruption) {
          item.set('uri', sourceSegURL);
          continue;
        }

        const params = segmentUrlParamString(sourceSegURL, corruption);
        item.set(
          'uri',
          proxyPathBuilder(
            item.get('uri'),
            new URLSearchParams(params),
            '../../segments/proxy-segment'
          )
        );
      }
      return m3u.toString();
    }
  });
}

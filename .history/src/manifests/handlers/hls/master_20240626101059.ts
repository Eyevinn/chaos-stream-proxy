import fetch from 'node-fetch';
import { ALBEvent } from 'aws-lambda';
import hlsManifestUtils from '../../utils/hlsManifestUtils';
import {
  isValidUrl,
  parseM3U8Text,
  refineALBEventQuery,
  generateErrorResponse,
  STATEFUL,
  newState
} from '../../../shared/utils';

// To be able to reuse the handlers for AWS lambda function - input should be ALBEvent
export default async function hlsMasterHandler(event: ALBEvent) {
  console.log('Handling HLS master manifest request...');
  const query = refineALBEventQuery(event.queryStringParameters);

  if (!query.url || !isValidUrl(query.url)) {
    return generateErrorResponse({
      status: 400,
      message: "Missing a valid 'url' query parameter"
    });
  }
  try {
    const originalMasterManifestResponse = await fetch(query.url);
    if (!originalMasterManifestResponse.ok) {
      return generateErrorResponse({
        status: originalMasterManifestResponse.status,
        message: 'Unsuccessful Source Manifest fetch'
      });
    }
    const originalResHeaders = {};
    originalMasterManifestResponse.headers.forEach(
      (value, key) => (originalResHeaders[key] = value)
    );


    const masterM3U = await parseM3U8Text(originalMasterManifestResponse);

    // How to handle if M3U is actually a Media and Not a Master...
    if (masterM3U.items.PlaylistItem.length > 0) {
      return generateErrorResponse({
        status: 400,
        message: 'Input HLS stream URL is not a Multivariant Playlist'
      });
    }

    const stateKey = STATEFUL
      ? newState({ initialSequenceNumber: undefined })
      : undefined;

    const reqQueryParams = new URLSearchParams(query);
    const manifestUtils = hlsManifestUtils();
    const proxyManifest = manifestUtils.createProxyMasterManifest(
      masterM3U,
      reqQueryParams,
      stateKey
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Origin'
      },
      body: proxyManifest
    };
  } catch (err) {
    // Unexpected errors
    return generateErrorResponse({
      status: 500,
      message: err.message ? err.message : err
    });
  }
}

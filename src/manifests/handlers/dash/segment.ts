import { ALBEvent, ALBResult } from 'aws-lambda';
import { ServiceError } from '../../../shared/types';
import {
  composeALBEvent,
  generateErrorResponse,
  isValidUrl,
  segmentUrlParamString
} from '../../../shared/utils';
import delaySCC from '../../utils/corruptions/delay';
import statusCodeSCC from '../../utils/corruptions/statusCode';
import timeoutSCC from '../../utils/corruptions/timeout';
import throttleSCC from '../../utils/corruptions/throttle';
import path from 'path';
import dashManifestUtils from '../../utils/dashManifestUtils';
import { corruptorConfigUtils } from '../../utils/configs';
import segmentHandler from '../../../segments/handlers/segment';

export default async function dashSegmentHandler(
  event: ALBEvent
): Promise<ALBResult> {
  /**
   * #1 - const originalUrl = req.body.query("url");
   * #2 - const originalManifest = await fetch(originalUrl);
   * #3 - build proxy version and response with the correct header
   */
  const { url } = event.queryStringParameters;

  if (!url || !isValidUrl(url)) {
    const errorRes: ServiceError = {
      status: 400,
      message: "Missing a valid 'url' query parameter"
    };
    return generateErrorResponse(errorRes);
  }

  try {
    const urlSearchParams = new URLSearchParams(event.queryStringParameters);
    const pathStem = path.basename(event.path).replace('.mp4', '');
    // Get the number part after "segment_"
    const [, reqSegmentIndexStr, representationIdStr, bitrateStr] =
      pathStem.split('_');
    // Build correct Source Segment url
    let segmentUrl = url.replace('$Number$', reqSegmentIndexStr);
    const reqSegmentIndexInt = parseInt(reqSegmentIndexStr);
    // Replace RepresentationID in url if present
    if (representationIdStr) {
      segmentUrl = segmentUrl.replace(
        '$RepresentationID$',
        representationIdStr
      );
    }
    if (bitrateStr) {
      urlSearchParams.set('bitrate', bitrateStr);
    }
    // Break down Corruption Objects
    // Send source URL with a corruption json (if it is appropriate) to segmentHandler...
    const configUtils = corruptorConfigUtils(urlSearchParams);
    configUtils
      .register(delaySCC)
      .register(statusCodeSCC)
      .register(timeoutSCC)
      .register(throttleSCC);
    const [error, allMutations] = configUtils.getAllManifestConfigs(
      reqSegmentIndexInt,
      true
    );
    if (error) {
      return generateErrorResponse(error);
    }
    const dashUtils = dashManifestUtils();
    const mergedMaps = dashUtils.utils.mergeMap(
      reqSegmentIndexInt,
      allMutations
    );
    const segUrl = new URL(segmentUrl);
    const cleanSegUrl = segUrl.origin + segUrl.pathname;
    let eventParamsString: string;
    if (mergedMaps.size < 1) {
      eventParamsString = `url=${cleanSegUrl}`;
    } else {
      eventParamsString = segmentUrlParamString(cleanSegUrl, mergedMaps);
    }
    const albEvent = await composeALBEvent(
      event.httpMethod,
      `${event.path}?${eventParamsString}`,
      event.headers
    );
    return await segmentHandler(albEvent);
  } catch (err) {
    const errorRes: ServiceError = {
      status: 500,
      message: err.message ? err.message : err
    };
    //for unexpected errors
    return generateErrorResponse(errorRes);
  }
}

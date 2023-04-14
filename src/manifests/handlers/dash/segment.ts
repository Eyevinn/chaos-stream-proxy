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
   * #3 - bygg proxy versionen och bygg responsen med rätt header
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
    const [, reqSegmentIndexStr] = pathStem.split('_');
    // Build correct Source Segment url
    const segmentUrl = url.replace('$Number$', reqSegmentIndexStr);
    const reqSegmentIndexInt = parseInt(reqSegmentIndexStr);
    // Break down Corruption Objects
    // Send source URL with a corruption json (if it is appropriate) to segmentHandler...
    const configUtils = corruptorConfigUtils(urlSearchParams);
    configUtils.register(delaySCC).register(statusCodeSCC).register(timeoutSCC);
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
    const cleanSegUrl = segUrl.origin + segUrl.pathname + segUrl.search;
    let eventParamsString: string;
    if (mergedMaps.size < 1) {
      eventParamsString = `url=${cleanSegUrl}`;
    } else {
      eventParamsString = segmentUrlParamString(cleanSegUrl, mergedMaps);
    }
    const value = composeALBEvent(
      event.httpMethod,
      `${event.path}?${eventParamsString}`,
      event.headers
    )
    return await segmentHandler(value);
  } catch (err) {
    const errorRes: ServiceError = {
      status: 500,
      message: err.message ? err.message : err
    };
    //för oväntade fel
    return generateErrorResponse(errorRes);
  }
}

import { FastifyReply, FastifyRequest } from "fastify";
import fetch, { Response } from "node-fetch";
import { ServiceError } from "../../../shared/types";
import { isValidUrl, SERVICE_ORIGIN } from "../../../shared/utils";

export default async function dashHandler(req: FastifyRequest, res: FastifyReply) {
  /**
   * #1 - const originalUrl = req.body.query("url");
   * #2 - const originalManifest = await fetch(originalUrl);
   * #3 - bygg proxy versionen och bygg responsen med rätt header
   */
  if (!req.query["url"] || !isValidUrl(req.query["url"])) {
    const errorRes: ServiceError = {
      status: 400,
      message: "Missing a valid 'url' query parameter",
    };
    res.code(400).send(errorRes);
  }

  try {
    const originalDashManifestResponse = await fetch(req.query["url"]);
    if (!originalDashManifestResponse.ok) {
      const errorRes: ServiceError = {
        status: originalDashManifestResponse.status,
        message: "Unsuccessful Source Manifest fetch",
      };
      res.code(originalDashManifestResponse.status).send(errorRes);
      return;
    }
    const originalResHeaders = originalDashManifestResponse.headers;
    const reqQueryParams = new URL(SERVICE_ORIGIN + req.url).searchParams;

    // TODO: Fixa allt som behövs inför 'dashManifestHandlerUtils'

    const proxyManifest = "";

    res.code(200).headers(originalResHeaders).send(proxyManifest);
    return;
  } catch (err) {
    const errorRes: ServiceError = {
      status: 500,
      message: err.message ? err.message : err,
    };
    // temp: för oväntade fel
    res.code(500).send(errorRes);
  }
}

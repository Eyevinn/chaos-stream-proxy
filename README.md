# Chaos Stream Proxy (V1)

A server that acts as middle hand for manifest and segment requests, with the ability of adding corruptions to the manifest file, or messing with segment requests.

It parses the query parameters from the request and applies corruptions as specified.

Currently supported stream formats:

- HLS
- MPEG-DASH (MPD)

If you want to try it out, a demo version is available at `https://chaos-proxy.prod.eyevinn.technology`.

## Get Started

Requires `NodeJS` v14+ and `npm`

### For Development

`npm install` installs dependencies.

`npm run dev` starts the server on port `8000`.

Run on a custom port by setting the `PORT` environment variable.

To try it out, go to your favourite HLS/MPEG-DASH video player such as `https://web.player.eyevinn.technology/index.html` and paste the proxied URL. For example, if the source / original manifest is located at: `https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8` the proxied URL is `http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8`.

## API

| ENDPOINT                              | METHOD | DESCRIPTION                                                                                              |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `/api/v2/manifests/hls/proxy-master.m3u8`  | GET    | Returns a proxy Multivariant M3U8 file, based on query parameters                                        |
| `/api/v2/manifests/hls/proxy-media.m3u8`   | GET    | Returns a proxy Media M3U8 file, based on query parameters                                              |
| `/api/v2/manifests/dash/proxy-master.mpd`      | GET    | Returns a proxy MPD file, based on query parameters                                             |
| `/api/v2/manifests/dash/proxy-segment`      | GET    | Applies corruption present in query parameter and may return a 301 redirect to the original segment file |
| `/api/v2/segments/proxy-segment`           | GET    | Applies corruption present in query parameter and may return a 301 redirect to the original segment file |
| `/`                                        | GET    | Server health check                                                                                      |

### Query Parameters

| PARAMETER    | DESCRIPTION                                                                               |
| ------------ | ----------------------------------------------------------------------------------------- |
| `url`        | Url path to the original HLS/MPEG-DASH stream (REQUIRED)                                  |
| `delay`      | Delay the response, in milliseconds, for a specific segment request                       |
| `statusCode` | Replace the response for a specific segment request with a specified status code response |
| `timeout`    | Force a timeout for the response of a specific segment request                            |

## Corruptions

Currently, the Chaos Stream Proxy supports 3 types of corruptions for HLS and MPEG-DASH streams. These corruptions may be used in combination with one another.

### Specifying Corruption Configurations

To specify the configurations for a particular corruption, you will need to add a stringified JSON object as a query parameter to the proxied URL.
Each corruption has a unique configuration JSON object template. Each object can be used to target one specific segment for corruption.
e.i. `https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/hls/proxy-master.m3u8?url=<some_url>?some_corruption=[{i:0},{i:1},{i:2}, ... ,{i:N}]`

Across all coruptions, there are 2 ways to target a segment in a playlist for corruption.

1. `i`: The segment's list index in any Media Playlist, with HLS segments starting at 0 and MPEG-DASH segments starting at 1. For a Media Playlist with 12 segments, `i`=11, would target the last segment for HLS and `i`=12, would target the last segment for MPEG-DASH.
2. `sq`: The segment's Media Sequence Number (**HLS only**). For a Media Playlist with 12 segments, and where `#EXT-X-MEDIA-SEQUENCE` is 100, `sq`=111 would target the last segment. When corrupting a live HLS stream it is recommended to target with `sq`.

Below are configuration JSON object templates for the currently supported corruptions. A query should have its value be an array consisting of any one of these 3 types of items:

Delay Corruption:

```typescript
{
    i?: number | "*", // index of target segment in playlist. If "*", then target all segments. (Starts on 0 for HLS / 1 for MPEG-DASH)
    sq?: number | "*",// media sequence number of target segment in playlist. If "*", then target all segments
    ms?: number,      // time to delay in milliseconds
}
```

Status Code Corruption:

```typescript
{
    i?: number | "*", // index of target segment in playlist. If "*", then target all segments. (Starts on 0 for HLS / 1 for MPEG-DASH)
    sq? number | "*", // media sequence number of target segment in playlist. If "*", then target all segments
    code?: number,    // code to return in http response status header instead of media file
}
```

Timeout Corruption:

```typescript
{
    i?: number | "*", // index of target segment in playlist. If "*", then target all segments. (Starts on 0 for HLS / 1 for MPEG-DASH)
    sq?: number | "*",// media sequence number of target segment in playlist. If "*", then target all segments
}
```

One can either target a segment through the index parameter, `i`, or the sequence number parameter, `sq`. In the case where one has entered both, the **index parameter** will take precedence.

When targeting all segments through the input value of `"*"`, it is possible to **untarget** a specific segment by including a JSON item with only either `i` or `sq` in the corruption array, see example corruption #4.

### Example corruptions on HLS Streams:

1. VOD: With segment timeout on third segment:

```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&timeout=[{i:2}]
```

2. VOD: With segment delay of 3000ms on first and second segment:

```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:0,ms:3000},{i:1,ms:3000}]
```

3. VOD: With response of status code 404 on all segments:

```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&statusCode=[{i:*,code:404}]
```

4. VOD: With segment delay of 500ms on all segments (except for third and seventh segment):

```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:*,ms:500},{i:2},{i:6}]
```

5. VOD: With segment delay of 1500ms on fifth segment, response code 404 on sixth, and timeout on seventh:

```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:4,ms:1500}]&statusCode=[{i:5,code:404}]&timeout=[{i:9}]
```

6. VOD: With segment delay of 1500ms and response code 400 on sixth (response of 400 will be sent after 1500ms):

```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:5,ms:1500}]&statusCode=[{i:5,code:400}]
```

7. LIVE: With response of status code 404 on segment with sequence number 105:

```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/hls/proxy-master.m3u8?url=https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8&statusCode=[{sq:105,code:400}]
```

### Example corruptions on MPEG-DASH Streams
1. VOD: Example of MPEG-DASH with delay of 1500ms and response code 418 on second segment:
```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/dash/proxy-master.mpd?url=https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/64651f16da554640930b7ce2cd9f758b/66d211307b7d43d3bd515a3bfb654e1c/manifest.mpd&delay=[{i:2,ms:1500}]&statusCode=[{i:2,code:418}]
```

2. VOD: Example of MPEG-DASH with response code 404 on third segment:
```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/dash/proxy-master.mpd?url=https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/64651f16da554640930b7ce2cd9f758b/66d211307b7d43d3bd515a3bfb654e1c/manifest.mpd&statusCode=[{i:3,code:404}]
```

3. VOD: Example of MPEG-DASH with segment delay of 1500ms on all segments (except for first and second segment):
```
https://chaos-proxy.prod.eyevinn.technology/api/v2/manifests/dash/proxy-master.mpd?url=https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/64651f16da554640930b7ce2cd9f758b/66d211307b7d43d3bd515a3bfb654e1c/manifest.mpd&delay=[{i:*,ms:1500},{i:1},{i:2}]
```

## Development Environment

To deploy and update development environment create and push a tag with the suffix `-dev`, for example `my-feat-test-dev`. If you run `npm run deploy:dev` it will automatically create a tag based on git revision with the `-dev` suffix and push it.

## Production Environment

To deploy and update production environment publish a release on GitHub. This will trigger and initiate the workflow to build image and update the production cluster.

## Technology Stack

[NodeJS](https://nodejs.org/en/) and [Fastify](https://www.fastify.io/).

## GIT Ways of Working

In the interest of keeping a clean and easy to debug git history, use the following guidelines:

- Read [How to Write a Commit Message](https://chris.beams.io/posts/git-commit/).
- Follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/) specification (this differs a bit from the recommendations in the above link)
- A commit should contain a single change set
- A commit should pass tests, linting, and build

### Feature Branches

To start working on a feature, create a [feature branch](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow).

`git checkout -b your-name/the-feature`

Make a pull request when it is ready for review.

### Commitlint Hook

Commit messages are automatically linted via [husky](https://github.com/typicode/husky).

## Scripts

Check `package.json` for available scripts.

## License (Apache-2.0)

```
Copyright 2022 Eyevinn Technology AB

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here? Contact us at work@eyevinn.se!

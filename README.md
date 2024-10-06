<h1 align="center">
  Chaos Stream Proxy
</h1>

<div align="center">
  Chaos Stream Proxy - Introduce predictable and reproducable errors in a stream 
  <br />
  <br />
</div>

<div align="center">
<br />

[![github release](https://img.shields.io/github/v/release/Eyevinn/chaos-stream-proxy?style=flat-square)](https://github.com/Eyevinn/chaos-stream-proxy/releases)
[![license](https://img.shields.io/github/license/eyevinn/chaos-stream-proxy.svg?style=flat-square)](LICENSE)

[![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=flat-square)](https://github.com/eyevinn/chaos-stream-proxy/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
[![made with hearth by Eyevinn](https://img.shields.io/badge/made%20with%20%E2%99%A5%20by-Eyevinn-59cbe8.svg?style=flat-square)](https://github.com/eyevinn)
[![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

</div>

<div align="center">

[![Badge OSC](https://img.shields.io/badge/Evaluate-24243B?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8yODIxXzMxNjcyKSIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI3IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiLz4KPGRlZnM%2BCjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8yODIxXzMxNjcyIiB4MT0iMTIiIHkxPSIwIiB4Mj0iMTIiIHkyPSIyNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjQzE4M0ZGIi8%2BCjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzREQzlGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM%2BCjwvc3ZnPgo%3D)](https://app.osaas.io/browse/eyevinn-chaos-stream-proxy)

</div>


A server that acts as middle hand for manifest and segment requests, with the ability of adding corruptions to the manifest file, or messing with segment requests.

It parses the query parameters from the request and applies corruptions as specified.

Currently supported stream formats:

- HLS
- MPEG-DASH (MPD)

If you want to try it out you can sign up for an account at [Eyevinn Open Source Cloud](https://www.osaas.io).

## Get Started

Requires `NodeJS` v14+ and `npm`

### For Development

`npm install` installs dependencies.

`npm run dev` starts the server on port `8000`.

Run on a custom port by setting the `PORT` environment variable.

To try it out, go to your favourite HLS/MPEG-DASH video player such as `https://web.player.eyevinn.technology/index.html` and paste the proxied URL. For example, if the source / original manifest is located at: `https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8` the proxied URL is `http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8`.

## API

| ENDPOINT                                  | METHOD | DESCRIPTION                                                                                              |
| ----------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `/api/v2/manifests/hls/proxy-master.m3u8` | GET    | Returns a proxy Multivariant M3U8 file, based on query parameters                                        |
| `/api/v2/manifests/hls/proxy-media.m3u8`  | GET    | Returns a proxy Media M3U8 file, based on query parameters                                               |
| `/api/v2/manifests/dash/proxy-master.mpd` | GET    | Returns a proxy MPD file, based on query parameters                                                      |
| `/api/v2/manifests/dash/proxy-segment`    | GET    | Applies corruption present in query parameter and may return a 302 redirect to the original segment file |
| `/api/v2/segments/proxy-segment`          | GET    | Applies corruption present in query parameter and may return a 302 redirect to the original segment file |
| `/api/v2/throttle`                        | GET    | Proxies a http request, throttling the response to a specified byte rate                                 |
| `/`                                       | GET    | Server health check                                                                                      |

### Query Parameters

| PARAMETER    | DESCRIPTION                                                                               |
| ------------ | ----------------------------------------------------------------------------------------- |
| `url`        | Url path to the original HLS/MPEG-DASH stream (REQUIRED)                                  |
| `delay`      | Delay the response, in milliseconds, for a specific segment request                       |
| `statusCode` | Replace the response for a specific segment request with a specified status code response |
| `timeout`    | Force a timeout for the response of a specific segment request                            |
| `throttle`   | Send back the segment at a specified speed of bytes per second                            |

### Stateful Mode

By settings the `STATEFUL` env variable to `true`, stateful mode can be enabled, in this mode certain additional features are enabled at the cost of keeping some state in-memory. The state cache TTL ín seconds can be configured with the `TTL` env variable, default of 300 seconds.

Currently the only feature not available when running in stateless mode is relative sequence numbers on HLS livestreams.

### Load Manifest url params from AWS SSM parameter store instead

- Create a .env file at the root the of project
- fill it like this :

```
AWS_REGION="eu-central-1"
AWS_SSM_PARAM_KEY="/ChaosStreamProxy/Development/UrlParams"
LOAD_PARAMS_FROM_AWS_SSM=true
```

- on AWS SSM, create a parameter with name : <em>/ChaosStreamProxy/Development/UrlParams</em>
- add a value for corruptions, for example : <em>&statusCode=[{i:3,code:500},{i:4,code:500}]</em>

## Corruptions

Currently, the Chaos Stream Proxy supports 4 types of corruptions for HLS and MPEG-DASH streams. These corruptions may be used in combination with one another.

### Specifying Corruption Configurations

To specify the configurations for a particular corruption, you will need to add a stringified JSON object as a query parameter to the proxied URL.
Each corruption has a unique configuration JSON object template. Each object can be used to target one specific segment for corruption.
e.i. `https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=<some_url>&some_corruption=[{i:0},{i:1},{i:2}, ... ,{i:N}]`

Across all corruptions, there are 3 ways to target a segment in a playlist for corruption.

1. `i`: The segment's list index in any Media Playlist, with HLS segments starting at 0 and MPEG-DASH segments starting at 1. For a Media Playlist with 12 segments, `i`=11, would target the last segment for HLS and `i`=12, would target the last segment for MPEG-DASH.
2. `sq`: The segment's Media Sequence Number for HLS, or the "$Number$" or "$Time$" part of a segment URL for DASH. For an HLS Media Playlist with 12 segments, and where `#EXT-X-MEDIA-SEQUENCE` is 100, `sq`=111 would target the last segment. When corrupting a live HLS or DASH stream it is recommended to target with `rsq`.
3. `rsq`: A relative sequence number, counted from where the live stream is currently at when requesting manifest. Can also use a negative integer, which enables counting backwards from the end of the manifest instead. (**SUPPORTED ONLY IN STATEFUL MODE FOR BOTH HLS AND DASH**)

Below are configuration JSON object templates for the currently supported corruptions. A query should have its value be an array consisting of any one of these 3 types of items:

Delay Corruption:

```typescript
{
    i?: number | "*",  // index of target segment in playlist. If "*", then target all segments. (Starts on 0 for HLS / 1 for MPEG-DASH)
    l?: number | "*",  // index of ABR rung to delay media playlist. (Starts on 1 and only applicable to HLS)
    sq?: number | "*", // media sequence number of target segment in playlist. If "*", then target all segments
    rsq?: number,      // relative sequence number from where a livestream is currently at
    ms?: number,       // time to delay in milliseconds
    br?: number | number[] | "*", // apply only to specific or an array of specific bitrates
}
```

Status Code Corruption:

```typescript
{
    i?: number | "*",  // index of target segment in playlist. If "*", then target all segments. (Starts on 0 for HLS / 1 for MPEG-DASH)
    sq?: number | "*", // media sequence number of target segment in playlist. If "*", then target all segments
    rsq?: number,      // relative sequence number from where a livestream is currently at
    code?: number,     // code to return in http response status header instead of media file
    br?: number | number[] | "*", // apply only to specific or an array of specific bitrates
}
```

Timeout Corruption:

```typescript
{
    i?: number | "*",  // index of target segment in playlist. If "*", then target all segments. (Starts on 0 for HLS / 1 for MPEG-DASH)
    sq?: number | "*", // media sequence number of target segment in playlist. If "*", then target all segments
    rsq?: number,      // relative sequence number from where a livestream is currently at
    br?: number | number[] | "*", // apply only to specific or an array of specific bitrates
}
```

Throttle Corruption:

```typescript
{
    i?: number | "*",  // index of target segment in playlist. If "*", then target all segments. (Starts on 0 for HLS / 1 for MPEG-DASH)
    sq?: number | "*", // media sequence number of target segment in playlist. If "*", then target all segments
    rsq?: number,      // relative sequence number from where a livestream is currently at
    br?: number | number[] | "*", // apply only to specific or an array of specific bitrates
    rate?: number      // rate in bytes per second to limit the segment download speed to
}
```

One can either target a segment through the index parameter, `i`, or the sequence number parameter, `sq`, relative sequence numbers, `rsq`, are translated to sequence numbers, . In the case where one has entered both, the **index parameter** will take precedence.

Relative sequence numbers, `rsq`, are translated to sequence numbers, `sq`, and will thus override any provided `sq`.

When targeting all segments through the input value of `"*"`, it is possible to **untarget** a specific segment by including a JSON item with only either `i` or `sq` in the corruption array, see example corruption #4.

### Example corruptions on HLS Streams:

1. VOD: With segment timeout on third segment:

```
https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&timeout=[{i:2}]
```

2. VOD: With segment delay of 3000ms on first and second segment:

```
https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:0,ms:3000},{i:1,ms:3000}]
```

3. VOD: With response of status code 404 on all segments:

```
https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&statusCode=[{i:*,code:404}]
```

4. VOD: With segment delay of 500ms on all segments (except for third and seventh segment):

```
https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:*,ms:500},{i:2},{i:6}]
```

5. VOD: With segment delay of 1500ms on fifth segment, response code 404 on sixth, and timeout on seventh:

```
https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:4,ms:1500}]&statusCode=[{i:5,code:404}]&timeout=[{i:6}]
```

6. VOD: With segment delay of 1500ms on sixth segment, followed by a response code 400 if the bitrate is 2426000:

```
https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:5,ms:1500}]&statusCode=[{i:5,code:400,br:2426000}]

```
7. VOD: With segment delay of 1500ms on sixth segment, followed by a response code 400 if the bitrate is 1212000 OR 3131000:

```
https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:5,ms:1500}]&statusCode=[{i:5,code:400,br:[1212000,3131000]}]
```

8. LIVE: With response of status code 404 on segment with sequence number 105:

``` 
https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=https://demo.vc.eyevinn.technology/channels/demo/master.m3u8&statusCode=[{sq:105,code:400}]
```

9. LIVE: Delay response of media manifest ladder 1 and 2 with 500 ms

```
https://<chaos-proxy>/api/v2/manifests/hls/proxy-master.m3u8?url=https://demo.vc.eyevinn.technology/channels/demo/master.m3u8&delay=[{l:1,ms:500},{l:2,ms:500}]
```

### Example corruptions on MPEG-DASH Streams

MPEG-DASH, with individual segments, normally addresses them with a template with either `$Number$` or `$Time$` in the segment URLs.
Both these patterns are matched to the specified `sq` value.

1. VOD: Example of MPEG-DASH with delay of 1500ms and response code 418 on segment with `$Number$` equal to 2:

```
https://<chaos-proxy>/api/v2/manifests/dash/proxy-master.mpd?url=https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/64651f16da554640930b7ce2cd9f758b/66d211307b7d43d3bd515a3bfb654e1c/manifest.mpd&delay=[{i:2,ms:1500}]&statusCode=[{i:2,code:418}]
```

2. VOD: Example of MPEG-DASH with response code 404 on segment with `$Number$` equal to 3:

```
https://<chaos-proxy>/api/v2/manifests/dash/proxy-master.mpd?url=https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/64651f16da554640930b7ce2cd9f758b/66d211307b7d43d3bd515a3bfb654e1c/manifest.mpd&statusCode=[{i:3,code:404}]
```

3. VOD: Example of MPEG-DASH with segment delay of 1500ms on all segments (except for segments with `$Number$` equal to 1 or 2.):

```
https://<chaos-proxy>/api/v2/manifests/dash/proxy-master.mpd?url=https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/64651f16da554640930b7ce2cd9f758b/66d211307b7d43d3bd515a3bfb654e1c/manifest.mpd&delay=[{i:*,ms:1500},{i:1},{i:2}]
```

4. LIVE: Example of MPEG-DASH live stream with response of status code 404 on segment `$Number$` or `$Time$` equal to 3447425:

```
https://<chaos-proxy>/api/v2/manifests/dash/proxy-master.mpd?url=https://d2fz24s2fts31b.cloudfront.net/out/v1/3b6879c0836346c2a44c9b4b33520f4e/manifest.mpd&statusCode=[{sq:3447425, code:404}]
```

5. LIVE: Example of MPEG-DASH live stream with `$Time$` addressing with response of status code 404 on segment with `$Number$` or `$Time$` equal to 841164350:

```
https://<chaos-proxy>/api/v2/manifests/dash/proxy-master.mpd?url=https://livesim.dashif.org/livesim/testpic_2s/Manifest.mpd&statusCode=[{sq:841164350, code:404}]
```

6. LIVE: Example of MPEG-DASH with a segment download speed limited to 10kB/s on all segments

```
https://<chaos-proxy>/api/v2/manifests/dash/proxy-master.mpd?url=https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/64651f16da554640930b7ce2cd9f758b/66d211307b7d43d3bd515a3bfb654e1c/manifest.mpd&throttle=[{i:*,rate:10000}]
```

7. LIVE: Example of MPEG-DASH with a segment delay of 5000ms on segment with relative sequence number equal to 2:

```
https://<chaos-proxy>/api/v2/manifests/dash/proxy-master.mpd?url=https://livesim.dashif.org/livesim/testpic_2s/Manifest.mpd&delay=[{rsq:2, ms:5000}]
```
## Development Environment

To deploy and update development environment create and push a tag with the suffix `-dev`, for example `my-feat-test-dev`. If you run `npm run deploy:dev` it will automatically create a tag based on git revision with the `-dev` suffix and push it.

## Production Environment

To deploy and update production environment publish a release on GitHub. This will trigger and initiate the workflow to build image and update the production cluster.

## Technology Stack

[NodeJS](https://nodejs.org/en/) and [Fastify](https://www.fastify.io/).

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md) if you want to contribute to this project.

### Git way-of-working

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

## Commercial Options

The Chaos Stream Proxy is released as open source but we do offer some commercial options in relation to it. Contact sales@eyevinn.se if you are interested for pricing and more information.

### Hosting

We host the service in our environment for a monthly recurring fee. Included is business hours support on a best effort basis.

### Deployment

We help you deploy and integrate the service in your environment on a time-of-material basis.

### Feature Development

When you need a new feature developed and do not have the capacity or competence of your own to do it, we can on a time-of-material introduce this feature in the current code base and under the current open source license.

### Professional Services and Development

When you need help with building for example integration adaptors or other development in your code base related to this open source project we can offer a development team from us to help out on a time-of-material basis.

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

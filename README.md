# Chaos Stream Proxy (V1)

A server that acts as middle hand for manifest and segment requests, with the ability of adding corruptions to the manifest file, or messing with segment requests.

It parses the query parameters from the request and applies corruptions as specified.

Currently supported stream formats:

- HLS
- ~~MPEG-DASH~~ (Support In Progress)

## Get Started

Requires `NodeJS` v14+ and `npm`

### For Development

`npm install` installs dependencies.

`npm run dev` starts the server on port `8000`.

Run on a custom port by setting the `PORT` environment variable.

To try it out go to your favourite HLS video player such as `https://web.player.eyevinn.technology/index.html` and paste the proxied URL. For example if the source / original manifest is located at: `https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8` the proxied URL is `http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8`.

## API

| ENDPOINT                              | METHOD | DESCRIPTION                                                                                              |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `/api/v2/manifests/hls/proxy-master.m3u8`  | GET    | Returns a proxy Multivariant M3U8 file, based on query parameters                                        |
| `/api/v2/manifests/hls/proxy-media.m3u8`   | GET    | Returns a proxy Media M3U8 file, based on query parameters                                              |
| `/api/v2/manifests/dash/proxy-master`      | GET    | (WORK IN PROGRESS)                                                                                       |
| `/api/v2/segments/proxy-segment`           | GET    | Applies corruption present in query parameter and may return a 301 redirect to the original segment file |
| `/`                                        | GET    | Server health check                                                                                      |

### Query Parameters

| PARAMETER    | DESCRIPTION                                                                               |
| ------------ | ----------------------------------------------------------------------------------------- |
| `url`        | Url path to the original HLS stream (REQUIRED)                                            |
| `delay`      | Delay the response, in milliseconds, for a specific segment request                       |
| `statusCode` | Replace the response for a specific segment request with a specified status code response |
| `timeout`    | Force a timeout for the response of a specific segment request                            |

## Corruptions

Currently, the Stream Corruptor supports 3 types of corruptions for HLS streams. These corruptions may be used in combination of one another.

### Specifying Corruption Configurations (HLS)

To specify the configurations for a particular corruption, you will need to add a stringified JSON object as a query parameter to the proxied URL.
Each corruption has a unique configuration JSON object template. Each object can be used to target one specific segment for corruption.
e.i. `https://host.stream.corruptor/api/v2/manifests/hls/proxy-master.m3u8?url=<some_url>?some_corruption=[{i:0},{i:1},{i:2}, ... ,{i:N}]`

Across all coruptions, there are 2 ways to target a segment in a playlist for corruption.

1. `i`: The segments list index in any Media Playlist. For a Media Playlist with 12 segments, `i`=12, would target the last segment.
2. `sq`: The segments Media Sequence Number. For a Media Playlist with 12 segments, and where `#EXT-X-MEDIA-SEQUENCE` is 100, `sq`=112, would target the last segment. When corrupting a live stream it is reccomeneded to target with `sq`.

Below are configuration JSON object templates for the currently supported corruptions. A query should have its value be an array consisting any one of these 3 types of items:

Delay Corruption:

```typescript
{
    i?: number | "*", // index of target segment in playlist. If "*", then target all segments. (Starts on 0)
    sq?: number | "*",// media sequence number of target segment in playlist. If "*", then target all segments
    ms?: number,      // time to delay in milliseconds
}
```

Status Code Corruption:

```typescript
{
    i?: number | "*", // index of target segment in playlist. If "*", then target all segments. (Starts on 0)
    sq? number | "*", // media sequence number of target segment in playlist. If "*", then target all segments
    code?: number,    // code to return in http response status header instead of media file
}
```

Timeout Corruption:

```typescript
{
    i?: number | "*", // index of target segment in playlist. If "*", then target all segments. (Starts on 0)
    sq?: number | "*",// media sequence number of target segment in playlist. If "*", then target all segments
}
```

One can either target a segment through the index parameter, `i`, or the sequence number parameter, `sq`. In the case where one has entered both, the **index parameter** will take precedence.

When targeting all segments through the input value of `"*"`, it is possible to **untarget** a specific segment by including a JSON item with only either `i` or `sq` in the corruption array, see example corruption #4.

### Example corruptions on HLS Streams:

1. VOD: With segment timeout on third segment:

```
http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&timeout=[{i:2}]
```

2. VOD: With segment delay of 3000ms on first and second segment:

```
http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:0,ms:3000},{i:1,ms:3000}]
```

3. VOD: With response of status code 404 on all segments:

```
http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&statusCode=[{i:*,code:404}]
```

4. VOD: With segment delay of 500ms on all segments (except for third and seventh segment):

```
http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:*,ms:500},{i:2},{i:6}]
```

5. VOD: With segment delay of 1500ms on fifth segment, response code 404 on sixth, and timeout on seventh:

```
http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:4,ms:1500}]&statusCode=[{i:5,code:404}]&timeout=[{i:9}]
```

6. VOD: With segment delay of 1500ms and response code 400 on sixth (response of 400 will be sent after 1500ms):

```
http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8&delay=[{i:5,ms:1500}]&statusCode=[{i:5,code:400}]
```

7. LIVE: With response of status code 404 on segment with sequence number 105:

```
http://localhost:8000/api/v2/manifests/hls/proxy-master.m3u8?url=https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8&statusCode=[{sq:105,code:400}]
```

## Production

TBD

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

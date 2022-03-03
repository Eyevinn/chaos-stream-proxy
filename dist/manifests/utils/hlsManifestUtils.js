"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../shared/utils");
const clone_1 = __importDefault(require("clone"));
function default_1() {
    const utils = Object.assign({
        segmentUrlParamString(sourceSegURL, configMap) {
            let query = `url=${sourceSegURL}`;
            for (let name of configMap.keys()) {
                const fields = configMap.get(name).fields;
                const keys = Object.keys(fields);
                const corruptionInner = keys.map((key) => `${key}:${fields[key]}`).join(",");
                const values = corruptionInner ? `{${corruptionInner}}` : "";
                query += `&${name}=${values}`;
            }
            return query;
        },
        mergeMap(seglemtListSize, configsMap) {
            var _a;
            const corruptions = [...new Array(seglemtListSize)].map((_, i) => {
                const d = configsMap.get("*");
                if (!d) {
                    return null;
                }
                const c = new Map();
                for (let name of d.keys()) {
                    const { fields } = d.get(name);
                    c.set(name, { fields: Object.assign({}, fields) });
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
                if (!((_a = corruptions[i]) === null || _a === void 0 ? void 0 : _a.size)) {
                    corruptions[i] = null;
                }
            }
            return corruptions;
        },
    });
    return Object.assign({
        utils,
        createProxyMasterManifest(originalM3U, originalUrlQuery) {
            const m3u = clone_1.default(originalM3U);
            // [Video]
            m3u.items.StreamItem.forEach((streamItem) => utils_1.appendQueryParamsToItemURL(streamItem, originalUrlQuery, "proxy-media"));
            // [Audio/Subtitles/IFrame]
            m3u.items.MediaItem.forEach((mediaItem) => utils_1.appendQueryParamsToItemURL(mediaItem, originalUrlQuery, "proxy-media"));
            return m3u.toString();
            //---------------------------------------------------------------
            // TODO: *Specialfall*, cover fall där StreamItem.get('uri')
            // är ett http://.... url, och inte en relativ
            //---------------------------------------------------------------
        },
        createProxyMediaManifest(originalM3U, sourceBaseURL, configsMap) {
            const that = this;
            const m3u = clone_1.default(originalM3U);
            // configs for each index
            const corruptions = that.utils.mergeMap(m3u.items.PlaylistItem.length, configsMap);
            // Attach corruptions to manifest
            for (let i = 0; i < m3u.items.PlaylistItem.length; i++) {
                const item = m3u.items.PlaylistItem[i];
                const corruption = corruptions[i];
                const sourceSegURL = `${sourceBaseURL}/${item.get("uri")}`;
                if (!corruption) {
                    item.set("uri", sourceSegURL);
                    continue;
                }
                const params = that.utils.segmentUrlParamString(sourceSegURL, corruption);
                utils_1.appendQueryParamsToItemURL(item, new URLSearchParams(params), "../../segments/proxy-segment");
            }
            return m3u.toString();
        },
    });
}
exports.default = default_1;
//# sourceMappingURL=hlsManifestUtils.js.map
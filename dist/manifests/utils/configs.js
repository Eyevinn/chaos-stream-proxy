"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corruptorConfigUtils = void 0;
exports.corruptorConfigUtils = function (urlSearchParams) {
    return Object.assign({
        utils: {
            getJSONParseableString(value) {
                return decodeURIComponent(value)
                    .replace(/\s/g, "")
                    .replace(/({|,)(?:\s*)(?:')?([A-Za-z_$\.][A-Za-z0-9_ \-\.$]*)(?:')?(?:\s*):/g, '$1"$2":')
                    .replace(/:\*/g, ':"*"');
            },
        },
        register(config) {
            if (!this.registered) {
                this.registered = [];
            }
            if (config.name) {
                this.registered.push(config);
            }
            return this;
        },
        getAllManifestConfigs(sourceMseq) {
            const mseq = sourceMseq || 0;
            const that = this;
            let outputMap = new Map();
            if (!this.registered) {
                return [null, outputMap];
            }
            for (let i = 0; i < this.registered.length; i++) {
                const config = this.registered[i];
                if (!urlSearchParams.get(config.name)) {
                    continue;
                }
                // JSONify and remove whitespace
                const parsedSearchParam = that.utils.getJSONParseableString(urlSearchParams.get(config.name));
                const [error, configList] = config.getManifestConfigs(parsedSearchParam);
                if (error) {
                    return [error, null];
                }
                configList.forEach((item) => {
                    if (!outputMap.get(item.i)) {
                        outputMap.set(item.i, new Map());
                    }
                    // Only if we haven't already added a corruption for current index, we add it.
                    if (!outputMap.get(item.i).get(config.name)) {
                        outputMap.get(item.i).set(config.name, item);
                    }
                    // Handle if 'sq' is used instead.
                    if (!outputMap.get(item.sq)) {
                        if (typeof item.sq === "number") {
                            const newIdx = item.sq - mseq;
                            outputMap.set(newIdx, new Map());
                            if (!outputMap.get(newIdx).get(config.name)) {
                                outputMap.get(newIdx).set(config.name, item);
                            }
                        }
                        else if (item.sq === "*") {
                            outputMap.set(item.sq, new Map());
                            if (!outputMap.get(item.sq).get(config.name)) {
                                outputMap.get(item.sq).set(config.name, item);
                            }
                        }
                    }
                });
            }
            return [null, outputMap];
        },
        getAllSegmentConfigs() {
            const outputMap = new Map();
            for (let i = 0; i < this.registered.length; i++) {
                const SCC = this.registered[i];
                const that = this;
                if (urlSearchParams.get(SCC.name) !== null) {
                    // To make all object key names double quoted and remove whitespace
                    const parsedSearchParam = that.utils.getJSONParseableString(urlSearchParams.get(SCC.name));
                    const [error, configResult] = SCC.getSegmentConfigs(parsedSearchParam); // should only contain 1 item this time
                    if (error) {
                        return [error, null];
                    }
                    outputMap.set(SCC.name, configResult);
                }
            }
            return [null, outputMap];
        },
    });
};
//# sourceMappingURL=configs.js.map
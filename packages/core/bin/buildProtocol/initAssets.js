"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAssetMap = void 0;
const tslib_1 = require("tslib");
const config_1 = require("../config");
/* This function is declared async, so that we can get assets from external api if reqd. */
const buildAssetMap = (chainId, provider, appConfig) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const assetRootMap = new Map();
    // const cacheKey = `assets_${chainId}`;
    // const cachedValues = appConfig.browserCaching ? JSON.parse(localStorage.getItem(cacheKey)!) : null;
    /* Select correct Asset map based on chainId */
    let assetInfoMap = chainId === 1 ? config_1.ASSETS_1 : chainId === 42161 ? config_1.ASSETS_42161 : config_1.ASSETS_42220;
    assetInfoMap.forEach((asset, key) => {
        /* build out the assetInfo > assetRoot (fill in default values etc.) */
        const id = key;
        /* get the wrapping/unwrapping addresses for the particular chainId */
        const wrapHandlerAddress = asset.wrapHandlerAddresses && asset.wrapHandlerAddresses.get(chainId);
        const unwrapHandlerAddress = asset.unwrapHandlerAddresses && asset.unwrapHandlerAddresses.get(chainId);
        /* check if an unwrapping handler is provided, if so, the token is considered to be a wrapped token */
        const isWrappedToken = !!unwrapHandlerAddress;
        /* check if a wrapping handler is provided, if so, wrapping is required */
        const wrappingRequired = !!wrapHandlerAddress;
        const assetRoot = Object.assign(Object.assign({ id }, asset), { isWrappedToken,
            unwrapHandlerAddress,
            wrappingRequired,
            wrapHandlerAddress, 
            /* Default setting of assetInfo fields if required */
            proxyId: asset.proxyId || id, displaySymbol: asset.displaySymbol || asset.symbol, hideToken: asset.hideToken || false });
        assetRootMap.set(key, assetRoot);
    });
    // Log the new assets in the cache
    const _blockNum = yield provider.getBlockNumber();
    if (appConfig.browserCaching && window) {
        // console.log( 'add in browser cahcing ')
        // setBrowserCachedValue(`${chainId}_series`, seriesList);
        // Set the 'last checked' block
        // setBrowserCachedValue(`${chainId}_lastSeriesUpdate`, _blockNum);
    }
    console.log(`Numo Engine ASSET data updated [Block: ${_blockNum}]`);
    return assetRootMap;
});
exports.buildAssetMap = buildAssetMap;
//# sourceMappingURL=initAssets.js.map
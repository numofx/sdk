"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSeriesMap = void 0;
const tslib_1 = require("tslib");
const contracts_1 = require("@numo-engine/contracts");
const appUtils_1 = require("../utils/appUtils");
const yieldUtils_1 = require("../utils/yieldUtils");
const buildSeriesMap = (cauldron, ladle, assetRootMap, provider, chainId, appConfig) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* Check for cached assets or start with empty array */
    const seriesList = (appConfig.browserCaching && (0, appUtils_1.getBrowserCachedValue)(`${chainId}_series`)) || [];
    /* Check the last time the assets were fetched */
    const lastSeriesUpdate = (appConfig.browserCaching && (0, appUtils_1.getBrowserCachedValue)(`${chainId}_lastSeriesUpdate`)) || 'earliest';
    /* get poolAdded events and series events at the same time */
    const seriesAddedFilter = cauldron.filters.SeriesAdded();
    const poolAddedfilter = ladle.filters.PoolAdded();
    /* Get the series from events - unless fetching historical EventLogs is suppressed */
    const [seriesAddedEvents, poolAddedEvents] = !appConfig.suppressEventLogQueries
        ? yield Promise.all([
            cauldron.queryFilter(seriesAddedFilter, lastSeriesUpdate, 'latest'),
            ladle.queryFilter(poolAddedfilter, lastSeriesUpdate, 'latest'),
        ])
        : [[], []];
    /* Create a array from the seriesAdded event data or hardcoded series data if available */
    const seriesAdded = seriesAddedEvents.map((evnt) => evnt);
    /* Create a map from the poolAdded event data or hardcoded pool data if available */
    const poolMap = new Map(poolAddedEvents.map((e) => e.args)); // event values);
    /* Add in any extra static series */
    try {
        yield Promise.all(seriesAdded
            .filter((_evnt) => !appConfig.ignoreSeries.includes(_evnt.args.seriesId)) // ignore if on the ignore list
            .map((_evnt) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const { seriesId: id, baseId, fyToken } = _evnt.args;
            const { maturity } = yield cauldron.series(id);
            const baseTokenAddress = assetRootMap.get(baseId).address;
            if (poolMap.has(id)) {
                // only add series if it has a pool
                const poolAddress = poolMap.get(id);
                const poolContract = contracts_1.Pool__factory.connect(poolAddress, provider);
                const fyTokenContract = contracts_1.FYToken__factory.connect(fyToken, provider);
                const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol, ts, g1, g2] = yield Promise.all([
                    fyTokenContract.name(),
                    fyTokenContract.symbol(),
                    fyTokenContract.version(),
                    fyTokenContract.decimals(),
                    poolContract.name(),
                    poolContract.version(),
                    poolContract.symbol(),
                    poolContract.ts(),
                    poolContract.g1(),
                    poolContract.g2(),
                    // poolContract.decimals(),
                ]);
                const newSeries = {
                    id,
                    baseId,
                    maturity,
                    name,
                    symbol,
                    version,
                    address: fyToken,
                    fyTokenAddress: fyToken,
                    decimals: decimals,
                    poolAddress,
                    poolVersion,
                    poolName,
                    poolSymbol,
                    baseTokenAddress,
                    ts,
                    g1,
                    g2,
                    createdBlock: _evnt.blockNumber,
                    createdTxHash: _evnt.transactionHash,
                    /* calc'd and display vals */
                    maturityDate: (0, yieldUtils_1.dateFromMaturity)(maturity).date,
                    displayName: (0, yieldUtils_1.dateFromMaturity)(maturity).display,
                    displayNameMobile: (0, yieldUtils_1.dateFromMaturity)(maturity).mobile, //`${nameFromMaturity(maturity, 'MMM yyyy')}`,
                };
                seriesList.push(newSeries);
            }
        })));
    }
    catch (e) {
        console.log('Error fetching series data: ', e);
        throw new Error();
    }
    /* create a map from the asset list */
    const seriesRootMap = new Map(seriesList.map((s) => [s.id, s]));
    // Log the new assets in the cache
    const _blockNum = yield provider.getBlockNumber();
    if (appConfig.browserCaching) {
        // setBrowserCachedValue(`${chainId}_series`, seriesList);
        // // Set the 'last checked' block
        // setBrowserCachedValue(`${chainId}_lastSeriesUpdate`, _blockNum);
    }
    console.log(`Yield Protocol SERIES data updated [Block: ${_blockNum}]`);
    return seriesRootMap;
});
exports.buildSeriesMap = buildSeriesMap;
//# sourceMappingURL=initSeries_old.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSeriesMap = void 0;
const tslib_1 = require("tslib");
const contracts_1 = require("@numo-engine/contracts");
const yieldUtils_1 = require("../utils/yieldUtils");
const config_1 = require("../config");
const buildSeriesMap = (cauldron, provider, chainId, appConfig) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* create a map from the asset list */
    // const seriesRootMap: Map<string, ISeriesRoot> = new Map(seriesList.map((s: any) => [s.id, s]));
    const seriesRootMap = new Map();
    /* Select correct Asset map based on chainId */
    let seriesInfoMap = chainId === 1 ? config_1.SERIES_1 : chainId === 42161 ? config_1.SERIES_42161 : config_1.SERIES_42220;
    yield Promise.all(Array.from(seriesInfoMap).map((x) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const id = x[0];
        const baseId = `${id.slice(0, 6)}00000000`;
        const fyTokenAddress = x[1].fyTokenAddress;
        const poolAddress = x[1].poolAddress;
        const poolContract = contracts_1.Pool__factory.connect(poolAddress, provider);
        const fyTokenContract = contracts_1.FYToken__factory.connect(fyTokenAddress, provider);
        // For Celo (42220) or chains without Cauldron, get maturity from fyToken
        // Otherwise use Cauldron for consistency with existing behavior
        const maturity = chainId === 42220
            ? yield fyTokenContract.maturity()
            : (yield cauldron.series(id)).maturity;
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
        ]);
        const newSeries = {
            id,
            baseId,
            maturity,
            name,
            symbol,
            version,
            address: fyTokenAddress,
            fyTokenAddress: fyTokenAddress,
            decimals,
            poolAddress,
            poolVersion,
            poolName,
            poolSymbol,
            ts,
            g1,
            g2,
            /* calc'd and display vals */
            maturityDate: (0, yieldUtils_1.dateFromMaturity)(maturity).date,
            displayName: (0, yieldUtils_1.dateFromMaturity)(maturity).display,
            displayNameMobile: (0, yieldUtils_1.dateFromMaturity)(maturity).mobile, //`${nameFromMaturity(maturity, 'MMM yyyy')}`,
        };
        seriesRootMap.set(id, newSeries);
    }))).catch((e) => console.log('Problems getting Series data. Check SERIES CONFIG.', e));
    // Log the new assets in the cache
    const _blockNum = yield provider.getBlockNumber();
    if (appConfig.browserCaching) {
        /**
         * If: the CACHE is empty then, get fetch asset data for chainId and cache it:
         * */
        const cacheKey = `series_${chainId}`;
        const cachedValues = JSON.parse(localStorage.getItem(cacheKey));
        /* cache results */
        // newSeriesList.length && localStorage.setItem(cacheKey, JSON.stringify(newSeriesList));
        // newSeriesList.length && console.log('Yield Protocol Series data retrieved successfully.');
        // setBrowserCachedValue(`${chainId}_series`, seriesList);
        // // Set the 'last checked' block
        // setBrowserCachedValue(`${chainId}_lastSeriesUpdate`, _blockNum);
    }
    console.log(`Numo Engine SERIES data updated [Block: ${_blockNum}]`);
    return seriesRootMap;
});
exports.buildSeriesMap = buildSeriesMap;
//# sourceMappingURL=initSeries.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStrategyMap = void 0;
const tslib_1 = require("tslib");
const contracts = tslib_1.__importStar(require("@numo-engine/contracts"));
const config_1 = require("../config");
const appUtils_1 = require("../utils/appUtils");
const buildStrategyMap = (provider, chainId, appConfig) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const _strategyAddresses = config_1.strategyAddresses.get(chainId);
    const strategyList = (appConfig.browserCaching && (0, appUtils_1.getBrowserCachedValue)(`${chainId}_strategies`)) || [];
    try {
        if (_strategyAddresses) {
            yield Promise.all(_strategyAddresses.map((strategyAddr) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                /* if the strategy is NOT already in the cache : */
                if (strategyList.findIndex((_s) => _s.address === strategyAddr) === -1) {
                    const Strategy = contracts.Strategy__factory.connect(strategyAddr, provider);
                    const [name, symbol, baseId, decimals, version] = yield Promise.all([
                        Strategy.name(),
                        Strategy.symbol(),
                        Strategy.baseId(),
                        Strategy.decimals(),
                        Strategy.version(),
                    ]);
                    const newStrategy = {
                        id: strategyAddr,
                        address: strategyAddr,
                        symbol,
                        name,
                        version,
                        baseId,
                        decimals,
                    };
                    // update state and cache
                    strategyList.push(newStrategy);
                }
            })));
        }
    }
    catch (e) {
        console.log('Error fetching strategy data: ', e);
    }
    /* create a map from the list */
    const strategyRootMap = new Map(strategyList.map((s) => [s.id, s]));
    // Log the new assets in the cache
    const _blockNum = yield provider.getBlockNumber();
    if (appConfig.browserCaching) {
        (0, appUtils_1.setBrowserCachedValue)(`${chainId}_strategies`, strategyList);
        // Set the 'last checked' block
        (0, appUtils_1.setBrowserCachedValue)(`${chainId}_lastStrategyUpdate`, _blockNum);
    }
    console.log(`Numo Engine STRATEGY data updated [Block: ${_blockNum}]`);
    // console.log(strategyRootMap);
    return strategyRootMap;
});
exports.buildStrategyMap = buildStrategyMap;
//# sourceMappingURL=initStrategies.js.map
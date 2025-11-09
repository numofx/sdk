"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProtocol = void 0;
const tslib_1 = require("tslib");
const contracts = tslib_1.__importStar(require("@numo-engine/contracts"));
const config_1 = require("../config");
const initOracles_1 = require("./initOracles");
const initModules_1 = require("./initModules");
const initAssets_1 = require("./initAssets");
const initSeries_1 = require("./initSeries");
const initStrategies_1 = require("./initStrategies");
const buildProtocol = (provider, chainId, appConfig) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* 1. build the base protocol components */
    const _baseAddresses = config_1.baseAddresses.get(chainId);
    const cauldron = contracts.Cauldron__factory.connect(_baseAddresses.Cauldron, provider);
    const ladle = contracts.Ladle__factory.connect(_baseAddresses.Ladle, provider);
    const witch = contracts.Witch__factory.connect(_baseAddresses.Witch, provider);
    /* 2. Build the oralceMap */
    const oracleMap = (0, initOracles_1.buildOracleMap)(provider, chainId);
    /* 3. Build the moduleMap */
    const moduleMap = (0, initModules_1.buildModuleMap)(provider, chainId);
    /* 4. Build the AssetRootMap - note : async */
    const assetRootMap = yield (0, initAssets_1.buildAssetMap)(chainId, provider, appConfig);
    /* 5. Build the seriesRootMAp - note : async */
    const seriesRootMap = yield (0, initSeries_1.buildSeriesMap)(cauldron, provider, chainId, appConfig);
    /* 6. Build the stategyRootMAp - note : async */
    const strategyRootMap = yield (0, initStrategies_1.buildStrategyMap)(provider, chainId, appConfig); // TODO this could be loaded at same time as seriesMap
    return {
        protocolVersion: process.env.NUMO_ENGINE_VERSION || '1.0.0',
        cauldron,
        ladle,
        witch,
        oracleMap,
        moduleMap,
        assetRootMap,
        seriesRootMap,
        strategyRootMap,
    };
});
exports.buildProtocol = buildProtocol;
//# sourceMappingURL=index.js.map
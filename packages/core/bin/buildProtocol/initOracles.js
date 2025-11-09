"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOracleMap = void 0;
const tslib_1 = require("tslib");
const contracts = tslib_1.__importStar(require("@numo-engine/contracts"));
const config_1 = require("../config");
const buildOracleMap = (provider, chainId) => {
    /** Get addresses of the oracle contracts */
    const _oracleAddresses = config_1.oracleAddresses.get(chainId);
    /** Inititiate contracts (and distribution as a map) */
    const oracleMap = new Map([]);
    /** Oracle Contracts For Ethereum Chains */
    if (chainId === 1) {
        // Oracles
        oracleMap.set('ChainlinkMultiOracle', contracts.ChainlinkMultiOracle__factory.connect(_oracleAddresses.ChainlinkMultiOracle, provider));
        oracleMap.set('CompositeMultiOracle', contracts.CompositeMultiOracle__factory.connect(_oracleAddresses.CompositeMultiOracle, provider));
        oracleMap.set('YearnVaultMultiOracle', contracts.YearnVaultMultiOracle__factory.connect(_oracleAddresses.YearnVaultMultiOracle, provider));
        oracleMap.set('NotionalMultiOracle', contracts.NotionalMultiOracle__factory.connect(_oracleAddresses.NotionalMultiOracle, provider));
        // Rate Oracle
        oracleMap.set('RateOracle', contracts.CompoundMultiOracle__factory.connect(_oracleAddresses.CompoundMultiOracle, provider));
    }
    /** Oracles For Arbitrum Chains */
    if (chainId === 42161) {
        // Oracles
        const AccumulatorOracle = contracts.AccumulatorOracle__factory.connect(_oracleAddresses.AccumulatorOracle, provider);
        oracleMap.set('AccumulatorOracle', AccumulatorOracle);
        oracleMap.set('ChainlinkUSDOracle', contracts.ChainlinkUSDOracle__factory.connect(_oracleAddresses.ChainlinkUSDOracle, provider));
        // Rate Oracle
        oracleMap.set('RateOracle', AccumulatorOracle);
    }
    return oracleMap;
};
exports.buildOracleMap = buildOracleMap;
//# sourceMappingURL=initOracles.js.map
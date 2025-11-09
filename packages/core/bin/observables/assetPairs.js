"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePair = exports.assetPairsø = void 0;
const tslib_1 = require("tslib");
const math_1 = require("@numo-engine/math");
const ethers_1 = require("ethers");
const rxjs_1 = require("rxjs");
const config_1 = require("../config");
const utils_1 = require("../utils");
const protocol_1 = require("./protocol");
const selected_1 = require("./selected");
const yieldUtils_1 = require("../utils/yieldUtils");
const connection_1 = require("./connection");
const assetPairMap$ = new rxjs_1.BehaviorSubject(new Map([]));
exports.assetPairsø = assetPairMap$.pipe((0, rxjs_1.shareReplay)(1));
/**
 *
 * Watch selected elements, on every change if both a base and ilk are selected,
 * and they don't already exist in the assetPairMap, update them.
 *
 * */
selected_1.selectedø
    .pipe((0, rxjs_1.withLatestFrom)(connection_1.chainIdø), 
/* Only handle events that have both a selected base and ilk, and are NOT already in the assetPairMap */
(0, rxjs_1.filter)(([sel]) => {
    const bothBaseAndIlkSelected = !!sel.base && !!sel.ilk;
    const mapHasPair = sel.base && sel.ilk && assetPairMap$.value.has((0, yieldUtils_1.getAssetPairId)(sel.base.id, sel.ilk.id));
    // mapHasPair && console.log ( 'Selected base and asset already in map');
    return bothBaseAndIlkSelected === true && mapHasPair === false;
}), (0, rxjs_1.map)(([selected, chainId]) => {
    return { base: selected.base, ilk: selected.ilk, chainId };
}))
    .subscribe(({ base, ilk, chainId }) => (0, exports.updatePair)(base === null || base === void 0 ? void 0 : base.id, ilk === null || ilk === void 0 ? void 0 : ilk.id, chainId));
/* Update Assets function */
const updatePair = (baseId, ilkId, chainId) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const protocol = yield (0, rxjs_1.lastValueFrom)(protocol_1.protocolø.pipe((0, rxjs_1.first)()));
    const { cauldron, assetRootMap, oracleMap } = protocol;
    const oracleName = (_b = (_a = config_1.ORACLE_INFO.get(chainId)) === null || _a === void 0 ? void 0 : _a.get(baseId)) === null || _b === void 0 ? void 0 : _b.get(ilkId);
    const PriceOracle = oracleMap.get(oracleName);
    const base = assetRootMap.get(baseId);
    const ilk = assetRootMap.get(ilkId);
    // console.log('Fetching Asset Pair Info: ', bytesToBytes32(baseId, 6), bytesToBytes32(ilkId, 6));
    /* if all the parts are there update the pairInfo */
    if (cauldron && PriceOracle && base && ilk) {
        // updateState({ type: PriceState.START_PAIR_FETCH, payload: pairId });
        const pairId = (0, yieldUtils_1.getAssetPairId)(base.id, ilk.id);
        // /* Get debt params and spot ratios */
        const [{ max, min, sum, dec }, { ratio }] = yield Promise.all([
            cauldron.debt(baseId, ilkId),
            cauldron.spotOracles(baseId, ilkId),
        ]);
        /* Get pricing if available */
        let price;
        try {
            // eslint-disable-next-line prefer-const
            [price] = yield PriceOracle.peek((0, math_1.bytesToBytes32)(ilkId, 6), (0, math_1.bytesToBytes32)(baseId, 6), (0, math_1.decimal18ToDecimalN)(utils_1.WAD_BN, ilk.decimals));
        }
        catch (error) {
            price = ethers_1.ethers.constants.Zero;
        }
        const minDebtLimit_ = ethers_1.BigNumber.from(min).mul(ethers_1.BigNumber.from('10').pow(dec));
        const maxDebtLimit_ = max.mul(ethers_1.BigNumber.from('10').pow(dec));
        const newPair = {
            id: pairId,
            baseId,
            ilkId,
            limitDecimals: dec,
            minDebtLimit: (0, yieldUtils_1.bnToW3bNumber)(minDebtLimit_, base.decimals, base.digitFormat),
            maxDebtLimit: (0, yieldUtils_1.bnToW3bNumber)(maxDebtLimit_, base.decimals, base.digitFormat),
            pairTotalDebt: (0, yieldUtils_1.bnToW3bNumber)(sum, base.decimals, base.digitFormat),
            pairPrice: (0, yieldUtils_1.bnToW3bNumber)(price, base.decimals, base.digitFormat),
            minRatio: parseFloat(ethers_1.ethers.utils.formatUnits(ratio, 6)),
            baseDecimals: base.decimals,
            ilkDecimals: ilk.decimals,
            oracle: oracleName || '',
        };
        /* update the assetPairMap */
        assetPairMap$.next(assetPairMap$.value.set(pairId, newPair));
        // console.log('New Asset Pair Info: ', newPair);
        /* return the new pair so we don't have to go looking for it again after assetpairMap has been updated */
        return newPair;
    }
    /* if no cauldron, base or ilk, or priceOracle return null */
    return null;
});
exports.updatePair = updatePair;
//# sourceMappingURL=assetPairs.js.map
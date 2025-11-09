"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maximumRollø = exports.minimumRepayø = exports.maximumRepayø = exports.debtEstimateø = exports.debtAfterRepayø = exports.isRepayLimitedø = exports.isRollVaultPossibleø = exports.isBorrowLimitedø = exports.isBorrowPossibleø = exports.minDebtLimitø = exports.maxDebtLimitø = void 0;
const math_1 = require("@numo-engine/math");
const rxjs_1 = require("rxjs");
const observables_1 = require("../observables");
const messages_1 = require("../observables/messages");
const utils_1 = require("../utils");
const constants_1 = require("../utils/constants");
const yieldUtils_1 = require("../utils/yieldUtils");
const input_1 = require("./input");
/**
 * Maximum amount of debt allowed by the protocol for a particular [[IAssetPair | Asset Pair]]
 * @category Borrow
 * */
exports.maxDebtLimitø = (0, rxjs_1.combineLatest)([observables_1.selectedø, observables_1.assetPairsø]).pipe(
/* only proceed if pairMap has the reqd info */
(0, rxjs_1.filter)(([selected, pairMap]) => pairMap.has((0, yieldUtils_1.getAssetPairId)(selected.base.id, selected.ilk.id))), 
/* return the max debt of the asset pair */
(0, rxjs_1.map)(([selected, pairMap]) => {
    const assetPair = selected.base && selected.ilk && pairMap.get((0, yieldUtils_1.getAssetPairId)(selected.base.id, selected.ilk.id));
    console.log('Max: ', assetPair === null || assetPair === void 0 ? void 0 : assetPair.maxDebtLimit.toString());
    return (assetPair === null || assetPair === void 0 ? void 0 : assetPair.maxDebtLimit) || constants_1.ZERO_W3B;
}));
/**
 * Minimum amount of debt allowed by the protocol ( Dust level ) for a particular [[IAssetPair | Asset Pair]]
 * @category Borrow
 * */
exports.minDebtLimitø = (0, rxjs_1.combineLatest)([observables_1.selectedø, observables_1.assetPairsø]).pipe(
/* only let events proceed if pairMap has the reqd info */
(0, rxjs_1.filter)(([selected, pairMap]) => pairMap.has((0, yieldUtils_1.getAssetPairId)(selected.base.id, selected.ilk.id))), 
/* return the min required debt of the asset pair */
(0, rxjs_1.map)(([selected, pairMap]) => {
    const assetPair = selected.base && selected.ilk && pairMap.get((0, yieldUtils_1.getAssetPairId)(selected.base.id, selected.ilk.id));
    console.log('Min: ', assetPair === null || assetPair === void 0 ? void 0 : assetPair.minDebtLimit.toString());
    return (assetPair === null || assetPair === void 0 ? void 0 : assetPair.minDebtLimit) || constants_1.ZERO_W3B;
}));
/**
 * Check if the user can borrow the specified [[borrowInputø | amount]] based on current protocol sharesReserves
 * @category Borrow
 * */
exports.isBorrowPossibleø = (0, rxjs_1.combineLatest)([input_1.borrowInputø, observables_1.selectedø]).pipe((0, rxjs_1.map)(([input, selected]) => {
    if (selected.series && input.big.gt(utils_1.ZERO_BN) && input.big.lte(selected.series.sharesReserves.big))
        return true;
    input.big.gt(utils_1.ZERO_BN) &&
        (0, messages_1.sendMsg)({
            message: 'Not enough liquidity in the pool.',
            type: messages_1.MessageType.WARNING,
            origin: 'borrowInput',
        });
    return false;
}));
/**
 *  TODO:  Check if the particular borrow [[borrowInputø | amount]] is limited by the liquidity in the protocol
 * @category Borrow
 * */
exports.isBorrowLimitedø = (0, rxjs_1.combineLatest)([input_1.borrowInputø, observables_1.selectedø]).pipe((0, rxjs_1.map)(([input, selected]) => {
    console.log(input, selected);
    return false;
}));
/**
 * Check if the user can roll the selected vault to a new [future] series
 * @category Borrow | Roll
 * */
exports.isRollVaultPossibleø = (0, rxjs_1.combineLatest)([observables_1.selectedø, observables_1.assetPairsø]).pipe(
/* only let events proceed if futureSeries and vault, and has a validasset pair has the reqd info */
(0, rxjs_1.filter)(([selected, assetPairMap]) => {
    const { vault, futureSeries } = selected;
    /* check if everythign required exists */
    return !!vault && !!futureSeries && assetPairMap.has((0, yieldUtils_1.getAssetPairId)(vault.baseId, vault.ilkId));
}), (0, rxjs_1.map)(([selected, assetPairMap]) => {
    /* Note: Because of the filter above we can safetly assume futureSeries & vault and pairinfo are defined. (!) */
    const { futureSeries, vault } = selected;
    const pairInfo = assetPairMap.get((0, yieldUtils_1.getAssetPairId)(vault.baseId, vault.ilkId));
    /*  IF there is ZERO DEBT the vault is always rollable  > so shortcut out this function */
    if (vault.accruedArt.big.eq(utils_1.ZERO_BN))
        return true;
    const _maxFyTokenIn = (0, math_1.maxFyTokenIn)(futureSeries.sharesReserves.big, futureSeries.fyTokenReserves.big, futureSeries.getTimeTillMaturity(), futureSeries.ts, futureSeries.g2, futureSeries.decimals);
    const newDebt = (0, math_1.buyBase)(futureSeries.sharesReserves.big, futureSeries.fyTokenReserves.big, vault.accruedArt.big, futureSeries.getTimeTillMaturity(), futureSeries.ts, futureSeries.g2, futureSeries.decimals);
    const _minCollat = (0, math_1.calculateMinCollateral)(pairInfo.pairPrice.big, newDebt, pairInfo.minRatio.toString(), undefined);
    // conditions for allowing rolling
    const areRollConditionsMet = vault.accruedArt.big.lt(_maxFyTokenIn) &&
        (0, math_1.decimalNToDecimal18)(vault.ink.big, vault.ilkDecimals).gt(_minCollat) &&
        vault.accruedArt.big.gt(pairInfo.minDebtLimit.big);
    return areRollConditionsMet;
}));
/**  TODO:
 *
 * Check if the particular repay [input] is limited by the liquidity in the protocol
 * @category Borrow | Repay
 *  */
exports.isRepayLimitedø = (0, rxjs_1.combineLatest)([input_1.repayInputø, observables_1.selectedø]).pipe((0, rxjs_1.map)(([input, selected]) => {
    console.log(input, selected);
    return false;
}));
/**
 * Calculate how much debt will be remaining after successful repayment of [input]
 * @category Borrow | Repay
 */
exports.debtAfterRepayø = (0, rxjs_1.combineLatest)([input_1.repayInputø, observables_1.selectedø]).pipe((0, rxjs_1.map)(([input, { vault }]) => {
    if (vault.accruedArt.big.sub(input.big).gte(utils_1.ZERO_BN)) {
        const x_ = vault.accruedArt.big.sub(input.big);
        return (0, yieldUtils_1.bnToW3bNumber)(x_, vault === null || vault === void 0 ? void 0 : vault.baseDecimals);
    }
    return constants_1.ZERO_W3B;
}));
/**
 * Calculate the expected NEW debt @ maturity ( any exisiting debt + new debt )  previously 'borrowEstimate'
 * @category Borrow
 * */
exports.debtEstimateø = (0, rxjs_1.combineLatest)([input_1.borrowInputø, observables_1.selectedø]).pipe(
// simple filter out input changes that are zero, and make sure there is a series selected.
(0, rxjs_1.filter)(([borrowInput, selected]) => borrowInput.big.gt(utils_1.ZERO_BN) && !!selected.series), (0, rxjs_1.map)(([input, selected]) => {
    const { series, vault } = selected;
    const estimate = (0, math_1.buyBase)(series.sharesReserves.big, series.fyTokenReserves.big, input.big, series.getTimeTillMaturity(), series.ts, series.g1, series.decimals);
    const artPlusEstimate = vault && vault.accruedArt.big.gt(utils_1.ZERO_BN) ? vault.accruedArt.big.add(estimate) : estimate;
    return (0, yieldUtils_1.bnToW3bNumber)(artPlusEstimate, vault === null || vault === void 0 ? void 0 : vault.baseDecimals);
}));
/**
 * Maximum amount that can be repayed (limited by: either the max tokens owned OR max debt available )
 * @category Borrow | Repay
 * */
exports.maximumRepayø = (0, rxjs_1.combineLatest)([observables_1.selectedø]).pipe((0, rxjs_1.map)(([selected]) => {
    var _a, _b, _c;
    if (((_a = selected.base) === null || _a === void 0 ? void 0 : _a.balance) && ((_b = selected.vault) === null || _b === void 0 ? void 0 : _b.accruedArt.big.gt(selected.base.balance.big))) {
        (0, messages_1.sendMsg)({
            message: `The max repayment amount is limited by the accounts ${(_c = selected.base) === null || _c === void 0 ? void 0 : _c.symbol} token balance.`,
            type: messages_1.MessageType.WARNING,
        });
        return selected.base.balance;
    }
    else {
        (0, messages_1.sendMsg)({ message: 'All debt can be repaid.', type: messages_1.MessageType.INFO });
        return selected.vault.accruedArt;
    }
}));
/**
 * Min amount that can be repayed (limited by assetPair dustlevels/minDebt )
 * @category Borrow | Repay
 * */
exports.minimumRepayø = (0, rxjs_1.combineLatest)([observables_1.selectedø, exports.minDebtLimitø, exports.maximumRepayø]).pipe((0, rxjs_1.map)(([selected, minLimit, maxRepay]) => {
    const { vault } = selected;
    /* Set the min repayable, as the maximum value that can be paid without going below the dust limit */
    const min = vault.accruedArt.big.gt(minLimit.big) ? maxRepay.big.sub(minLimit.big) : vault === null || vault === void 0 ? void 0 : vault.accruedArt.big;
    return (0, yieldUtils_1.bnToW3bNumber)(min || utils_1.ZERO_BN, vault === null || vault === void 0 ? void 0 : vault.baseDecimals);
}));
/** TODO:  Maximum amount that can be rolled  ( NOTE : Not NB for now because we are only rolling entire [vaults] )
 * @category Borrow | Repay
 */
exports.maximumRollø = observables_1.selectedø.pipe(
/* only do calcs if there is a future series selected */
(0, rxjs_1.map)(() => {
    /* The maximum amount rollable is the maxfyTokenIn or art (if art is less than the max FyToken In  )  */
    // const maxRoll =  vault!.accruedArt.lt(_maxFyTokenIn) ? vault!.accruedArt : _maxFyTokenIn;
    return constants_1.ZERO_W3B;
}));
//# sourceMappingURL=borrowView.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimatedLiquidatePriceø = exports.vaultLiquidatePriceø = exports.maxRemovableCollateralø = exports.maxCollateralø = exports.minimumSafePercentø = exports.minimumSafeRatioø = exports.minCollateralRequiredø = exports.isUnhealthyCollateralizationø = exports.isUndercollateralizedø = exports.minCollateralizationPercentø = exports.minCollateralizationRatioø = exports.collateralizationPercentø = exports.collateralizationRatioø = void 0;
const math_1 = require("@numo-engine/math");
const rxjs_1 = require("rxjs");
const observables_1 = require("../observables");
const utils_1 = require("../utils");
const yieldUtils_1 = require("../utils/yieldUtils");
const assetPairs_1 = require("../observables/assetPairs");
const input_1 = require("./input");
const appConfig_1 = require("../observables/appConfig");
const constants_1 = require("../utils/constants");
/**
 * INTERNAL:
 * Keeps the track of the current selectedPair
 * */
const _selectedPairø = (0, rxjs_1.combineLatest)([observables_1.selectedø, assetPairs_1.assetPairsø]).pipe((0, rxjs_1.map)(([selected, pairMap]) => {
    if (!!selected.ilk && !!selected.base) {
        const _pairId = (0, yieldUtils_1.getAssetPairId)(selected.base.id, selected.ilk.id);
        return pairMap.get(_pairId);
    }
    return undefined;
}), (0, rxjs_1.share)());
/**
 * INTERNAL:
 *
 * Tracks the total DEBT value based on input
 * returns decimal18 vals for math calcs
 *
 * RETURNS [ totalDebt, exisitingDebt ] in decimals18
 */
const _totalDebtWithInputø = (0, rxjs_1.combineLatest)([input_1.borrowInputø, observables_1.selectedø]).pipe((0, rxjs_1.filter)(([, { series }]) => !!series), (0, rxjs_1.distinctUntilChanged)(([a], [b]) => a === b), // this is a check so that the observable isn't 'doubled up' with the same input value.
(0, rxjs_1.withLatestFrom)(appConfig_1.appConfigø), (0, rxjs_1.map)(([[debtInput, selected], config]) => {
    const { vault, series } = selected; // we can safetly assume 'series' is defined - not vault.
    const existingDebt_ = (vault === null || vault === void 0 ? void 0 : vault.accruedArt.big) || utils_1.ZERO_BN;
    /* NB NOTE: this whole function ONLY deals with decimal18, existing values are converted to decimal18 */
    const existingDebtAsWei = (0, math_1.decimalNToDecimal18)(existingDebt_, series.decimals);
    const newDebt = debtInput.big.gt(utils_1.ZERO_BN)
        ? (0, math_1.buyBase)(series.sharesReserves.big, series.fyTokenReserves.big, debtInput.big, series.getTimeTillMaturity(), series.ts, series.g2, series.decimals)
        : utils_1.ZERO_BN;
    const newDebtAsWei = (0, math_1.decimalNToDecimal18)(newDebt, series.decimals);
    const totalDebt = existingDebtAsWei.add(newDebtAsWei);
    config.diagnostics && console.log('Total Debt (d18): ', totalDebt.toString());
    return [totalDebt, existingDebtAsWei]; // as decimal18
}), (0, rxjs_1.share)());
/**
 * INTERNAL:
 *
 * Return the total collateral value
 * NOTE: this function ONLY deals with decimal18, existing values are converted to decimal18
 *
 * returns decimal18 vals for math calcs
 *
 * RETURNS [ totalCollateral, exisitingCollateral] in decimals18 for comparative calcs
 */
const _totalCollateralWithInputø = (0, rxjs_1.combineLatest)([input_1.collateralInputø, observables_1.selectedø]).pipe((0, rxjs_1.filter)(([, { ilk }]) => !!ilk), (0, rxjs_1.distinctUntilChanged)(([a], [b]) => a === b), (0, rxjs_1.withLatestFrom)(appConfig_1.appConfigø), (0, rxjs_1.map)(([[collInput, selected], config]) => {
    const { vault, ilk } = selected;
    if (ilk) {
        const existingCollateral_ = (vault === null || vault === void 0 ? void 0 : vault.ink.big) || utils_1.ZERO_BN; // if no vault simply return zero.
        const existingCollateralAsWei = (0, math_1.decimalNToDecimal18)(existingCollateral_, ilk.decimals);
        /* TODO: there is a weird bug if inputting before selecting ilk. */
        const newCollateralAsWei = (0, math_1.decimalNToDecimal18)(collInput.big, ilk.decimals);
        const totalCollateral = existingCollateralAsWei.add(newCollateralAsWei);
        appConfig_1.appConfigø.subscribe(({ diagnostics }) => diagnostics && console.log('Total Collateral (d18): ', totalCollateral.toString()));
        return [totalCollateral, existingCollateralAsWei]; // as decimal18
    }
    config.diagnostics && console.warn('Hey fren. Make sure an Ilk is selected!');
    return [];
}), (0, rxjs_1.share)());
/**
 * The PREDICTED collateralization ratio based on the current INPUT expressed as a ratio
 * @category Borrow | Collateral
 * */
exports.collateralizationRatioø = (0, rxjs_1.combineLatest)([
    _totalDebtWithInputø,
    _totalCollateralWithInputø,
    _selectedPairø,
]).pipe(
// distinctUntilChanged( ([a1,a2],[b1, b2]) => a1===b1 && a2===b2 ),
(0, rxjs_1.withLatestFrom)(appConfig_1.appConfigø), (0, rxjs_1.map)(([[totalDebt, totalCollat, assetPair], config]) => {
    var _a, _b;
    if (
    /* if all the elements exist and are greater than 0 */
    ((_a = totalCollat[0]) === null || _a === void 0 ? void 0 : _a.gt(utils_1.ZERO_BN)) &&
        ((_b = totalDebt[0]) === null || _b === void 0 ? void 0 : _b.gt(utils_1.ZERO_BN)) &&
        !!assetPair) {
        /* NOTE: this function ONLY deals with decimal18, existing values are converted to decimal18 */
        const pairPriceInWei = (0, math_1.decimalNToDecimal18)(assetPair.pairPrice.big, assetPair.baseDecimals);
        const ratio = (0, math_1.calculateCollateralizationRatio)(totalCollat[0], pairPriceInWei, totalDebt[0], false);
        config.diagnostics && console.log('Collateralisation ratio:', ratio);
        return ratio;
    }
    return undefined;
}), (0, rxjs_1.share)());
/**
 * The PREDICTED collateralization based on the current INPUT parameters expressed as a PERCENTAGE
 * ( for display )
 * @category Borrow | Collateral
 * */
exports.collateralizationPercentø = exports.collateralizationRatioø.pipe((0, rxjs_1.map)((ratio) => (0, yieldUtils_1.ratioToPercent)(ratio, 2)), (0, rxjs_1.share)());
/**
 * The minimum protocol allowed collaterallisation level expressed as a ratio
 * @category Borrow | Collateral
 * */
exports.minCollateralizationRatioø = _selectedPairø.pipe(
/* Only emit if assetPair exists */
(0, rxjs_1.filter)((assetPair) => !!assetPair), 
/* filtered: we can safelty assume assetPair is defined in here. */
(0, rxjs_1.map)((assetPair) => assetPair.minRatio), (0, rxjs_1.share)());
/**
 * The minimum protocol-allowed collaterallisation level expressed as a percentage
 * ( for display )
 * @category Borrow | Collateral
 * */
exports.minCollateralizationPercentø = exports.minCollateralizationRatioø.pipe((0, rxjs_1.map)((ratio) => (0, yieldUtils_1.ratioToPercent)(ratio, 2)), (0, rxjs_1.share)());
/**
 * Check if the debt amount is undercollaterallized
 * @category Borrow | Collateral
 * */
exports.isUndercollateralizedø = (0, rxjs_1.combineLatest)([
    exports.collateralizationRatioø,
    exports.minCollateralizationRatioø,
]).pipe((0, rxjs_1.map)(([ratio, minRatio]) => ratio <= minRatio), (0, rxjs_1.share)());
/**
 * Check if the collateraillization level of a vault is consdired 'unhealthy'
 * @category Borrow | Collateral
 * */
exports.isUnhealthyCollateralizationø = (0, rxjs_1.combineLatest)([
    exports.collateralizationRatioø,
    observables_1.selectedø,
    exports.minCollateralizationRatioø,
]).pipe((0, rxjs_1.filter)(([, { vault }]) => !!vault), (0, rxjs_1.map)(([ratio, { vault }, minRatio]) => {
    if (vault === null || vault === void 0 ? void 0 : vault.accruedArt.big.lte(utils_1.ZERO_BN))
        return false;
    return ratio < minRatio + 0.2;
}), (0, rxjs_1.share)());
/**
 * The minimum collateral required to meet the minimum protocol-allowed levels
 * @category Borrow | Collateral
 * */
exports.minCollateralRequiredø = (0, rxjs_1.combineLatest)([
    _selectedPairø,
    exports.minCollateralizationRatioø,
    _totalDebtWithInputø,
    _totalCollateralWithInputø,
]).pipe((0, rxjs_1.map)(([assetPair, minCollatRatio, totalDebt, totalCollat]) => {
    const _pairPriceInWei = (0, math_1.decimalNToDecimal18)(assetPair.pairPrice.big, assetPair.baseDecimals);
    const _calcMin = (0, math_1.calculateMinCollateral)(_pairPriceInWei, totalDebt[0], minCollatRatio.toString(), totalCollat[1]);
    return (0, yieldUtils_1.bnToW3bNumber)(_calcMin, assetPair === null || assetPair === void 0 ? void 0 : assetPair.baseDecimals);
}), (0, rxjs_1.share)());
/**
 *  Minimum Safe collatearalization level expressed asa ratio
 *  TODO: would this be better specified with the assetPair data? - possibly
 * @category Borrow | Collateral
 * */
exports.minimumSafeRatioø = exports.minCollateralizationRatioø.pipe((0, rxjs_1.map)((minRatio) => {
    if (minRatio >= 1.5)
        return minRatio + 1; // eg. 150% -> 250%
    if (minRatio < 1.5 && minRatio >= 1.4)
        return minRatio + 0.65; // eg. 140% -> 200%
    if (minRatio < 1.4 && minRatio > 1.1)
        return minRatio + 0.1; // eg. 133% -> 143%
    return minRatio; // eg. 110% -> 110%
}), (0, rxjs_1.share)());
/**
 *  Minimum Safe collatearalization level expressed as a percentage
 * @category Borrow | Collateral
 * */
exports.minimumSafePercentø = exports.minimumSafeRatioø.pipe((0, rxjs_1.map)((ratio) => (0, yieldUtils_1.ratioToPercent)(ratio, 2)), (0, rxjs_1.share)());
/**
 * Maximum collateral based selected Ilk and users balance
 * @category Borrow | Collateral
 */
exports.maxCollateralø = observables_1.selectedø.pipe((0, rxjs_1.map)((selectedø) => selectedø.ilk ? selectedø.ilk.balance : constants_1.ZERO_W3B), (0, rxjs_1.share)());
/**
 * Calculate the maximum amount of collateral that can be removed
 * without leaving the vault undercollateralised
 * @category Borrow | Collateral
 * */
exports.maxRemovableCollateralø = (0, rxjs_1.combineLatest)([
    observables_1.selectedø,
    _totalCollateralWithInputø,
    exports.minCollateralRequiredø,
]).pipe((0, rxjs_1.map)(([{ vault }, totalCollat, minReqd]) => {
    if (vault) {
        const tot_ = vault.accruedArt.big.gt(minReqd.big) ? totalCollat[1].sub(utils_1.ONE_BN) : totalCollat[1];
        return (0, yieldUtils_1.bnToW3bNumber)(tot_, vault.baseDecimals);
    }
    return constants_1.ZERO_W3B;
}), (0, rxjs_1.share)());
/**
 * Price at which the vault will get liquidated
 * @category Borrow | Collateral
 * */
exports.vaultLiquidatePriceø = (0, rxjs_1.combineLatest)([observables_1.selectedø, _selectedPairø]).pipe((0, rxjs_1.filter)(([selected, pairInfo]) => !!selected.vault && !!pairInfo), (0, rxjs_1.map)(([selected, pairInfo]) => (0, math_1.calcLiquidationPrice)(selected.vault.ink.hStr, selected.vault.accruedArt.hStr, pairInfo.minRatio)), (0, rxjs_1.share)());
/**
 * Pre Transaction estimated Price at which a vault / pair  will get liquidated
 * based on collateral and debt INPUT ( and existing colalteral and debt)
 * @category Borrow | Collateral
 * */
exports.estimatedLiquidatePriceø = (0, rxjs_1.combineLatest)([
    _totalDebtWithInputø,
    _totalCollateralWithInputø,
    _selectedPairø,
]).pipe((0, rxjs_1.filter)(([, pairInfo]) => !!pairInfo), (0, rxjs_1.map)(([ink, art, pairInfo]) => (0, math_1.calcLiquidationPrice)(ink[0].toString(), art[0].toString(), pairInfo.minRatio)), (0, rxjs_1.share)());
//# sourceMappingURL=collateralView.js.map
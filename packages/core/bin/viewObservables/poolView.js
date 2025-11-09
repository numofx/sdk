"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPartialRemoveRequiredø = exports.removeLiquidityReturnø = exports.borrowAndPoolVaultø = exports.maximumRemoveLiquidityø = exports.isBuyAndPoolPossibleø = exports.maximumAddLiquidityø = void 0;
const math_1 = require("@numo-engine/math");
const ethers_1 = require("ethers");
const rxjs_1 = require("rxjs");
const observables_1 = require("../observables");
const utils_1 = require("../utils");
const constants_1 = require("../utils/constants");
const yieldUtils_1 = require("../utils/yieldUtils");
const input_1 = require("./input");
// maxRemoveNoVault,
// maxRemoveWithVault,
// partialRemoveRequired, // boolean
// removeBaseReceived,
// removeFyTokenReceived,
// removeBaseReceived_,
// removeFyTokenReceived_,
/**
 * @category Pool | Add Liquidity
 */
exports.maximumAddLiquidityø = observables_1.selectedø.pipe((0, rxjs_1.map)(({ base }) => {
    return (base === null || base === void 0 ? void 0 : base.balance) || constants_1.ZERO_W3B;
}));
/**
 * Check if it is possible to use BUY and POOL strategy is available for a particular INPUT and selected strategy.
 * @category Pool | Add Liquidity
 */
exports.isBuyAndPoolPossibleø = (0, rxjs_1.combineLatest)([
    input_1.addLiquidityInputø,
    observables_1.selectedø,
    observables_1.userSettingsø,
]).pipe(
/* don't emit if input is zero or there isn't a strategy selected */
(0, rxjs_1.filter)(([input, selected]) => input.big.gt(utils_1.ZERO_BN) && !!selected.series), (0, rxjs_1.map)(([input, { series }, { slippageTolerance }]) => {
    const strategySeries = series; // filtered, we can safetly assume current series defined.
    let _fyTokenToBuy = utils_1.ZERO_BN;
    const _maxFyTokenOut = (0, math_1.maxFyTokenOut)(strategySeries.sharesReserves.big, strategySeries.fyTokenReserves.big, strategySeries.getTimeTillMaturity(), strategySeries.ts, strategySeries.g1, strategySeries.decimals);
    [_fyTokenToBuy] = (0, math_1.fyTokenForMint)(strategySeries.sharesReserves.big, strategySeries.fyTokenRealReserves.big, strategySeries.fyTokenReserves.big, (0, math_1.calculateSlippage)(input.big, slippageTolerance.toString(), true), strategySeries.getTimeTillMaturity(), strategySeries.ts, strategySeries.g1, strategySeries.decimals, slippageTolerance);
    /* Check if buy and pool option is allowed */
    const buyAndPoolAllowed = _fyTokenToBuy.gt(ethers_1.ethers.constants.Zero) &&
        _fyTokenToBuy.lt(_maxFyTokenOut) &&
        parseFloat(strategySeries.apr) > 0.25;
    // diagnostics && console.log('Can BuyAndPool?', buyAndPoolAllowed);
    return buyAndPoolAllowed;
}));
/**
 * Maximum removalable liquidity
 * - currently liquidity is always removable, so the balance is the strategy token balance
 *
 * @category Pool | Remove Liquidity
 */
exports.maximumRemoveLiquidityø = observables_1.selectedø.pipe((0, rxjs_1.map)(({ strategy }) => (strategy === null || strategy === void 0 ? void 0 : strategy.accountBalance) || constants_1.ZERO_W3B));
/**
 * Get the vault ( if adding liquidity was done using the 'Borrow and Pool' method. )
 * @category Pool | Remove Liquidity
 */
exports.borrowAndPoolVaultø = (0, rxjs_1.combineLatest)([observables_1.selectedø, observables_1.vaultsø]).pipe((0, rxjs_1.filter)(([selected]) => !!selected.strategy), (0, rxjs_1.map)(([{ strategy }, vaultMap]) => {
    const { baseId, currentSeriesId } = strategy;
    const arr = Array.from(vaultMap.values());
    const _matchingVault = arr
        .sort((vaultA, vaultB) => (vaultA.id > vaultB.id ? 1 : -1))
        .sort((vaultA, vaultB) => (vaultA.art.big.lt(vaultB.art.big) ? 1 : -1))
        .find((v) => v.ilkId === baseId && v.baseId === baseId && v.seriesId === currentSeriesId && v.isActive);
    // diagnostics && console.log('Matching Vault:', _matchingVault?.id || 'No matching vault.');
    return _matchingVault;
}));
/**
 *
 * Indicates the amount of [0] Base and [1] fyTokens that will be returned when partially removing liquidity tokens
 * based on the input
 * @returns [ base returned, fyTokens returned]
 * @category Pool | Remove Liquidity
 *
 * */
exports.removeLiquidityReturnø = (0, rxjs_1.combineLatest)([
    input_1.removeLiquidityInputø,
    observables_1.selectedø,
    exports.borrowAndPoolVaultø,
]).pipe((0, rxjs_1.filter)(([input, selected]) => input.big.gt(utils_1.ZERO_BN) && !!selected.series), (0, rxjs_1.map)(([input, { strategy, series }, borrowAndPoolVault]) => {
    var _a, _b, _c, _d, _e, _f;
    const strategySeries = series; // NOTE: filtered, we can safetly assume strategy currentSeries is defined.
    if (!!borrowAndPoolVault) {
        /**
         * CASE Matching vault (with debt) exists: USE 1 , 2.1 or 2.2
         * */
        /* Check the amount of fyTokens potentially recieved */
        const lpReceived = (0, math_1.burnFromStrategy)((_a = strategy === null || strategy === void 0 ? void 0 : strategy.strategyPoolBalance) === null || _a === void 0 ? void 0 : _a.big, (_b = strategy === null || strategy === void 0 ? void 0 : strategy.strategyTotalSupply) === null || _b === void 0 ? void 0 : _b.big, input.big);
        const [_baseReceived, _fyTokenReceived] = (0, math_1.burn)(strategySeries.sharesReserves.big, strategySeries.fyTokenRealReserves.big, strategySeries.totalSupply.big, lpReceived);
        // diagnostics && console.log('burnt (base, fytokens)', _baseReceived.toString(), _fyTokenReceived.toString());
        if (_fyTokenReceived.gt(borrowAndPoolVault === null || borrowAndPoolVault === void 0 ? void 0 : borrowAndPoolVault.accruedArt.big)) {
            /**
             * Fytoken received greater than debt : USE REMOVE OPTION 2.1 or 2.2
             * */
            // diagnostics &&
            //   console.log(
            //     'FyTokens received will be greater than debt: an extra sellFytoken trade is required: REMOVE OPTION 2.1 or 2.2 '
            //   );
            const _extraFyTokensToSell = _fyTokenReceived.sub(borrowAndPoolVault.accruedArt.big);
            // diagnostics && console.log(_extraFyTokensToSell.toString(), 'FyTokens Need to be sold');
            const _extraFyTokenValue = (0, math_1.sellFYToken)(strategySeries.sharesReserves.big, strategySeries.fyTokenRealReserves.big, _extraFyTokensToSell, (0, math_1.secondsToFrom)(strategySeries.maturity.toString()), strategySeries.ts, strategySeries.g2, strategySeries.decimals);
            if (_extraFyTokenValue.gt(utils_1.ZERO_BN)) {
                /**
                 * CASE> extra fyToken TRADE IS POSSIBLE :  USE REMOVE OPTION 2.1
                 * */
                const totalValue = _baseReceived.add(_extraFyTokenValue); // .add(_fyTokenReceived);
                return [(0, yieldUtils_1.bnToW3bNumber)(totalValue, strategySeries.decimals), constants_1.ZERO_W3B];
            }
            else {
                /**
                 * CASE> extra fyToken TRADE NOT POSSIBLE ( limited by protocol ): USE REMOVE OPTION 2.2
                 * */
                const _fyTokenVal = _fyTokenReceived.sub(borrowAndPoolVault.accruedArt.big);
                const _baseVal = _baseReceived; // .add(matchingVault.art);
                return [(0, yieldUtils_1.bnToW3bNumber)(_baseVal, strategySeries.decimals), (0, yieldUtils_1.bnToW3bNumber)(_fyTokenVal, strategySeries.decimals)];
            }
        }
        else {
            /**
             * CASE> fytokenReceived less than debt : USE REMOVE OPTION 1
             *  */
            const _value = _baseReceived; // .add(_fyTokenReceived);
            // diagnostics &&
            //   console.log(
            //     'FyTokens received will Less than debt: straight No extra trading is required : USE REMOVE OPTION 1 '
            //   );
            return [(0, yieldUtils_1.bnToW3bNumber)(_value, strategySeries.decimals), constants_1.ZERO_W3B];
        }
    }
    else {
        /**
         * SCENARIO > No matching vault exists : USE REMOVE OPTION 4
         * */
        /* Check the amount of fyTokens potentially recieved */
        const lpReceived = (0, math_1.burnFromStrategy)((_c = strategy.strategyPoolBalance) === null || _c === void 0 ? void 0 : _c.big, (_d = strategy.strategyTotalSupply) === null || _d === void 0 ? void 0 : _d.big, input.big);
        const [_baseReceived, _fyTokenReceived] = (0, math_1.burn)(strategySeries.sharesReserves.big, strategySeries.fyTokenRealReserves.big, strategySeries.totalSupply.big, lpReceived);
        /* Calculate the token Value */
        const [tokenSellValue, totalTokenValue] = (0, math_1.strategyTokenValue)(input.big, (_e = strategy === null || strategy === void 0 ? void 0 : strategy.strategyTotalSupply) === null || _e === void 0 ? void 0 : _e.big, (_f = strategy === null || strategy === void 0 ? void 0 : strategy.strategyPoolBalance) === null || _f === void 0 ? void 0 : _f.big, strategySeries.sharesReserves.big, strategySeries.fyTokenRealReserves.big, strategySeries.totalSupply.big, strategySeries.getTimeTillMaturity(), strategySeries.ts, strategySeries.g2, strategySeries.decimals);
        // diagnostics && console.log('NO VAULT : pool trade is possible  : USE REMOVE OPTION 4.1 ');
        if (tokenSellValue.gt(utils_1.ZERO_BN))
            return [(0, yieldUtils_1.bnToW3bNumber)(totalTokenValue, strategySeries.decimals), constants_1.ZERO_W3B];
        // diagnostics && console.log('NO VAULT : trade not possible : USE REMOVE OPTION 4.2');
        return [
            (0, yieldUtils_1.bnToW3bNumber)(_baseReceived, strategySeries.decimals),
            (0, yieldUtils_1.bnToW3bNumber)(_fyTokenReceived, strategySeries.decimals),
        ];
    }
}));
/**
 * Check if not all liquidity can be removed, and a partial removal is required.
 * @category Pool | Remove Liquidity
 */
exports.isPartialRemoveRequiredø = exports.removeLiquidityReturnø.pipe((0, rxjs_1.map)((removals) => {
    //diagnostics &&  console.log( 'partial removal is required')
    const areFyTokensReturned = removals[1].big.gt(utils_1.ZERO_BN);
    return areFyTokensReturned;
}));
//# sourceMappingURL=poolView.js.map
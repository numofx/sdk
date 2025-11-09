"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeLend = void 0;
const tslib_1 = require("tslib");
const math_1 = require("@numo-engine/math");
const rxjs_1 = require("rxjs");
const chainActions_1 = require("../chainActions");
const assetsConfig_1 = require("../config/assetsConfig");
const observables_1 = require("../observables");
const types_1 = require("../types");
const utils_1 = require("../utils");
const yieldUtils_1 = require("../utils/yieldUtils");
const _addRemoveEth_1 = require("./_addRemoveEth");
const closeLend = (amount, series) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* Subscribe to and get the values from the observables:  */
    (0, rxjs_1.combineLatest)([observables_1.protocolø, observables_1.assetsø, observables_1.accountø, observables_1.userSettingsø])
        .pipe((0, rxjs_1.take)(1)) // only take one and then finish.
        .subscribe(([{ ladle }, assetMap, account, { slippageTolerance },]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const txCode = (0, utils_1.getProcessCode)(types_1.ActionCodes.CLOSE_POSITION, series.id);
        const base = assetMap.get(series.baseId);
        const _amount = (0, yieldUtils_1.inputToTokenValue)(amount, base.decimals);
        const { fyTokenAddress, poolAddress } = series;
        const ladleAddress = ladle.address;
        const seriesIsMature = series.isMature();
        /* buy fyToken value ( after maturity  fytoken === base value ) */
        const _fyTokenValueOfInput = seriesIsMature
            ? _amount
            : (0, math_1.buyBase)(series.sharesReserves.big, series.fyTokenReserves.big, _amount, series.getTimeTillMaturity(), series.ts, series.g2, series.decimals);
        /* calculate slippage on the base token expected to recieve ie. input */
        const _inputWithSlippage = (0, math_1.calculateSlippage)(_amount, slippageTolerance.toString(), true);
        /* if ethBase */
        const isEthBase = assetsConfig_1.ETH_BASED_ASSETS.includes(series.baseId);
        /* if approveMAx, check if signature is required */
        const alreadyApproved = (yield series.fyTokenContract.allowance(account, ladleAddress)).gte(_fyTokenValueOfInput);
        const permitCallData = yield (0, chainActions_1.sign)([
            {
                target: series,
                spender: 'LADLE',
                amount: _fyTokenValueOfInput,
                ignoreIf: alreadyApproved === true,
            },
        ], txCode);
        const removeEthCallData = isEthBase ? yield (0, _addRemoveEth_1.removeEth)(utils_1.ONE_BN) : [];
        /* Set the transferTo address based on series maturity */
        const transferToAddress = () => {
            if (seriesIsMature)
                return fyTokenAddress;
            return poolAddress;
        };
        /* receiver based on whether base is ETH (- or wrapped Base) */
        const receiverAddress = () => {
            if (isEthBase)
                return ladleAddress;
            // if ( unwrapping) return unwrapHandlerAddress;
            return account;
        };
        const calls = [
            ...permitCallData,
            {
                operation: types_1.LadleActions.Fn.TRANSFER,
                args: [
                    fyTokenAddress,
                    transferToAddress(),
                    _fyTokenValueOfInput,
                ],
                ignoreIf: false, // never ignore, even after maturity because we go through the ladle.
            },
            /* BEFORE MATURITY */
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [receiverAddress(), _inputWithSlippage],
                fnName: types_1.RoutedActions.Fn.SELL_FYTOKEN,
                targetContract: series.poolContract,
                ignoreIf: seriesIsMature,
            },
            /* AFTER MATURITY */
            {
                operation: types_1.LadleActions.Fn.REDEEM,
                args: [series.id, receiverAddress(), _fyTokenValueOfInput],
                ignoreIf: !seriesIsMature,
            },
            ...removeEthCallData, // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)
        ];
        (0, chainActions_1.transact)(calls, txCode);
    }));
});
exports.closeLend = closeLend;
//# sourceMappingURL=closeLend.js.map
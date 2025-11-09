"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollLend = void 0;
const tslib_1 = require("tslib");
const math_1 = require("@numo-engine/math");
const ethers_1 = require("ethers");
const rxjs_1 = require("rxjs");
const chainActions_1 = require("../chainActions");
const observables_1 = require("../observables");
const types_1 = require("../types");
const utils_1 = require("../utils");
const yieldUtils_1 = require("../utils/yieldUtils");
const rollLend = (amount, fromSeries, toSeries) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* Subscribe to and get the values from the observables:  */
    (0, rxjs_1.combineLatest)([observables_1.protocolø, observables_1.assetsø, observables_1.accountø, observables_1.userSettingsø])
        .pipe((0, rxjs_1.take)(1)) // only take one and then finish.
        .subscribe(([{ ladle }, assetMap, account, { slippageTolerance },]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        /* generate the reproducible txCode for tx tracking and tracing */
        const txCode = (0, utils_1.getProcessCode)(types_1.ActionCodes.ROLL_POSITION, fromSeries.id);
        /* Get the values from the observables/subjects */
        const ladleAddress = ladle.address;
        const base = assetMap.get(fromSeries.baseId);
        const _amount = (0, yieldUtils_1.inputToTokenValue)(amount, base.decimals);
        const seriesIsMature = fromSeries.isMature();
        const _fyTokenValueOfInput = seriesIsMature
            ? _amount
            : (0, math_1.buyBase)(fromSeries.sharesReserves.big, fromSeries.fyTokenReserves.big, _amount, fromSeries.getTimeTillMaturity(), fromSeries.ts, fromSeries.g2, fromSeries.decimals);
        console.log(_fyTokenValueOfInput.toString());
        const _minimumFYTokenReceived = (0, math_1.calculateSlippage)(_fyTokenValueOfInput, slippageTolerance.toString(), true);
        const alreadyApproved = (yield fromSeries.fyTokenContract.allowance(account, ladleAddress)).gte(_amount);
        const permitCallData = yield (0, chainActions_1.sign)([
            {
                target: fromSeries,
                spender: 'LADLE',
                amount: _fyTokenValueOfInput,
                ignoreIf: alreadyApproved === true,
            },
        ], txCode);
        /* Reciever of transfer (based on maturity) the series maturity */
        const transferToAddress = () => {
            if (seriesIsMature)
                return fromSeries.fyTokenAddress;
            return fromSeries.poolAddress;
        };
        const calls = [
            ...permitCallData,
            {
                operation: types_1.LadleActions.Fn.TRANSFER,
                args: [fromSeries.fyTokenAddress, transferToAddress(), _fyTokenValueOfInput],
                ignoreIf: false, // never ignore
            },
            /* BEFORE MATURITY */
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [toSeries.poolAddress, ethers_1.ethers.constants.Zero],
                fnName: types_1.RoutedActions.Fn.SELL_FYTOKEN,
                targetContract: fromSeries.poolContract,
                ignoreIf: seriesIsMature,
            },
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [account, _minimumFYTokenReceived],
                fnName: types_1.RoutedActions.Fn.SELL_BASE,
                targetContract: toSeries.poolContract,
                ignoreIf: seriesIsMature,
            },
            /* AFTER MATURITY */
            {
                // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
                operation: types_1.LadleActions.Fn.REDEEM,
                args: [fromSeries.id, toSeries.poolAddress, _fyTokenValueOfInput],
                ignoreIf: !seriesIsMature,
            },
            {
                // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [account, _minimumFYTokenReceived],
                fnName: types_1.RoutedActions.Fn.SELL_BASE,
                targetContract: toSeries.poolContract,
                ignoreIf: !seriesIsMature,
            },
        ];
        (0, chainActions_1.transact)(calls, txCode);
    }));
});
exports.rollLend = rollLend;
//# sourceMappingURL=rollLend.js.map
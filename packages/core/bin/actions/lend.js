"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lend = void 0;
const tslib_1 = require("tslib");
const math_1 = require("@numo-engine/math");
const assetsConfig_1 = require("../config/assetsConfig");
const observables_1 = require("../observables");
const chainActions_1 = require("../chainActions");
const types_1 = require("../types");
const _addRemoveEth_1 = require("./_addRemoveEth");
const yieldUtils_1 = require("../utils/yieldUtils");
const rxjs_1 = require("rxjs");
const lend = (amount, series) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* Subscribe to and get the values from the observables:  */
    (0, rxjs_1.combineLatest)([observables_1.protocolø, observables_1.assetsø, observables_1.accountø, observables_1.userSettingsø])
        .pipe((0, rxjs_1.take)(1)) // only take one and then finish.
        .subscribe(([{ ladle }, assetMap, account, { slippageTolerance },]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        /* generate the reproducible processCode for tx tracking and tracing */
        const processCode = (0, yieldUtils_1.getProcessCode)(types_1.ActionCodes.LEND, series.id);
        /* Get the values from the observables/subjects */
        const ladleAddress = ladle.address;
        const base = assetMap.get(series.baseId);
        const _amount = (0, yieldUtils_1.inputToTokenValue)(amount, base === null || base === void 0 ? void 0 : base.decimals);
        const _inputAsFyToken = (0, math_1.sellBase)(series.sharesReserves.big, series.fyTokenReserves.big, _amount, series.getTimeTillMaturity(), series.ts, series.g1, series.decimals);
        const _inputAsFyTokenWithSlippage = (0, math_1.calculateSlippage)(_inputAsFyToken, slippageTolerance.toString(), true);
        /* if approveMAx, check if signature is required */
        const alreadyApproved = (yield base.getAllowance(account, ladleAddress)).gte(_amount);
        /* ETH is used as a base */
        const isEthBase = assetsConfig_1.ETH_BASED_ASSETS.includes(series.baseId);
        const permitCallData = yield (0, chainActions_1.sign)([
            {
                target: base,
                spender: 'LADLE',
                amount: _amount,
                ignoreIf: alreadyApproved === true,
            },
        ], processCode);
        const addEthCallData = yield (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            if (isEthBase) {
                const ethToPoolCall = yield (0, _addRemoveEth_1.addEth)(_amount, series.poolAddress);
                return ethToPoolCall;
            }
            return [];
        }))();
        const calls = [
            ...permitCallData,
            ...addEthCallData,
            {
                operation: types_1.LadleActions.Fn.TRANSFER,
                args: [base.address, series.poolAddress, _amount],
                ignoreIf: isEthBase,
            },
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [account, _inputAsFyTokenWithSlippage],
                fnName: types_1.RoutedActions.Fn.SELL_BASE,
                targetContract: series.poolContract,
                ignoreIf: false,
            },
        ];
        (0, chainActions_1.transact)(calls, processCode);
    }));
});
exports.lend = lend;
//# sourceMappingURL=lend.js.map
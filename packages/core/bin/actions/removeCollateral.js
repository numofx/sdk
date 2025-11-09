"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCollateral = void 0;
const tslib_1 = require("tslib");
const chainActions_1 = require("../chainActions");
const assetsConfig_1 = require("../config/assetsConfig");
const rxjs_1 = require("rxjs");
const contracts_1 = require("@numo-engine/contracts");
const observables_1 = require("../observables");
const types_1 = require("../types");
const utils_1 = require("../utils");
const yieldUtils_1 = require("../utils/yieldUtils");
const _addRemoveEth_1 = require("./_addRemoveEth");
const _wrapUnwrapAsset_1 = require("./_wrapUnwrapAsset");
const removeCollateral = (amount, vault, unwrapOnRemove = true) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* Subscribe to and get the values from the observables:  */
    (0, rxjs_1.combineLatest)([observables_1.protocolø, observables_1.assetsø, observables_1.accountø, observables_1.providerø])
        .pipe((0, rxjs_1.take)(1)) // only take one and then finish.
        .subscribe(([{ ladle }, assetMap, account, provider]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        /* generate the txCode for tx tracking and tracing */
        const txCode = (0, utils_1.getProcessCode)(types_1.ActionCodes.REMOVE_COLLATERAL, vault.id);
        /* get associated series and ilk */
        const ilk = assetMap.get(vault.ilkId);
        const ladleAddress = ladle.address;
        /* get unwrap handler if required */
        const unwrapHandlerAddress = ilk.unwrapHandlerAddress;
        /* check if the ilk/asset is an eth asset variety OR if it is wrapped token, if so pour to Ladle */
        const isEthCollateral = assetsConfig_1.ETH_BASED_ASSETS.includes(ilk.proxyId);
        /* parse inputs to BigNumber in Wei */
        const _amount = (0, yieldUtils_1.inputToTokenValue)(amount, ilk.decimals);
        /* handle wrapped tokens:  */
        const unwrapCallData = unwrapOnRemove ? yield (0, _wrapUnwrapAsset_1.unwrapAsset)(ilk, account) : [];
        const removeEthCallData = isEthCollateral ? yield (0, _addRemoveEth_1.removeEth)(utils_1.ONE_BN) : []; // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)
        /* is convex-type collateral */
        const isConvexCollateral = assetsConfig_1.CONVEX_BASED_ASSETS.includes(ilk.proxyId);
        const convexJoinContract = contracts_1.ConvexJoin__factory.connect(ilk.joinAddress, provider);
        /* pour destination based on ilk/asset is an eth asset variety ( or unwrapHadnler address if unwrapping) */
        const pourToAddress = () => {
            console.log('Requires unwrapping? ', unwrapCallData.length);
            if (isEthCollateral)
                return ladleAddress;
            if (unwrapCallData.length)
                return unwrapHandlerAddress; // if there is something to unwrap
            return account;
        };
        const calls = [
            /* convex-type collateral; ensure checkpoint before giving collateral back to account */
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [vault.owner],
                fnName: types_1.RoutedActions.Fn.CHECKPOINT,
                targetContract: convexJoinContract,
                ignoreIf: !isConvexCollateral,
            },
            {
                operation: types_1.LadleActions.Fn.POUR,
                args: [
                    vault.id,
                    pourToAddress(),
                    _amount.mul(-1),
                    utils_1.ZERO_BN, // No debt written off
                ],
                ignoreIf: false,
            },
            ...removeEthCallData,
            ...unwrapCallData,
        ];
        (0, chainActions_1.transact)(calls, txCode);
    }));
});
exports.removeCollateral = removeCollateral;
//# sourceMappingURL=removeCollateral.js.map
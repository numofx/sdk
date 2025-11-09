"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repayDebt = void 0;
const tslib_1 = require("tslib");
const math_1 = require("@numo-engine/math");
const ethers_1 = require("ethers");
const assetsConfig_1 = require("../config/assetsConfig");
const contracts_1 = require("@numo-engine/contracts");
const types_1 = require("../types");
const constants_1 = require("../utils/constants");
const yieldUtils_1 = require("../utils/yieldUtils");
const sign_1 = require("../chainActions/sign");
const transact_1 = require("../chainActions/transact");
const _addRemoveEth_1 = require("./_addRemoveEth");
const _wrapUnwrapAsset_1 = require("./_wrapUnwrapAsset");
const observables_1 = require("../observables");
const rxjs_1 = require("rxjs");
/**
 * REPAY FN
 * @param vault
 * @param amount
 * @param reclaimCollateral
 */
const repayDebt = (amount, vault, reclaimCollateral = true) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* Subscribe to and get the values from the observables:  */
    (0, rxjs_1.combineLatest)([observables_1.protocolø, observables_1.assetsø, observables_1.seriesø, observables_1.accountø, observables_1.userSettingsø, observables_1.providerø])
        .pipe((0, rxjs_1.filter)(() => !!vault), (0, rxjs_1.take)(1) // only take one and then finish.
    )
        .subscribe(([{ ladle }, assetMap, seriesMap, account, { slippageTolerance }, provider]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const txCode = (0, yieldUtils_1.getProcessCode)(types_1.ActionCodes.REPAY, vault.id);
        const ladleAddress = ladle.address;
        const series = seriesMap.get(vault.seriesId);
        const base = assetMap.get(vault.baseId);
        const ilk = assetMap.get(vault.ilkId);
        const isEthCollateral = assetsConfig_1.ETH_BASED_ASSETS.includes(vault.ilkId);
        const isEthBase = assetsConfig_1.ETH_BASED_ASSETS.includes(series.baseId);
        /* is convex-type collateral */
        const isConvexCollateral = assetsConfig_1.CONVEX_BASED_ASSETS.includes(ilk.proxyId);
        // TODO: this is a bit of an anti-pattern ?? 
        const convexJoinContract = contracts_1.ConvexJoin__factory.connect(ilk.joinAddress, provider);
        /* Parse amounts */
        const _amount = (0, yieldUtils_1.inputToTokenValue)(amount, base.decimals);
        const _maxBaseIn = (0, math_1.maxBaseIn)(series.sharesReserves.big, series.fyTokenReserves.big, series.getTimeTillMaturity(), series.ts, series.g1, series.decimals);
        /* Check the max amount of the trade that the pool can handle */
        const tradeIsNotPossible = _amount.gt(_maxBaseIn);
        const _amountAsFyToken = series.isMature()
            ? _amount
            : (0, math_1.sellBase)(series.sharesReserves.big, series.fyTokenReserves.big, _amount, (0, math_1.secondsToFrom)(series.maturity.toString()), series.ts, series.g1, series.decimals);
        const _amountAsFyTokenWithSlippage = (0, math_1.calculateSlippage)(_amountAsFyToken, slippageTolerance.toString(), true // minimize
        );
        /* Check if amount is more than the debt */
        const amountGreaterThanEqualDebt = ethers_1.ethers.BigNumber.from(_amountAsFyToken).gte(vault.accruedArt.big);
        /* If requested, and all debt will be repaid, automatically remove collateral */
        const _collateralToRemove = reclaimCollateral && amountGreaterThanEqualDebt ? vault.ink.big.mul(-1) : ethers_1.ethers.constants.Zero;
        /* Cap the amount to transfer: check that if amount is greater than debt, used after maturity only repay the max debt (or accrued debt) */
        const _amountCappedAtArt = vault.art.big.gt(constants_1.ZERO_BN) && vault.art.big.lte(_amount) ? vault.art.big : _amount;
        /* Set the amount to transfer ( + 0.1% after maturity ) */
        const amountToTransfer = series.isMature() ? _amount.mul(10001).div(10000) : _amount; // After maturity + 0.1% for increases during tx time
        /* In low liq situations/or mature,  send repay funds to join not pool */
        const transferToAddress = tradeIsNotPossible || series.isMature() ? base.joinAddress : series.poolAddress;
        /* Check if already apporved */
        const alreadyApproved = (yield base.getAllowance(account, ladleAddress)).gte(amountToTransfer);
        // const wrapAssetCallData : ICallData[] = await wrapAsset(ilk, account!);
        const unwrapAssetCallData = reclaimCollateral ? yield (0, _wrapUnwrapAsset_1.unwrapAsset)(ilk, account) : [];
        const permitCallData = yield (0, sign_1.sign)([
            {
                // before maturity
                target: base,
                spender: ladleAddress,
                amount: amountToTransfer.mul(110).div(100),
                ignoreIf: alreadyApproved === true,
            },
        ], txCode);
        /* Remove ETH collateral. (exit_ether sweeps all the eth out of the ladle, so exact amount is not importnat -> just greater than zero) */
        const removeEthCallData = isEthCollateral ? yield (0, _addRemoveEth_1.removeEth)(constants_1.ONE_BN) : [];
        /* Address to send the funds to either ladle (if eth is used as collateral) or account */
        const reclaimToAddress = () => {
            if (isEthCollateral)
                return ladleAddress;
            if (unwrapAssetCallData.length && ilk.unwrapHandlerAddress)
                return ilk.unwrapHandlerAddress; // if there is somethign to unwrap
            return account;
        };
        const addEthCallData = yield (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            if (isEthBase) {
                const to = series.isMature() ? undefined : transferToAddress;
                const ethToAddr = yield (0, _addRemoveEth_1.addEth)(amountToTransfer, to);
                return ethToAddr;
            }
            return [];
        }))();
        const calls = [
            ...permitCallData,
            /* Reqd. when we have a wrappedBase */
            // ...wrapAssetCallData
            /* If ethBase, Send ETH to either base join or pool  */
            ...addEthCallData,
            // ...addEth(isEthBase && !series.isMature() ? amountToTransfer : ZERO_BN, transferToAddress), // destination = either join or series depending if tradeable
            // ...addEth(isEthBase && series.isMature() ? amountToTransfer : ZERO_BN), // no destination defined after maturity , amount +1% will will go to weth join
            /* Else, Send Token to either join or pool via a ladle.transfer() */
            {
                operation: types_1.LadleActions.Fn.TRANSFER,
                args: [base.address, transferToAddress, amountToTransfer],
                ignoreIf: isEthBase,
            },
            /* BEFORE MATURITY - !series.seriesIsMature */
            /* convex-type collateral; ensure checkpoint before giving collateral back to account */
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [vault.owner],
                fnName: types_1.RoutedActions.Fn.CHECKPOINT,
                targetContract: convexJoinContract,
                ignoreIf: !isConvexCollateral || _collateralToRemove.eq(ethers_1.ethers.constants.Zero),
            },
            {
                operation: types_1.LadleActions.Fn.REPAY,
                args: [vault.id, account, ethers_1.ethers.constants.Zero, _amountAsFyTokenWithSlippage],
                ignoreIf: series.isMature() || amountGreaterThanEqualDebt || tradeIsNotPossible,
            },
            {
                operation: types_1.LadleActions.Fn.REPAY_VAULT,
                args: [vault.id, reclaimToAddress(), _collateralToRemove, _amount],
                ignoreIf: series.isMature() ||
                    !amountGreaterThanEqualDebt || // ie ignore if use if amount IS NOT more than debt
                    tradeIsNotPossible,
            },
            /* EdgeCase in lowLiq situations : Input GreaterThanMaxbaseIn ( user incurs a penalty because repaid at 1:1 ) */
            {
                operation: types_1.LadleActions.Fn.CLOSE,
                args: [
                    vault.id,
                    reclaimToAddress(),
                    _collateralToRemove,
                    _amountCappedAtArt.mul(-1),
                ],
                ignoreIf: series.isMature() || !tradeIsNotPossible, // (ie. ignore if trade IS possible )
            },
            /* AFTER MATURITY  - series.seriesIsMature */
            {
                operation: types_1.LadleActions.Fn.CLOSE,
                args: [
                    vault.id,
                    reclaimToAddress(),
                    _collateralToRemove,
                    _amountCappedAtArt.mul(-1),
                ],
                ignoreIf: !series.isMature(),
            },
            ...removeEthCallData,
            ...unwrapAssetCallData,
        ];
        /* finally transact, and send in update series as a callback */
        (0, transact_1.transact)(calls, txCode, () => { (0, observables_1.updateVaults)([vault]); (0, observables_1.updateSeries)([series]); });
    }));
});
exports.repayDebt = repayDebt;
//# sourceMappingURL=repayDebt.js.map
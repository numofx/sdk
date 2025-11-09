"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.borrow = void 0;
const tslib_1 = require("tslib");
const ethers_1 = require("ethers");
const math_1 = require("@numo-engine/math");
const assetsConfig_1 = require("../config/assetsConfig");
const observables_1 = require("../observables");
const chainActions_1 = require("../chainActions");
const types_1 = require("../types");
const operations_1 = require("../types/operations");
const _addRemoveEth_1 = require("./_addRemoveEth");
const _wrapUnwrapAsset_1 = require("./_wrapUnwrapAsset");
const utils_1 = require("../utils");
const messages_1 = require("../observables/messages");
const yieldUtils_1 = require("../utils/yieldUtils");
const rxjs_1 = require("rxjs");
const borrow = (amount, collateralAmount, vault, getValuesFromNetwork = true // Get market values by network call or offline calc (default: NETWORK)
) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* Subscribe to and get the values from the observables:  */
    (0, rxjs_1.combineLatest)([observables_1.protocolø, observables_1.assetsø, observables_1.seriesø, observables_1.vaultsø, observables_1.accountø, observables_1.selectedø, observables_1.userSettingsø])
        .pipe((0, rxjs_1.take)(1)) // only take one and then finish.
        .subscribe(([{ ladle, moduleMap }, assetMap, seriesMap, vaultMap, account, selected, { slippageTolerance }]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        var _a;
        /** Use the vault/vaultId provided else use blank vault TODO: Add a check for existing vault */
        const _getValidatedVault = (v) => {
            if (v) {
                if (v.id)
                    return v;
                if (vaultMap.has(v))
                    return vaultMap.get(v);
                (0, messages_1.sendMsg)({
                    message: 'Vault ID provided, but not recognised.',
                    type: messages_1.MessageType.WARNING,
                    origin: 'Borrow()',
                });
                throw new Error('Vault ID provided, but was not recognised.');
                // return undefined //TODO: should pass this instead of throwing error?
            }
            (0, messages_1.sendMsg)({
                message: 'No Vault ID provided. Creating a new Vault...',
                type: messages_1.MessageType.INFO,
                origin: 'Borrow()',
            });
            return undefined;
        };
        const _vault = _getValidatedVault(vault);
        const vaultId = _vault ? _vault.id : utils_1.BLANK_VAULT;
        /* Set the series and ilk based on the vault that has been selected or if it's a new vault, get from the globally selected SeriesId */
        const series = _vault ? seriesMap.get(_vault.seriesId) : selected.series;
        const base = assetMap.get(series.baseId);
        const ilk = _vault ? assetMap.get(_vault.ilkId) : assetMap.get(selected.ilk.proxyId); // NOTE: Here we use the 'wrapped version' of the selected Ilk, if required.
        /* Shortcut if series is mature -> no borrowing */
        if (series.isMature()) {
            console.log('Series is mature. ');
            (0, messages_1.sendMsg)({
                message: 'Series is mature.',
                type: messages_1.MessageType.INFO,
                origin: series.id,
            });
            return;
        }
        /* bring in the Convex Mmdule where reqd. */
        const ConvexLadleModuleContract = moduleMap.get('ConvexLadleModule');
        /* generate the reproducible processCode for tx tracking and tracing */
        const processCode = (0, utils_1.getProcessCode)(types_1.ActionCodes.BORROW, series.id);
        /* parse inputs  (clean 'down' to base/ilk decimals so that there is never an underlow)  */
        const _amount = (0, yieldUtils_1.inputToTokenValue)(amount, base.decimals);
        const _collAmount = (0, yieldUtils_1.inputToTokenValue)(collateralAmount, ilk.decimals);
        /* FLAG : is ETH  used as collateral */
        const isEthCollateral = assetsConfig_1.ETH_BASED_ASSETS.includes(selected.ilk.proxyId);
        /* FLAG: is ETH being Borrowed */
        const isEthBase = assetsConfig_1.ETH_BASED_ASSETS.includes(series.baseId);
        /* FLAG: is convex-type collateral */
        const isConvexCollateral = assetsConfig_1.CONVEX_BASED_ASSETS.includes(selected.ilk.proxyId);
        console.log('convex? ', isConvexCollateral);
        console.log('vault? ', vaultId);
        /* Calculate expected debt (fytokens) from EITHER network or calculated : default = Network */
        const _expectedFyToken = getValuesFromNetwork
            ? yield series.poolContract.buyBasePreview(_amount)
            : (0, math_1.buyBase)(series.sharesReserves.big, series.fyTokenReserves.big, _amount, series.getTimeTillMaturity(), series.ts, series.g2, series.decimals);
        const _expectedFyTokenWithSlippage = (0, math_1.calculateSlippage)(_expectedFyToken, slippageTolerance.toString()); // TODO check this tolereance typing
        /* if approveMAx, check if signature is required : note: getAllowance may return FALSE if ERC1155 */
        const _allowance = yield ilk.getAllowance(account, ilk.joinAddress);
        const alreadyApproved = ethers_1.ethers.BigNumber.isBigNumber(_allowance) ? _allowance.gte(_collAmount) : _allowance;
        console.log('Already approved', alreadyApproved);
        /* if ETH is being borrowed, send the borrowed tokens (WETH) to ladle for unwrapping */
        const serveToAddress = () => {
            if (isEthBase)
                return ladle.address;
            // if ( wrapping  ) return wrapHandler
            return account;
        };
        /* handle ETH deposit as Collateral, if required (only if collateral used is ETH-based ), else send ZERO_BN */
        const addEthCallData = yield (0, _addRemoveEth_1.addEth)(isEthCollateral ? _collAmount : math_1.ZERO_BN);
        /* handle remove/unwrap WETH > if ETH is what is being borrowed */
        const removeEthCallData = yield (0, _addRemoveEth_1.removeEth)(isEthBase ? math_1.ONE_BN : math_1.ZERO_BN); // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)
        /* handle wrapping of collateral if required */
        const wrapAssetCallData = yield (0, _wrapUnwrapAsset_1.wrapAsset)(_collAmount, selected.ilk, processCode); // note: selected ilk used here, not wrapped version
        /**
         * Gather all the required signatures - sign() processes them and returns them as ICallData types
         * NOTE: this is an async function
         * */
        const permitCallData = yield (0, chainActions_1.sign)([
            {
                target: ilk,
                spender: ilk.joinAddress,
                amount: _collAmount,
                ignoreIf: alreadyApproved === true || // Ignore if already approved
                    assetsConfig_1.ETH_BASED_ASSETS.includes(ilk.id) || // Ignore if dealing with an eTH based collateral
                    _collAmount.eq(ethers_1.ethers.constants.Zero), // || // ignore if zero collateral value
                // wrapAssetCallData.length > 0, // Ignore if dealing with a wrapped collateral!
            },
        ], processCode);
        /**
         *
         * Collate all the calls required for the process
         * (including depositing ETH, signing permits, and building vault if needed)
         *
         * */
        const calls = [
            /* handle wrapped token deposit, if required */
            ...wrapAssetCallData,
            /* Include all the signatures gathered, if required */
            ...permitCallData,
            /* add in the ETH deposit if required */
            ...addEthCallData,
            /* If vault is null, build a new vault, else ignore */
            {
                operation: types_1.LadleActions.Fn.BUILD,
                args: [(_a = selected.series) === null || _a === void 0 ? void 0 : _a.id, ilk.id, '0'],
                ignoreIf: vaultId !== utils_1.BLANK_VAULT,
            },
            /* If convex-type collateral, add vault using convex ladle module */
            {
                operation: types_1.LadleActions.Fn.MODULE,
                fnName: operations_1.ModuleActions.Fn.ADD_CONVEX_VAULT,
                args: [ilk.joinAddress, vaultId],
                targetContract: ConvexLadleModuleContract,
                ignoreIf: vaultId !== utils_1.BLANK_VAULT || isConvexCollateral === false,
            },
            {
                operation: types_1.LadleActions.Fn.SERVE,
                args: [
                    vaultId,
                    serveToAddress(),
                    _collAmount,
                    _amount,
                    _expectedFyTokenWithSlippage,
                ],
                ignoreIf: false,
            },
            ...removeEthCallData,
        ];
        /* finally, handle the transaction and update vaults as the callback */
        (0, chainActions_1.transact)(calls, processCode, () => (0, observables_1.updateVaults)());
    }));
});
exports.borrow = borrow;
//# sourceMappingURL=borrow.js.map
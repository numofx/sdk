"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLiquidity = void 0;
const tslib_1 = require("tslib");
const math_1 = require("@numo-engine/math");
const ethers_1 = require("ethers");
const rxjs_1 = require("rxjs");
const chainActions_1 = require("../chainActions");
const assetsConfig_1 = require("../config/assetsConfig");
const observables_1 = require("../observables");
const types_1 = require("../types");
const utils_1 = require("../utils");
const yieldUtils_1 = require("../utils/yieldUtils");
const _addRemoveEth_1 = require("./_addRemoveEth");
const addLiquidity = (amount, strategy, method = types_1.AddLiquidityType.BUY, matchingVault = undefined) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* Subscribe to and get the values from the observables:  */
    (0, rxjs_1.combineLatest)([observables_1.protocolø, observables_1.assetsø, observables_1.seriesø, observables_1.accountø, observables_1.userSettingsø, observables_1.vaultsø, observables_1.strategiesø])
        .pipe((0, rxjs_1.take)(1)) // only take one and then finish.
        .subscribe(([{ ladle }, assetMap, seriesMap, account, { slippageTolerance }]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        /* Get the values from the observables/subjects */
        const ladleAddress = ladle.address;
        // /** use the strategy/ strategy address provided, else use selected Strategy TODO: Add a check for existing vault */
        // const _strategy: IStrategy | undefined = strategy && (strategy as IStrategy).id ? strategy : strategyMap.get(strategy as string);
        // const strategyId: string = _strategy ? _strategy.id : '';
        const _series = seriesMap.get(strategy.currentSeriesId);
        const _base = assetMap.get(_series === null || _series === void 0 ? void 0 : _series.baseId);
        const txCode = (0, utils_1.getProcessCode)(types_1.ActionCodes.ADD_LIQUIDITY, strategy.id);
        const matchingVaultId = matchingVault ? matchingVault.id : undefined;
        const _amount = (0, yieldUtils_1.inputToTokenValue)(amount, _base === null || _base === void 0 ? void 0 : _base.decimals);
        const _amountLessSlippage = (0, math_1.calculateSlippage)(_amount, slippageTolerance.toString(), true);
        const [cachedBaseReserves, cachedFyTokenReserves] = yield (_series === null || _series === void 0 ? void 0 : _series.poolContract.getCache());
        const cachedRealReserves = cachedFyTokenReserves.sub(_series === null || _series === void 0 ? void 0 : _series.totalSupply.big.sub(utils_1.ONE_BN));
        const [_fyTokenToBeMinted] = (0, math_1.fyTokenForMint)(cachedBaseReserves, cachedRealReserves, cachedFyTokenReserves, _amountLessSlippage, _series.getTimeTillMaturity(), _series.ts, _series.g1, _series.decimals, slippageTolerance);
        const [minRatio, maxRatio] = (0, math_1.calcPoolRatios)(cachedBaseReserves, cachedRealReserves);
        const [_baseToPool, _baseToFyToken] = (0, math_1.splitLiquidity)(cachedBaseReserves, cachedRealReserves, _amountLessSlippage, true);
        const _baseToPoolWithSlippage = ethers_1.BigNumber.from((0, math_1.calculateSlippage)(_baseToPool, slippageTolerance.toString()));
        /* if approveMAx, check if signature is still required */
        const alreadyApproved = (yield _base.getAllowance(account, ladleAddress)).gte(_amount);
        /* if ethBase */
        const isEthBase = assetsConfig_1.ETH_BASED_ASSETS.includes(_base.proxyId);
        /* DIAGNOSITCS */
        console.log('input: ', _amount.toString(), 'inputLessSlippage: ', _amountLessSlippage.toString(), 'base: ', cachedBaseReserves.toString(), 'real: ', cachedRealReserves.toString(), 'virtual: ', cachedFyTokenReserves.toString(), '>> baseSplit: ', _baseToPool.toString(), '>> fyTokenSplit: ', _baseToFyToken.toString(), '>> baseSplitWithSlippage: ', _baseToPoolWithSlippage.toString(), '>> minRatio', minRatio.toString(), '>> maxRatio', maxRatio.toString(), 'matching vault id', matchingVaultId);
        /**
         * GET SIGNTURE/APPROVAL DATA
         * */
        const permitCallData = yield (0, chainActions_1.sign)([
            {
                target: _base,
                spender: ladleAddress,
                amount: _amount,
                ignoreIf: alreadyApproved === true,
            },
        ], txCode);
        /* if  Eth base, build the correct add ethCalls */
        const addEthCallData = yield (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            /* BUY send WETH to  poolAddress */
            if (isEthBase && method === types_1.AddLiquidityType.BUY)
                return yield (0, _addRemoveEth_1.addEth)(_amount, _series.poolAddress);
            /* BORROW send WETH to both basejoin and poolAddress */
            if (isEthBase && method === types_1.AddLiquidityType.BORROW) {
                const ethToJoin = yield (0, _addRemoveEth_1.addEth)(_baseToFyToken, _base.joinAddress);
                const ethToPool = yield (0, _addRemoveEth_1.addEth)(_baseToPoolWithSlippage, _series.poolAddress);
                return [...ethToJoin, ...ethToPool];
            }
            return []; // sends back an empty array [] if not eth base
        }))();
        /**
         * BUILD CALL DATA ARRAY
         * */
        const calls = [
            ...permitCallData,
            /* addETh calldata */
            ...addEthCallData,
            /**
             * Provide liquidity by BUYING :
             * */
            {
                operation: types_1.LadleActions.Fn.TRANSFER,
                args: [_base.address, _series.poolAddress, _amount],
                ignoreIf: method !== types_1.AddLiquidityType.BUY || isEthBase, // ignore if not BUY and POOL or isETHbase
            },
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [
                    strategy.id || account,
                    account,
                    _fyTokenToBeMinted,
                    minRatio,
                    maxRatio,
                ],
                fnName: types_1.RoutedActions.Fn.MINT_WITH_BASE,
                targetContract: _series.poolContract,
                ignoreIf: method !== types_1.AddLiquidityType.BUY, // ignore if not BUY and POOL
            },
            /**
             * Provide liquidity by BORROWING:
             * */
            {
                operation: types_1.LadleActions.Fn.BUILD,
                args: [_series.id, _base.proxyId, '0'],
                ignoreIf: method !== types_1.AddLiquidityType.BORROW ? true : !!matchingVaultId, // ignore if not BORROW and POOL
            },
            /* Note: two transfers */
            {
                operation: types_1.LadleActions.Fn.TRANSFER,
                args: [_base.address, _base.joinAddress, _baseToFyToken],
                ignoreIf: method !== types_1.AddLiquidityType.BORROW || isEthBase,
            },
            {
                operation: types_1.LadleActions.Fn.TRANSFER,
                args: [_base.address, _series.poolAddress, _baseToPoolWithSlippage],
                ignoreIf: method !== types_1.AddLiquidityType.BORROW || isEthBase,
            },
            {
                operation: types_1.LadleActions.Fn.POUR,
                args: [
                    matchingVaultId || utils_1.BLANK_VAULT,
                    _series.poolAddress,
                    _baseToFyToken,
                    _baseToFyToken,
                ],
                ignoreIf: method !== types_1.AddLiquidityType.BORROW,
            },
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [strategy.id || account, account, minRatio, maxRatio],
                fnName: types_1.RoutedActions.Fn.MINT_POOL_TOKENS,
                targetContract: _series.poolContract,
                ignoreIf: method !== types_1.AddLiquidityType.BORROW,
            },
            /**
             *
             * STRATEGY TOKEN MINTING
             * for all AddLiquidity recipes that use strategy >
             * if strategy address is provided, and is found in the strategyMap, use that address
             *
             * */
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [account],
                fnName: types_1.RoutedActions.Fn.MINT_STRATEGY_TOKENS,
                targetContract: strategy.strategyContract,
                ignoreIf: !strategy,
            },
        ];
        console.log(txCode);
        (0, chainActions_1.transact)(calls, txCode, () => (0, observables_1.updateStrategies)([]));
    }));
});
exports.addLiquidity = addLiquidity;
//# sourceMappingURL=addLiquidity.js.map
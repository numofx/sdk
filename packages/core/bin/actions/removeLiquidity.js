"use strict";
/*
                                                                            +---------+  DEFUNCT PATH
                                                                       +--> |OPTION 2.1 |  ( unique call: SELL_FYTOKEN)
                                                                NEVER  |    +---------+
                                                                       |
                                 +------------------> sell Token supported
                                 |Y                                    |
                                 |                               Y/  N |    +--------------------+
               +------> FyTokenRecieved > Debt                        +--->|OPTION 2.2 (no trade) | (unique call:  none of others )
               |                 |                    +-----------+         +--------------------+
               |Y                +------------------> | OPTION 1  |
               |                  N                   +-----------+
               |                                             ( unique call: CLOSE_FROM_LADLE)
    +----> has Vault?
    |N         |        +--------+
    |          +------> |OPTION 4|.  ----------> (unique call: BURN_FOR_BASE )
is Mature?        N     +--------+
    |
    |
    |Y         +-----------+
    +--------->| OPTION 3  | (unique call: REDEEM )
               +-----------+
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeLiquidity = void 0;
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
const removeLiquidity = (amount, series, matchingVault, tradeFyToken = true) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    /* Subscribe to and get the values from the observables:  */
    (0, rxjs_1.combineLatest)([observables_1.protocolø, observables_1.assetsø, observables_1.accountø, observables_1.selectedø])
        .pipe((0, rxjs_1.take)(1)) // only take one and then finish.
        .subscribe(([{ ladle }, assetMap, account, selected]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        /* generate the reproducible txCode for tx tracking and tracing */
        const txCode = (0, utils_1.getProcessCode)(types_1.ActionCodes.REMOVE_LIQUIDITY, series.id);
        /* Get the values from the observables/subjects */
        const ladleAddress = ladle.address;
        const _base = assetMap.get(series.baseId);
        const _strategy = selected.strategy;
        const _amount = (0, yieldUtils_1.inputToTokenValue)(amount, _base.decimals);
        const [cachedBaseReserves, cachedFyTokenReserves] = yield series.poolContract.getCache();
        const cachedRealReserves = cachedFyTokenReserves.sub(series.totalSupply.big);
        const lpReceived = (0, math_1.burnFromStrategy)(_strategy.poolTotalSupply, _strategy.strategyTotalSupply, _amount);
        const [_baseTokenReceived, _fyTokenReceived] = (0, math_1.burn)(series.sharesReserves.big, series.fyTokenRealReserves.big, series.totalSupply.big, lpReceived);
        const _newPool = (0, math_1.newPoolState)(_baseTokenReceived.mul(-1), _fyTokenReceived.mul(-1), series.sharesReserves.big, series.fyTokenRealReserves.big, series.totalSupply.big);
        const fyTokenTrade = (0, math_1.sellFYToken)(_newPool.sharesReserves, _newPool.fyTokenVirtualReserves, _fyTokenReceived, series.getTimeTillMaturity(), series.ts, series.g2, series.decimals);
        // diagnostics && console.log('fyTokenTrade value: ', fyTokenTrade.toString());
        const fyTokenTradeSupported = fyTokenTrade.gt(ethers_1.ethers.constants.Zero);
        const matchingVaultId = matchingVault === null || matchingVault === void 0 ? void 0 : matchingVault.id;
        const _matchingVaultDebt = (matchingVault === null || matchingVault === void 0 ? void 0 : matchingVault.accruedArt.big) || utils_1.ZERO_BN;
        // Choose use use matching vault:
        const useMatchingVault = !!matchingVault && _matchingVaultDebt.gt(ethers_1.ethers.constants.Zero);
        // const useMatchingVault: boolean = !!matchingVault && ( _fyTokenReceived.lte(matchingVaultDebt) || !tradeFyToken) ;
        const [minRatio, maxRatio] = (0, math_1.calcPoolRatios)(cachedBaseReserves, cachedRealReserves);
        const fyTokenReceivedGreaterThanDebt = _fyTokenReceived.gt(_matchingVaultDebt); // i.e. debt below fytoken
        const extrafyTokenTrade = (0, math_1.sellFYToken)(series.sharesReserves.big, series.fyTokenReserves.big, _fyTokenReceived.sub(_matchingVaultDebt), series.getTimeTillMaturity(), series.ts, series.g2, series.decimals);
        /* if valid extraTrade > 0 and user selected to tradeFyToken */
        const extraTradeSupported = extrafyTokenTrade.gt(ethers_1.ethers.constants.Zero) && tradeFyToken;
        /* Diagnostics */
        //   diagnostics && console.log('Strategy: ', _strategy);
        //   diagnostics && console.log('Vault to use for removal: ', matchingVaultId);
        //   diagnostics && console.log('vaultDebt', matchingVaultDebt.toString());
        //   diagnostics && console.log(useMatchingVault);
        //   diagnostics && console.log('amount', _amount.toString());
        //   diagnostics && console.log('lpTokens recieved from strategy token burn:', lpReceived.toString());
        //   diagnostics && console.log('fyToken recieved from lpTokenburn: ', _fyTokenReceived.toString());
        //   diagnostics && console.log('Debt: ', matchingVaultDebt?.toString());
        //   diagnostics && console.log('Is FyToken Recieved Greater Than Debt: ', fyTokenReceivedGreaterThanDebt);
        //   diagnostics && console.log('Is FyToken tradable?: ', extraTradeSupported);
        //   diagnostics && console.log('extrafyTokentrade value: ', extrafyTokenTrade);
        const alreadyApprovedStrategy = _strategy
            ? (yield _strategy.strategyContract.allowance(account, ladleAddress)).gte(_amount)
            : false;
        const alreadyApprovedPool = !_strategy
            ? (yield series.poolContract.allowance(account, ladleAddress)).gte(_amount)
            : false;
        const isEthBase = assetsConfig_1.ETH_BASED_ASSETS.includes(_base.proxyId);
        const toAddress = isEthBase ? ladleAddress : account;
        const seriesIsMature = series.isMature();
        /* handle removeing eth BAse tokens:  */
        // NOTE: REMOVE ETH FOR ALL PATHS/OPTIONS (exit_ether sweeps all the eth out the ladle, so exact amount is not important -> just greater than zero)
        const removeEthCallData = isEthBase ? yield (0, _addRemoveEth_1.removeEth)(utils_1.ONE_BN) : [];
        const permitCallData = yield (0, chainActions_1.sign)([
            /* give strategy permission to sell tokens to pool */
            {
                target: _strategy,
                spender: 'LADLE',
                amount: _amount,
                ignoreIf: !_strategy || alreadyApprovedStrategy === true,
            },
            /* give pool permission to sell tokens */
            {
                target: {
                    address: series.poolAddress,
                    name: series.poolName,
                    version: series.poolVersion,
                    symbol: series.poolSymbol,
                },
                spender: 'LADLE',
                amount: _amount,
                ignoreIf: !!_strategy || alreadyApprovedPool === true,
            },
        ], txCode);
        // const unwrapping: ICallData[] = await unwrapAsset(_base, account)
        const calls = [
            ...permitCallData,
            /* FOR ALL REMOVES (when using a strategy) > move tokens from strategy to pool tokens  */
            {
                operation: types_1.LadleActions.Fn.TRANSFER,
                args: [_strategy.address, _strategy.address, _amount],
                ignoreIf: !_strategy,
            },
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [series.poolAddress],
                fnName: types_1.RoutedActions.Fn.BURN_STRATEGY_TOKENS,
                targetContract: _strategy ? _strategy.strategyContract : undefined,
                ignoreIf: !_strategy,
            },
            /* FOR ALL REMOVES NOT USING STRATEGY >  move tokens to poolAddress  : */
            {
                operation: types_1.LadleActions.Fn.TRANSFER,
                args: [series.poolAddress, series.poolAddress, _amount],
                ignoreIf: _strategy || seriesIsMature,
            },
            /**
             *
             * BEFORE MATURITY
             *
             * */
            /* OPTION 1. Remove liquidity and repay - BEFORE MATURITY + VAULT EXISTS + FYTOKEN<DEBT */
            // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
            // ladle.routeAction(pool, ['burn', [ladle, ladle, minBaseReceived, minFYTokenReceived]),
            // ladle.repayFromLadleAction(vaultId, receiver),
            // ladle.closeFromLadleAction(vaultId, receiver),
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [ladleAddress, ladleAddress, minRatio, maxRatio],
                fnName: types_1.RoutedActions.Fn.BURN_POOL_TOKENS,
                targetContract: series.poolContract,
                ignoreIf: seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
            },
            {
                operation: types_1.LadleActions.Fn.REPAY_FROM_LADLE,
                args: [matchingVaultId, toAddress],
                ignoreIf: seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
            },
            {
                operation: types_1.LadleActions.Fn.CLOSE_FROM_LADLE,
                args: [matchingVaultId, toAddress],
                ignoreIf: seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
            },
            /* OPTION 2.Remove liquidity, repay and sell - BEFORE MATURITY  + VAULT EXISTS + FYTOKEN>DEBT */
            // 2.1 doTrade 2.2 !doTrade
            // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
            // ladle.routeAction(pool, ['burn', [receiver, ladle, 0, 0]),
            // ladle.repayFromLadleAction(vaultId, pool),
            // ladle.routeAction(pool, ['sellBase', [receiver, minBaseReceived]),
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [toAddress, ladleAddress, minRatio, maxRatio],
                fnName: types_1.RoutedActions.Fn.BURN_POOL_TOKENS,
                targetContract: series.poolContract,
                ignoreIf: seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
            },
            {
                operation: types_1.LadleActions.Fn.REPAY_FROM_LADLE,
                args: [matchingVaultId, toAddress],
                ignoreIf: seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
            },
            /* OPTION 4. Remove Liquidity and sell  - BEFORE MATURITY +  NO VAULT */
            // 4.1
            // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
            // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [toAddress, minRatio, maxRatio],
                fnName: types_1.RoutedActions.Fn.BURN_FOR_BASE,
                targetContract: series.poolContract,
                ignoreIf: seriesIsMature || useMatchingVault || !fyTokenTradeSupported,
            },
            // 4.2
            // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
            // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [toAddress, account, minRatio, maxRatio],
                fnName: types_1.RoutedActions.Fn.BURN_POOL_TOKENS,
                targetContract: series.poolContract,
                ignoreIf: seriesIsMature || useMatchingVault || fyTokenTradeSupported,
            },
            /**
             *
             * AFTER MATURITY
             *
             * */
            /* OPTION 3. remove Liquidity and redeem  - AFTER MATURITY */ // FIRST CHOICE after maturity
            // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
            // ladle.routeAction(pool, ['burn', [receiver, fyToken, minBaseReceived, minFYTokenReceived]),
            // ladle.redeemAction(seriesId, receiver, 0),
            {
                operation: types_1.LadleActions.Fn.ROUTE,
                args: [toAddress, series.fyTokenAddress, minRatio, maxRatio],
                fnName: types_1.RoutedActions.Fn.BURN_POOL_TOKENS,
                targetContract: series.poolContract,
                ignoreIf: !seriesIsMature,
            },
            {
                operation: types_1.LadleActions.Fn.REDEEM,
                args: [series.id, toAddress, '0'],
                ignoreIf: !seriesIsMature,
            },
            ...removeEthCallData,
        ];
        (0, chainActions_1.transact)(calls, txCode);
    }));
});
exports.removeLiquidity = removeLiquidity;
//# sourceMappingURL=removeLiquidity.js.map
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

import { burnFromStrategy, burn, newPoolState, sellFYToken, calcPoolRatios } from '@numo-engine/math';
import { ethers, BigNumber } from 'ethers';
import { combineLatest, take } from 'rxjs';
import { sign, transact } from '../chainActions';
import { ETH_BASED_ASSETS } from '../config/assetsConfig';
import {
  accountø,
  assetsø,
  chainIdø,
  selectedø,
  protocolø,
} from '../observables';
import { ISeries, IVault, ActionCodes, IAsset, ICallData, LadleActions, RoutedActions } from '../types';
import { getProcessCode, ZERO_BN, ONE_BN } from '../utils';
import { inputToTokenValue } from '../utils/yieldUtils';
import { removeEth } from './_addRemoveEth';

export const removeLiquidity = async (
  amount: string,
  series: ISeries,
  matchingVault: IVault | undefined,
  tradeFyToken: boolean = true
) => {
  /* Subscribe to and get the values from the observables:  */
  combineLatest([protocolø, assetsø, accountø, selectedø])
    .pipe(take(1)) // only take one and then finish.
    .subscribe(async ([{ ladle }, assetMap, account, selected]) => {
      /* generate the reproducible txCode for tx tracking and tracing */
      const txCode = getProcessCode(ActionCodes.REMOVE_LIQUIDITY, series.id);

      /* Get the values from the observables/subjects */
      const ladleAddress = ladle.address;

      const _base: IAsset = assetMap.get(series.baseId)!;
      const _strategy: any = selected.strategy!;

      const _amount = inputToTokenValue(amount, _base.decimals);

      const [cachedBaseReserves, cachedFyTokenReserves] = await series.poolContract.getCache();
      const cachedRealReserves = cachedFyTokenReserves.sub(series.totalSupply.big);

      const lpReceived = burnFromStrategy(_strategy.poolTotalSupply!, _strategy.strategyTotalSupply!, _amount);

      const [_baseTokenReceived, _fyTokenReceived] = burn(
        series.sharesReserves.big,
        series.fyTokenRealReserves.big,
        series.totalSupply.big,
        lpReceived
      );

      const _newPool = newPoolState(
        _baseTokenReceived.mul(-1),
        _fyTokenReceived.mul(-1),
        series.sharesReserves.big,
        series.fyTokenRealReserves.big,
        series.totalSupply.big
      );

      const fyTokenTrade = sellFYToken(
        _newPool.sharesReserves,
        _newPool.fyTokenVirtualReserves,
        _fyTokenReceived,
        series.getTimeTillMaturity(),
        series.ts,
        series.g2,
        series.decimals
      );

      // diagnostics && console.log('fyTokenTrade value: ', fyTokenTrade.toString());
      const fyTokenTradeSupported = fyTokenTrade.gt(ethers.constants.Zero);

      const matchingVaultId: string | undefined = matchingVault?.id;
      const _matchingVaultDebt: BigNumber = matchingVault?.accruedArt.big || ZERO_BN;

      // Choose use use matching vault:
      const useMatchingVault: boolean = !!matchingVault && _matchingVaultDebt.gt(ethers.constants.Zero);
      // const useMatchingVault: boolean = !!matchingVault && ( _fyTokenReceived.lte(matchingVaultDebt) || !tradeFyToken) ;

      const [minRatio, maxRatio] = calcPoolRatios(cachedBaseReserves, cachedRealReserves);
      const fyTokenReceivedGreaterThanDebt: boolean = _fyTokenReceived.gt(_matchingVaultDebt); // i.e. debt below fytoken

      const extrafyTokenTrade: BigNumber = sellFYToken(
        series.sharesReserves.big,
        series.fyTokenReserves.big,
        _fyTokenReceived.sub(_matchingVaultDebt),
        series.getTimeTillMaturity(),
        series.ts,
        series.g2,
        series.decimals
      );
      /* if valid extraTrade > 0 and user selected to tradeFyToken */
      const extraTradeSupported = extrafyTokenTrade.gt(ethers.constants.Zero) && tradeFyToken;

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
        ? (await _strategy.strategyContract.allowance(account!, ladleAddress)).gte(_amount)
        : false;
      const alreadyApprovedPool = !_strategy
        ? (await series.poolContract.allowance(account!, ladleAddress)).gte(_amount)
        : false;

      const isEthBase = ETH_BASED_ASSETS.includes(_base.proxyId);
      const toAddress = isEthBase ? ladleAddress : account;

      const seriesIsMature = series.isMature();

      /* handle removeing eth BAse tokens:  */
      // NOTE: REMOVE ETH FOR ALL PATHS/OPTIONS (exit_ether sweeps all the eth out the ladle, so exact amount is not important -> just greater than zero)
      const removeEthCallData: ICallData[] = isEthBase ? await removeEth(ONE_BN) : [];

      const permitCallData: ICallData[] = await sign(
        [
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
        ],
        txCode
      );

      // const unwrapping: ICallData[] = await unwrapAsset(_base, account)

      const calls: ICallData[] = [
        ...permitCallData,

        /* FOR ALL REMOVES (when using a strategy) > move tokens from strategy to pool tokens  */
        {
          operation: LadleActions.Fn.TRANSFER,
          args: [_strategy.address, _strategy.address, _amount] as LadleActions.Args.TRANSFER,
          ignoreIf: !_strategy,
        },
        {
          operation: LadleActions.Fn.ROUTE,
          args: [series.poolAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
          fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
          targetContract: _strategy ? _strategy.strategyContract : undefined,
          ignoreIf: !_strategy,
        },

        /* FOR ALL REMOVES NOT USING STRATEGY >  move tokens to poolAddress  : */
        {
          operation: LadleActions.Fn.TRANSFER,
          args: [series.poolAddress, series.poolAddress, _amount] as LadleActions.Args.TRANSFER,
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
          operation: LadleActions.Fn.ROUTE,
          args: [ladleAddress, ladleAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
          fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
          targetContract: series.poolContract,
          ignoreIf: seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
        },
        {
          operation: LadleActions.Fn.REPAY_FROM_LADLE,
          args: [matchingVaultId, toAddress] as LadleActions.Args.REPAY_FROM_LADLE,
          ignoreIf: seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
        },
        {
          operation: LadleActions.Fn.CLOSE_FROM_LADLE,
          args: [matchingVaultId, toAddress] as LadleActions.Args.CLOSE_FROM_LADLE,
          ignoreIf: seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
        },

        /* OPTION 2.Remove liquidity, repay and sell - BEFORE MATURITY  + VAULT EXISTS + FYTOKEN>DEBT */

        // 2.1 doTrade 2.2 !doTrade

        // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
        // ladle.routeAction(pool, ['burn', [receiver, ladle, 0, 0]),
        // ladle.repayFromLadleAction(vaultId, pool),
        // ladle.routeAction(pool, ['sellBase', [receiver, minBaseReceived]),
        {
          operation: LadleActions.Fn.ROUTE,
          args: [toAddress, ladleAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
          fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
          targetContract: series.poolContract,
          ignoreIf: seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
        },
        {
          operation: LadleActions.Fn.REPAY_FROM_LADLE,
          args: [matchingVaultId, toAddress] as LadleActions.Args.REPAY_FROM_LADLE,
          ignoreIf: seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
        },

        /* OPTION 4. Remove Liquidity and sell  - BEFORE MATURITY +  NO VAULT */

        // 4.1
        // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
        // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
        {
          operation: LadleActions.Fn.ROUTE,
          args: [toAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_FOR_BASE,
          fnName: RoutedActions.Fn.BURN_FOR_BASE,
          targetContract: series.poolContract,
          ignoreIf: seriesIsMature || useMatchingVault || !fyTokenTradeSupported,
        },

        // 4.2
        // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
        // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
        {
          operation: LadleActions.Fn.ROUTE,
          args: [toAddress, account, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
          fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
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
          operation: LadleActions.Fn.ROUTE,
          args: [toAddress, series.fyTokenAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
          fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
          targetContract: series.poolContract,
          ignoreIf: !seriesIsMature,
        },
        {
          operation: LadleActions.Fn.REDEEM,
          args: [series.id, toAddress, '0'] as LadleActions.Args.REDEEM,
          ignoreIf: !seriesIsMature,
        },

        ...removeEthCallData,
      ];

      transact(calls, txCode);
    });
};

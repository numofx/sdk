import { calculateSlippage, fyTokenForMint, calcPoolRatios, splitLiquidity } from '@numo-engine/math';
import { ethers, BigNumber } from 'ethers';
import { combineLatest, take } from 'rxjs';
import { sign, transact } from '../chainActions';
import { ETH_BASED_ASSETS } from '../config/assetsConfig';
import {
  accountø,
  assetsø,
  chainIdø,
  seriesø,
  strategiesø,
  userSettingsø,
  vaultsø,
  protocolø,
  updateStrategies,
} from '../observables';
import {
  IStrategy,
  AddLiquidityType,
  IVault,
  ActionCodes,
  ISeries,
  IAsset,
  ICallData,
  LadleActions,
  RoutedActions,
} from '../types';
import { getProcessCode, ONE_BN, BLANK_VAULT } from '../utils';
import { inputToTokenValue } from '../utils/yieldUtils';
import { addEth } from './_addRemoveEth';

export const addLiquidity = async (
  amount: string,
  strategy: IStrategy,
  method: AddLiquidityType = AddLiquidityType.BUY,
  matchingVault: IVault | undefined = undefined
) => {
  /* Subscribe to and get the values from the observables:  */
  combineLatest([protocolø, assetsø, seriesø, accountø, userSettingsø, vaultsø, strategiesø])
    .pipe(take(1)) // only take one and then finish.
    .subscribe(async ([{ ladle }, assetMap, seriesMap, account, { slippageTolerance }]) => {
      /* Get the values from the observables/subjects */
      const ladleAddress = ladle.address;

      // /** use the strategy/ strategy address provided, else use selected Strategy TODO: Add a check for existing vault */
      // const _strategy: IStrategy | undefined = strategy && (strategy as IStrategy).id ? strategy : strategyMap.get(strategy as string);
      // const strategyId: string = _strategy ? _strategy.id : '';

      const _series: ISeries = seriesMap.get(strategy!.currentSeriesId)!;
      const _base: IAsset = assetMap.get(_series?.baseId!)!;

      const txCode = getProcessCode(ActionCodes.ADD_LIQUIDITY, strategy.id);

      const matchingVaultId: string | undefined = matchingVault ? matchingVault.id : undefined;
      const _amount = inputToTokenValue(amount, _base?.decimals);

      const _amountLessSlippage = calculateSlippage(_amount, slippageTolerance.toString(), true);

      const [cachedBaseReserves, cachedFyTokenReserves] = await _series?.poolContract.getCache()!;
      const cachedRealReserves = cachedFyTokenReserves.sub(_series?.totalSupply.big.sub(ONE_BN));

      const [_fyTokenToBeMinted] = fyTokenForMint(
        cachedBaseReserves,
        cachedRealReserves,
        cachedFyTokenReserves,
        _amountLessSlippage,
        _series.getTimeTillMaturity(),
        _series.ts,
        _series.g1,
        _series.decimals,
        slippageTolerance
      );

      const [minRatio, maxRatio] = calcPoolRatios(cachedBaseReserves, cachedRealReserves);

      const [_baseToPool, _baseToFyToken] = splitLiquidity(
        cachedBaseReserves,
        cachedRealReserves,
        _amountLessSlippage,
        true
      ) as [BigNumber, BigNumber];

      const _baseToPoolWithSlippage = BigNumber.from(calculateSlippage(_baseToPool, slippageTolerance.toString()));

      /* if approveMAx, check if signature is still required */
      const alreadyApproved = (await _base.getAllowance(account!, ladleAddress)).gte(_amount);

      /* if ethBase */
      const isEthBase = ETH_BASED_ASSETS.includes(_base.proxyId);

      /* DIAGNOSITCS */
      console.log(
        'input: ',
        _amount.toString(),
        'inputLessSlippage: ',
        _amountLessSlippage.toString(),
        'base: ',
        cachedBaseReserves.toString(),
        'real: ',
        cachedRealReserves.toString(),
        'virtual: ',
        cachedFyTokenReserves.toString(),
        '>> baseSplit: ',
        _baseToPool.toString(),

        '>> fyTokenSplit: ',
        _baseToFyToken.toString(),

        '>> baseSplitWithSlippage: ',
        _baseToPoolWithSlippage.toString(),

        '>> minRatio',
        minRatio.toString(),
        '>> maxRatio',
        maxRatio.toString(),
        'matching vault id',
        matchingVaultId
      );

      /**
       * GET SIGNTURE/APPROVAL DATA
       * */
      const permitCallData: ICallData[] = await sign(
        [
          {
            target: _base,
            spender: ladleAddress,
            amount: _amount,
            ignoreIf: alreadyApproved === true,
          },
        ],
        txCode
      );

      /* if  Eth base, build the correct add ethCalls */
      const addEthCallData = await ( async () => {
        /* BUY send WETH to  poolAddress */
        if (isEthBase && method === AddLiquidityType.BUY) return await addEth(_amount, _series.poolAddress);
        /* BORROW send WETH to both basejoin and poolAddress */
        if (isEthBase && method === AddLiquidityType.BORROW) {
          const ethToJoin = await addEth(_baseToFyToken, _base.joinAddress);
          const ethToPool = await addEth(_baseToPoolWithSlippage, _series.poolAddress);
          return [ ...ethToJoin, ...ethToPool];
        }
        return []; // sends back an empty array [] if not eth base
      })();

      /**
       * BUILD CALL DATA ARRAY
       * */
      const calls: ICallData[] = [
        ...permitCallData,

        /* addETh calldata */
        ...addEthCallData,

        /**
         * Provide liquidity by BUYING :
         * */

        {
          operation: LadleActions.Fn.TRANSFER,
          args: [_base.address, _series.poolAddress, _amount] as LadleActions.Args.TRANSFER,
          ignoreIf: method !== AddLiquidityType.BUY || isEthBase, // ignore if not BUY and POOL or isETHbase
        },
        {
          operation: LadleActions.Fn.ROUTE,
          args: [
            strategy.id || account, // NOTE GOTCHA: receiver is _strategyAddress (if it exists) or else account
            account,
            _fyTokenToBeMinted,
            minRatio,
            maxRatio,
          ] as RoutedActions.Args.MINT_WITH_BASE,
          fnName: RoutedActions.Fn.MINT_WITH_BASE,
          targetContract: _series.poolContract,
          ignoreIf: method !== AddLiquidityType.BUY, // ignore if not BUY and POOL
        },

        /**
         * Provide liquidity by BORROWING:
         * */
        {
          operation: LadleActions.Fn.BUILD,
          args: [_series.id, _base.proxyId, '0'] as LadleActions.Args.BUILD,
          ignoreIf: method !== AddLiquidityType.BORROW ? true : !!matchingVaultId, // ignore if not BORROW and POOL
        },

        /* Note: two transfers */
        {
          operation: LadleActions.Fn.TRANSFER,
          args: [_base.address, _base.joinAddress, _baseToFyToken] as LadleActions.Args.TRANSFER,
          ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
        },
        {
          operation: LadleActions.Fn.TRANSFER,
          args: [_base.address, _series.poolAddress, _baseToPoolWithSlippage] as LadleActions.Args.TRANSFER,
          ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
        },

        {
          operation: LadleActions.Fn.POUR,
          args: [
            matchingVaultId || BLANK_VAULT,
            _series.poolAddress,
            _baseToFyToken,
            _baseToFyToken,
          ] as LadleActions.Args.POUR,
          ignoreIf: method !== AddLiquidityType.BORROW,
        },
        {
          operation: LadleActions.Fn.ROUTE,
          args: [strategy.id || account, account, minRatio, maxRatio] as RoutedActions.Args.MINT_POOL_TOKENS,
          fnName: RoutedActions.Fn.MINT_POOL_TOKENS,
          targetContract: _series.poolContract,
          ignoreIf: method !== AddLiquidityType.BORROW,
        },

        /**
         *
         * STRATEGY TOKEN MINTING
         * for all AddLiquidity recipes that use strategy >
         * if strategy address is provided, and is found in the strategyMap, use that address
         *
         * */
        {
          operation: LadleActions.Fn.ROUTE,
          args: [account] as RoutedActions.Args.MINT_STRATEGY_TOKENS,
          fnName: RoutedActions.Fn.MINT_STRATEGY_TOKENS,
          targetContract: strategy.strategyContract,
          ignoreIf: !strategy,
        },
      ];

      console.log( txCode )

      transact(calls, txCode, ()=>updateStrategies([]) );
    });
};

import { buyBase, calculateSlippage } from '@numo-engine/math';
import { ethers } from 'ethers';
import { combineLatest, take } from 'rxjs';
import { sign, transact } from '../chainActions';
import {
  accountø,
  assetsø,
  chainIdø,
  userSettingsø,
  protocolø,
} from '../observables';
import { ISeries, ActionCodes, IAsset, ICallData, LadleActions, RoutedActions } from '../types';
import { getProcessCode } from '../utils';
import { inputToTokenValue } from '../utils/yieldUtils';

export const rollLend = async (amount: string | undefined, fromSeries: ISeries, toSeries: ISeries) => {
  /* Subscribe to and get the values from the observables:  */
  combineLatest([protocolø, assetsø, accountø, userSettingsø])
    .pipe(take(1)) // only take one and then finish.
    .subscribe(
      async ([
        { ladle },
        assetMap,
        account,
        { slippageTolerance },
      ]) => {
        /* generate the reproducible txCode for tx tracking and tracing */
        const txCode = getProcessCode(ActionCodes.ROLL_POSITION, fromSeries.id);

        /* Get the values from the observables/subjects */
        const ladleAddress = ladle.address;

        const base: IAsset = assetMap.get(fromSeries.baseId)!;
        const _amount = inputToTokenValue(amount, base.decimals);

        const seriesIsMature = fromSeries.isMature();

        const _fyTokenValueOfInput = seriesIsMature
          ? _amount
          : buyBase(
              fromSeries.sharesReserves.big,
              fromSeries.fyTokenReserves.big,
              _amount,
              fromSeries.getTimeTillMaturity(),
              fromSeries.ts,
              fromSeries.g2,
              fromSeries.decimals
            );

        console.log(_fyTokenValueOfInput.toString());

        const _minimumFYTokenReceived = calculateSlippage(_fyTokenValueOfInput, slippageTolerance.toString(), true);
        const alreadyApproved = (await fromSeries.fyTokenContract.allowance(account!, ladleAddress)).gte(_amount);

        const permitCallData: ICallData[] = await sign(
          [
            {
              target: fromSeries,
              spender: 'LADLE',
              amount: _fyTokenValueOfInput,
              ignoreIf: alreadyApproved === true,
            },
          ],
          txCode
        );

        /* Reciever of transfer (based on maturity) the series maturity */
        const transferToAddress = () => {
          if (seriesIsMature) return fromSeries.fyTokenAddress;
          return fromSeries.poolAddress;
        };

        const calls: ICallData[] = [
          ...permitCallData,

          {
            operation: LadleActions.Fn.TRANSFER,
            args: [fromSeries.fyTokenAddress, transferToAddress(), _fyTokenValueOfInput] as LadleActions.Args.TRANSFER,
            ignoreIf: false, // never ignore
          },

          /* BEFORE MATURITY */
          {
            operation: LadleActions.Fn.ROUTE,
            args: [toSeries.poolAddress, ethers.constants.Zero] as RoutedActions.Args.SELL_FYTOKEN,
            fnName: RoutedActions.Fn.SELL_FYTOKEN,
            targetContract: fromSeries.poolContract,
            ignoreIf: seriesIsMature,
          },
          {
            operation: LadleActions.Fn.ROUTE,
            args: [account, _minimumFYTokenReceived] as RoutedActions.Args.SELL_BASE,
            fnName: RoutedActions.Fn.SELL_BASE,
            targetContract: toSeries.poolContract,
            ignoreIf: seriesIsMature,
          },

          /* AFTER MATURITY */
          {
            // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
            operation: LadleActions.Fn.REDEEM,
            args: [fromSeries.id, toSeries.poolAddress, _fyTokenValueOfInput] as LadleActions.Args.REDEEM,
            ignoreIf: !seriesIsMature,
          },
          {
            // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
            operation: LadleActions.Fn.ROUTE,
            args: [account, _minimumFYTokenReceived] as RoutedActions.Args.SELL_BASE,
            fnName: RoutedActions.Fn.SELL_BASE,
            targetContract: toSeries.poolContract,
            ignoreIf: !seriesIsMature,
          },
        ];

        transact(calls, txCode);
      }
    );
};

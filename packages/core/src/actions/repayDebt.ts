import { maxBaseIn, sellBase, secondsToFrom, calculateSlippage } from '@numo-engine/math';
import { ethers } from 'ethers';
import { ETH_BASED_ASSETS, CONVEX_BASED_ASSETS } from '../config/assetsConfig';
import { ConvexJoin__factory } from '@numo-engine/contracts';
import { IVault, ActionCodes, ISeries, IAsset, ICallData, LadleActions, RoutedActions } from '../types';
import { ZERO_BN, ONE_BN } from '../utils/constants';
import { getProcessCode, inputToTokenValue } from '../utils/yieldUtils';

import { sign } from '../chainActions/sign';
import { transact } from '../chainActions/transact';

import { removeEth, addEth } from './_addRemoveEth';
import { unwrapAsset } from './_wrapUnwrapAsset';

import {
  accountø,
  assetsø,
  chainIdø,
  providerø,
  seriesø,
  userSettingsø,
  protocolø,
  updateSeries,
  updateVaults,
} from '../observables';
import { combineLatest, filter, map, take } from 'rxjs';

/**
 * REPAY FN
 * @param vault
 * @param amount
 * @param reclaimCollateral
 */
export const repayDebt = async (amount: string | undefined, vault: IVault, reclaimCollateral: boolean = true) => {
  /* Subscribe to and get the values from the observables:  */
  combineLatest([protocolø, assetsø, seriesø, accountø, userSettingsø, providerø])
    .pipe(
      filter(() => !!vault ),
      take(1) // only take one and then finish.
    ) 
    .subscribe(async ([{ ladle }, assetMap, seriesMap, account, { slippageTolerance }, provider]) => {
      
      const txCode = getProcessCode(ActionCodes.REPAY, vault.id);
      const ladleAddress = ladle.address;
      const series: ISeries = seriesMap.get(vault.seriesId)!;
      const base: IAsset = assetMap.get(vault.baseId)!;
      const ilk: IAsset = assetMap.get(vault.ilkId)!;

      const isEthCollateral = ETH_BASED_ASSETS.includes(vault.ilkId);
      const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

      /* is convex-type collateral */
      const isConvexCollateral = CONVEX_BASED_ASSETS.includes(ilk.proxyId);

      // TODO: this is a bit of an anti-pattern ?? 
      const convexJoinContract = ConvexJoin__factory.connect(ilk.joinAddress, provider);

      /* Parse amounts */
      const _amount = inputToTokenValue(amount, base.decimals);

      const _maxBaseIn = maxBaseIn(
        series.sharesReserves.big,
        series.fyTokenReserves.big,
        series.getTimeTillMaturity(),
        series.ts,
        series.g1,
        series.decimals
      );

      /* Check the max amount of the trade that the pool can handle */
      const tradeIsNotPossible = _amount.gt(_maxBaseIn);

      const _amountAsFyToken = series.isMature()
        ? _amount
        : sellBase(
            series.sharesReserves.big,
            series.fyTokenReserves.big,
            _amount,
            secondsToFrom(series.maturity.toString()),
            series.ts,
            series.g1,
            series.decimals
          );
      const _amountAsFyTokenWithSlippage = calculateSlippage(
        _amountAsFyToken,
        slippageTolerance.toString(),
        true // minimize
      );

      /* Check if amount is more than the debt */
      const amountGreaterThanEqualDebt: boolean = ethers.BigNumber.from(_amountAsFyToken).gte(vault.accruedArt.big);

      /* If requested, and all debt will be repaid, automatically remove collateral */
      const _collateralToRemove =
        reclaimCollateral && amountGreaterThanEqualDebt ? vault.ink.big.mul(-1) : ethers.constants.Zero;

      /* Cap the amount to transfer: check that if amount is greater than debt, used after maturity only repay the max debt (or accrued debt) */
      const _amountCappedAtArt = vault.art.big.gt(ZERO_BN) && vault.art.big.lte(_amount) ? vault.art.big : _amount;

      /* Set the amount to transfer ( + 0.1% after maturity ) */
      const amountToTransfer = series.isMature() ? _amount.mul(10001).div(10000) : _amount; // After maturity + 0.1% for increases during tx time

      /* In low liq situations/or mature,  send repay funds to join not pool */
      const transferToAddress = tradeIsNotPossible || series.isMature() ? base.joinAddress : series.poolAddress;

      /* Check if already apporved */
      const alreadyApproved = (await base.getAllowance(account!, ladleAddress)).gte(amountToTransfer);

      // const wrapAssetCallData : ICallData[] = await wrapAsset(ilk, account!);
      const unwrapAssetCallData: ICallData[] = reclaimCollateral ? await unwrapAsset(ilk, account!) : [];

      const permitCallData: ICallData[] = await sign(
        [
          {
            // before maturity
            target: base,
            spender: ladleAddress,
            amount: amountToTransfer.mul(110).div(100), // generous approval permits on repayment we can refine at a later stage
            ignoreIf: alreadyApproved === true,
          },
        ],
        txCode
      );

      /* Remove ETH collateral. (exit_ether sweeps all the eth out of the ladle, so exact amount is not importnat -> just greater than zero) */
      const removeEthCallData = isEthCollateral ? await removeEth(ONE_BN) : [];

      /* Address to send the funds to either ladle (if eth is used as collateral) or account */
      const reclaimToAddress = () => {
        if (isEthCollateral) return ladleAddress;
        if (unwrapAssetCallData.length && ilk.unwrapHandlerAddress)
          return ilk.unwrapHandlerAddress; // if there is somethign to unwrap
        return account;
      };

      const addEthCallData = await ( async () => {
        if ( isEthBase ) {
          const to = series.isMature() ? undefined : transferToAddress
          const ethToAddr = await addEth( amountToTransfer, to)
          return ethToAddr
        }
        return [];
      } )();


      const calls: ICallData[] = [
        ...permitCallData,

        /* Reqd. when we have a wrappedBase */
        // ...wrapAssetCallData

        /* If ethBase, Send ETH to either base join or pool  */
        ...addEthCallData,

        // ...addEth(isEthBase && !series.isMature() ? amountToTransfer : ZERO_BN, transferToAddress), // destination = either join or series depending if tradeable
        // ...addEth(isEthBase && series.isMature() ? amountToTransfer : ZERO_BN), // no destination defined after maturity , amount +1% will will go to weth join

        /* Else, Send Token to either join or pool via a ladle.transfer() */
        {
          operation: LadleActions.Fn.TRANSFER,
          args: [base.address, transferToAddress, amountToTransfer] as LadleActions.Args.TRANSFER,
          ignoreIf: isEthBase,
        },

        /* BEFORE MATURITY - !series.seriesIsMature */
        /* convex-type collateral; ensure checkpoint before giving collateral back to account */
        {
          operation: LadleActions.Fn.ROUTE,
          args: [vault.owner] as RoutedActions.Args.CHECKPOINT,
          fnName: RoutedActions.Fn.CHECKPOINT,
          targetContract: convexJoinContract, // use the convex join contract to checkpoint
          ignoreIf: !isConvexCollateral || _collateralToRemove.eq(ethers.constants.Zero),
        },

        {
          operation: LadleActions.Fn.REPAY,
          args: [vault.id, account, ethers.constants.Zero, _amountAsFyTokenWithSlippage] as LadleActions.Args.REPAY,
          ignoreIf: series.isMature() || amountGreaterThanEqualDebt || tradeIsNotPossible,
        },
        {
          operation: LadleActions.Fn.REPAY_VAULT,
          args: [vault.id, reclaimToAddress(), _collateralToRemove, _amount] as LadleActions.Args.REPAY_VAULT,
          ignoreIf:
            series.isMature() ||
            !amountGreaterThanEqualDebt || // ie ignore if use if amount IS NOT more than debt
            tradeIsNotPossible,
        },

        /* EdgeCase in lowLiq situations : Input GreaterThanMaxbaseIn ( user incurs a penalty because repaid at 1:1 ) */
        {
          operation: LadleActions.Fn.CLOSE,
          args: [
            vault.id,
            reclaimToAddress(),
            _collateralToRemove,
            _amountCappedAtArt.mul(-1),
          ] as LadleActions.Args.CLOSE,
          ignoreIf: series.isMature() || !tradeIsNotPossible, // (ie. ignore if trade IS possible )
        },

        /* AFTER MATURITY  - series.seriesIsMature */
        {
          operation: LadleActions.Fn.CLOSE,
          args: [
            vault.id,
            reclaimToAddress(),
            _collateralToRemove,
            _amountCappedAtArt.mul(-1),
          ] as LadleActions.Args.CLOSE,
          ignoreIf: !series.isMature(),
        },
        ...removeEthCallData,
        ...unwrapAssetCallData,
      ];

      /* finally transact, and send in update series as a callback */
      transact(calls, txCode, () => { updateVaults([vault]); updateSeries([series])}  );
    });
};

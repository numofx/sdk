import { buyBase, calculateMinCollateral, decimalNToDecimal18, maxFyTokenIn } from '@numo-engine/math';
import { BigNumber } from 'ethers';
import { combineLatest, filter, map, Observable } from 'rxjs';
import { assetPairsø, selectedø } from '../observables';
import { MessageType, sendMsg } from '../observables/messages';
import { W3bNumber } from '../types';
import { ZERO_BN } from '../utils';
import { ZERO_W3B } from '../utils/constants';
import { bnToW3bNumber, getAssetPairId } from '../utils/yieldUtils';
import { borrowInputø, repayInputø } from './input';

/**
 * Maximum amount of debt allowed by the protocol for a particular [[IAssetPair | Asset Pair]]
 * @category Borrow
 * */
export const maxDebtLimitø: Observable<W3bNumber> = combineLatest([selectedø, assetPairsø]).pipe(
  /* only proceed if pairMap has the reqd info */
  filter(([selected, pairMap]) => pairMap.has(getAssetPairId(selected.base!.id, selected.ilk!.id))),
  /* return the max debt of the asset pair */
  map(([selected, pairMap]) => {
    const assetPair = selected.base && selected.ilk && pairMap.get(getAssetPairId(selected.base.id, selected.ilk.id));
    console.log('Max: ', assetPair?.maxDebtLimit.toString());
    return assetPair?.maxDebtLimit || ZERO_W3B;
  })
);

/**
 * Minimum amount of debt allowed by the protocol ( Dust level ) for a particular [[IAssetPair | Asset Pair]]
 * @category Borrow
 * */
export const minDebtLimitø: Observable<W3bNumber> = combineLatest([selectedø, assetPairsø]).pipe(
  /* only let events proceed if pairMap has the reqd info */
  filter(([selected, pairMap]) => pairMap.has(getAssetPairId(selected.base!.id, selected.ilk!.id))),
  /* return the min required debt of the asset pair */
  map(([selected, pairMap]) => {
    const assetPair = selected.base && selected.ilk && pairMap.get(getAssetPairId(selected.base.id, selected.ilk.id));
    console.log('Min: ', assetPair?.minDebtLimit.toString());
    return assetPair?.minDebtLimit || ZERO_W3B;
  })
);

/**
 * Check if the user can borrow the specified [[borrowInputø | amount]] based on current protocol sharesReserves
 * @category Borrow
 * */
export const isBorrowPossibleø: Observable<boolean> = combineLatest([borrowInputø, selectedø]).pipe(
  map(([input, selected]) => {
    if (selected.series! && input.big.gt(ZERO_BN) && input.big.lte(selected.series.sharesReserves.big)) return true;
    
    input.big.gt(ZERO_BN) &&
      sendMsg({
        message: 'Not enough liquidity in the pool.',
        type: MessageType.WARNING,
        origin: 'borrowInput',
      });
      
    return false;
  })
);

/**
 *  TODO:  Check if the particular borrow [[borrowInputø | amount]] is limited by the liquidity in the protocol
 * @category Borrow
 * */
export const isBorrowLimitedø: Observable<boolean> = combineLatest([borrowInputø, selectedø]).pipe(
  map(([input, selected]) => {
    console.log(input, selected);
    return false;
  })
);

/**
 * Check if the user can roll the selected vault to a new [future] series
 * @category Borrow | Roll
 * */
export const isRollVaultPossibleø: Observable<boolean> = combineLatest([selectedø, assetPairsø]).pipe(
  /* only let events proceed if futureSeries and vault, and has a validasset pair has the reqd info */
  filter(([selected, assetPairMap]) => {
    const { vault, futureSeries } = selected;
    /* check if everythign required exists */
    return !!vault && !!futureSeries && assetPairMap.has(getAssetPairId(vault!.baseId, vault!.ilkId));
  }),
  map(([selected, assetPairMap]) => {
    /* Note: Because of the filter above we can safetly assume futureSeries & vault and pairinfo are defined. (!) */
    const { futureSeries, vault } = selected;
    const pairInfo = assetPairMap.get(getAssetPairId(vault!.baseId, vault!.ilkId));

    /*  IF there is ZERO DEBT the vault is always rollable  > so shortcut out this function */
    if (vault!.accruedArt.big.eq(ZERO_BN)) return true;

    const _maxFyTokenIn = maxFyTokenIn(
      futureSeries!.sharesReserves.big,
      futureSeries!.fyTokenReserves.big,
      futureSeries!.getTimeTillMaturity(),
      futureSeries!.ts,
      futureSeries!.g2,
      futureSeries!.decimals
    );

    const newDebt = buyBase(
      futureSeries!.sharesReserves.big,
      futureSeries!.fyTokenReserves.big,
      vault!.accruedArt.big,
      futureSeries!.getTimeTillMaturity(),
      futureSeries!.ts,
      futureSeries!.g2,
      futureSeries!.decimals
    ) as BigNumber;

    const _minCollat = calculateMinCollateral(
      pairInfo!.pairPrice.big,
      newDebt,
      pairInfo!.minRatio.toString(),
      undefined
    ) as BigNumber;

    // conditions for allowing rolling
    const areRollConditionsMet =
      vault!.accruedArt.big.lt(_maxFyTokenIn) &&
      decimalNToDecimal18(vault!.ink.big, vault!.ilkDecimals).gt(_minCollat) &&
      vault!.accruedArt.big.gt(pairInfo!.minDebtLimit.big);
    return areRollConditionsMet;
  })
);

/**  TODO:
 *
 * Check if the particular repay [input] is limited by the liquidity in the protocol
 * @category Borrow | Repay
 *  */
export const isRepayLimitedø: Observable<boolean> = combineLatest([repayInputø, selectedø]).pipe(
  map(([input, selected]) => {
    console.log(input, selected);
    return false;
  })
);

/**
 * Calculate how much debt will be remaining after successful repayment of [input]
 * @category Borrow | Repay
 */
export const debtAfterRepayø: Observable<W3bNumber> = combineLatest([repayInputø, selectedø]).pipe(
  map(([input, { vault }]) => {
    if (vault!.accruedArt.big.sub(input.big).gte(ZERO_BN)) {
      const x_ = vault!.accruedArt.big.sub(input.big);
      return bnToW3bNumber(x_, vault?.baseDecimals!);
    }
    return ZERO_W3B;
  })
);

/**
 * Calculate the expected NEW debt @ maturity ( any exisiting debt + new debt )  previously 'borrowEstimate'
 * @category Borrow
 * */
export const debtEstimateø: Observable<W3bNumber> = combineLatest([borrowInputø, selectedø]).pipe(
  // simple filter out input changes that are zero, and make sure there is a series selected.
  filter(([borrowInput, selected]) => borrowInput.big.gt(ZERO_BN) && !!selected.series),
  map(([input, selected]) => {
    const { series, vault } = selected!;
    const estimate = buyBase(
      series!.sharesReserves.big,
      series!.fyTokenReserves.big,
      input.big,
      series!.getTimeTillMaturity(),
      series!.ts,
      series!.g1,
      series!.decimals
    ) as BigNumber;

    const artPlusEstimate = vault && vault.accruedArt.big.gt(ZERO_BN) ? vault.accruedArt.big.add(estimate) : estimate
    return bnToW3bNumber(artPlusEstimate, vault?.baseDecimals! )
  })
);

/**
 * Maximum amount that can be repayed (limited by: either the max tokens owned OR max debt available )
 * @category Borrow | Repay
 * */
export const maximumRepayø: Observable<W3bNumber> = combineLatest([selectedø]).pipe(
  map(([selected]) => {
    if (selected.base?.balance && selected.vault?.accruedArt.big.gt(selected.base!.balance.big)) {
      sendMsg({
        message: `The max repayment amount is limited by the accounts ${selected.base?.symbol} token balance.`,
        type: MessageType.WARNING,
      });
      return selected.base!.balance;
    } else {
      sendMsg({ message: 'All debt can be repaid.', type: MessageType.INFO });
      return selected.vault!.accruedArt;
    }
  })
);

/**
 * Min amount that can be repayed (limited by assetPair dustlevels/minDebt )
 * @category Borrow | Repay
 * */
export const minimumRepayø: Observable<W3bNumber> = combineLatest([selectedø, minDebtLimitø, maximumRepayø]).pipe(
  map(([selected, minLimit, maxRepay]) => {
    const { vault } = selected;

    /* Set the min repayable, as the maximum value that can be paid without going below the dust limit */
    const min = vault!.accruedArt.big.gt(minLimit.big) ? maxRepay.big.sub(minLimit.big) : vault?.accruedArt.big;

    return bnToW3bNumber(min || ZERO_BN, vault?.baseDecimals!);
  })
);

/** TODO:  Maximum amount that can be rolled  ( NOTE : Not NB for now because we are only rolling entire [vaults] )
 * @category Borrow | Repay
 */
export const maximumRollø: Observable<W3bNumber> = selectedø.pipe(
  /* only do calcs if there is a future series selected */
  map(() => {
    /* The maximum amount rollable is the maxfyTokenIn or art (if art is less than the max FyToken In  )  */
    // const maxRoll =  vault!.accruedArt.lt(_maxFyTokenIn) ? vault!.accruedArt : _maxFyTokenIn;
    return ZERO_W3B;
  })
);

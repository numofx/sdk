import { maxBaseIn, sellBase, sellFYToken } from '@numo-engine/math';
import { combineLatest, filter, map, Observable } from 'rxjs';
import { selectedø } from '../observables';
import { W3bNumber } from '../types';
import { ZERO_BN } from '../utils';
import { ZERO_W3B } from '../utils/constants';
import { bnToW3bNumber } from '../utils/yieldUtils';
import { closeInputø, lendInputø } from './input';

// TODO: apy,

/**
 * Get the maximum lendable to the protocol based on selected series
 * @category Lend
 * */
export const maximumLendø: Observable<W3bNumber> = selectedø.pipe(
  map(({ series, base }) => {
    if (!!series && base) {
      /* checks the protocol limits  (max Base allowed in ) */
      const _maxBaseIn = maxBaseIn(
        series.sharesReserves.big,
        series.fyTokenReserves.big,
        series.getTimeTillMaturity(),
        series.ts,
        series.g1,
        series.decimals
      );
      return base.balance.big.lt(_maxBaseIn)
        ? base.balance
        : bnToW3bNumber(_maxBaseIn, base?.decimals!, base?.digitFormat);
    }
    /* In the odd case that no series is selected, the return zero as max lend */
    return ZERO_W3B;
  })
);

/**
 * Flag indicating if lending is limited by the protocol based on both account blaance ( and possibly input? )
 * @category Lend
 * */
export const isLendingLimitedø: Observable<boolean> = combineLatest([maximumLendø, selectedø]).pipe(
  map(([maxLend, { base }]) => {
    // if (input.gt(maxLend)) return true;
    if (base?.balance.big.gt(maxLend.big)) return true;
    return false;
  })
);

/**
 * Maximum allowable when closing a lending posiiton
 * @category Lend | Close
 * */
export const maximumCloseø: Observable<W3bNumber> = selectedø.pipe(
  map(({ series }) => {
    /* If the series is mature, simply sned back the fyToken value (always closable) */
    if (series && series.isMature()) return series.fyTokenBalance!;
    /* else process */
    const value = sellFYToken(
      series!.sharesReserves.big,
      series!.fyTokenReserves.big,
      series!.fyTokenBalance?.big || ZERO_BN,
      series!.getTimeTillMaturity(),
      series!.ts,
      series!.g2,
      series!.decimals
    );
    const baseReservesWithMargin = series!.sharesReserves.big.mul(9999).div(10000); // TODO: figure out why we can't use the base reserves exactly (margin added to facilitate transaction)

    /* If the trade isn't possible, set the max close as total base reserves */
    if (value.lte(ZERO_BN) && series!.fyTokenBalance?.big.gt(series!.sharesReserves.big))
      return bnToW3bNumber(baseReservesWithMargin, series?.decimals!);
    if (value.lte(ZERO_BN)) return ZERO_W3B;
    /* else, closing is not limited so return the trade value */
    return bnToW3bNumber(value, series?.decimals!);
  })
);

/**
 * Predicted Base Value at maturity based on the [[input]] provided.
 * @category Lend
 * */
export const lendValueAtMaturityø: Observable<W3bNumber> = combineLatest([lendInputø, selectedø]).pipe(
  map(([input, { series }]) => {
    const { sharesReserves, fyTokenReserves } = series!;
    const valueAtMaturity = sellBase(
      sharesReserves.big,
      fyTokenReserves.big,
      input.big,
      series!.getTimeTillMaturity(),
      series!.ts,
      series!.g1,
      series!.decimals
    );
    return  bnToW3bNumber(valueAtMaturity, series?.decimals!);
  })
);

/**
 * Get the base value of the existing lending position. i.e. the CURRENT base value of the fyTokens held by the user
 * @category Lend
 * */
export const lendPostionValueø: Observable<W3bNumber> = selectedø.pipe(
  map(({ series }) => {
    /* If the series is mature, simply send back the fyToken value (always closable) */
    if (series && series.isMature()) return series.fyTokenBalance!;
    /* else process */
    const value = sellFYToken(
      series!.sharesReserves.big,
      series!.fyTokenReserves.big,
      series!.fyTokenBalance?.big || ZERO_BN,
      series!.getTimeTillMaturity(),
      series!.ts,
      series!.g2,
      series!.decimals
    );
    // TODO: check this flow... shoudl we return ZERO. I think so, because if a trade is not possible the value IS 0.
    return value.lte(ZERO_BN) ? ZERO_W3B : bnToW3bNumber(value, series?.decimals!);
  })
);

/**
 * Maximum rollable base
 * @category Lend | Roll
 * */
export const maximumLendRollø: Observable<W3bNumber> = selectedø.pipe(
  /* only do calcs if there is a future series selected */
  filter((selected) => !!selected.futureSeries && !!selected.series),
  map(({ futureSeries, series }) => {
    const _maxBaseIn = maxBaseIn(
      futureSeries!.sharesReserves.big,
      futureSeries!.fyTokenReserves.big,
      futureSeries!.getTimeTillMaturity(),
      futureSeries!.ts,
      futureSeries!.g1,
      futureSeries!.decimals
    );

    const _fyTokenValue = series!.isMature()
      ? series!.fyTokenBalance?.big || ZERO_BN
      : sellFYToken(
          series!.sharesReserves.big,
          series!.fyTokenReserves.big,
          series!.fyTokenBalance?.big || ZERO_BN,
          series!.getTimeTillMaturity(),
          series!.ts,
          series!.g2,
          series!.decimals
        );

    /* if the protocol is limited return the max rollab as the max base in */
    if (_maxBaseIn.lte(_fyTokenValue)) return bnToW3bNumber(_maxBaseIn, series?.decimals!);
    /* else */
    return bnToW3bNumber( _fyTokenValue, series?.decimals!);
  })
);

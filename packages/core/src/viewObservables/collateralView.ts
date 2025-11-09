import {
  decimalNToDecimal18,
  buyBase,
  calculateCollateralizationRatio,
  calculateMinCollateral,
  calcLiquidationPrice,
} from '@numo-engine/math';
import { BigNumber } from 'ethers';
import { combineLatest, distinctUntilChanged, filter, map, Observable, share, withLatestFrom } from 'rxjs';
import { selectedø } from '../observables';
import { ONE_BN, ZERO_BN } from '../utils';
import { bnToW3bNumber, getAssetPairId, ratioToPercent } from '../utils/yieldUtils';
import { assetPairsø } from '../observables/assetPairs';
import { borrowInputø, collateralInputø } from './input';

import { appConfigø } from '../observables/appConfig';
import { W3bNumber } from '../types';
import { ZERO_W3B } from '../utils/constants';

/**
 * INTERNAL:
 * Keeps the track of the current selectedPair
 * */
const _selectedPairø = combineLatest([selectedø, assetPairsø]).pipe(
  map(([selected, pairMap]) => {
    if (!!selected.ilk && !!selected.base) {
      const _pairId = getAssetPairId(selected.base.id, selected.ilk.id);
      return pairMap.get(_pairId);
    }
    return undefined;
  }),
  share()
);

/**
 * INTERNAL:
 *
 * Tracks the total DEBT value based on input
 * returns decimal18 vals for math calcs
 *
 * RETURNS [ totalDebt, exisitingDebt ] in decimals18
 */
const _totalDebtWithInputø: Observable<BigNumber[]> = combineLatest([borrowInputø, selectedø]).pipe(
  filter( ([ ,{series}]) => !!series ),
  distinctUntilChanged( ([a],[b]) => a===b ), // this is a check so that the observable isn't 'doubled up' with the same input value.
  withLatestFrom(appConfigø ),
  map(([[debtInput, selected], config]) => {
    const { vault, series } = selected; // we can safetly assume 'series' is defined - not vault.
    const existingDebt_ = vault?.accruedArt.big || ZERO_BN;
    /* NB NOTE: this whole function ONLY deals with decimal18, existing values are converted to decimal18 */
    const existingDebtAsWei = decimalNToDecimal18(existingDebt_, series!.decimals);
    const newDebt = debtInput.big.gt(ZERO_BN)
      ? buyBase(
          series!.sharesReserves.big,
          series!.fyTokenReserves.big,
          debtInput.big,
          series!.getTimeTillMaturity(),
          series!.ts,
          series!.g2,
          series!.decimals
        )
      : ZERO_BN;
    const newDebtAsWei = decimalNToDecimal18(newDebt, series!.decimals);
    const totalDebt = existingDebtAsWei.add(newDebtAsWei);

    config.diagnostics && console.log('Total Debt (d18): ', totalDebt.toString());

    return [totalDebt, existingDebtAsWei]; // as decimal18
  }),
  share()
);

/**
 * INTERNAL:
 *
 * Return the total collateral value
 * NOTE: this function ONLY deals with decimal18, existing values are converted to decimal18
 *
 * returns decimal18 vals for math calcs
 *
 * RETURNS [ totalCollateral, exisitingCollateral] in decimals18 for comparative calcs
 */
const _totalCollateralWithInputø: Observable<BigNumber[]> = combineLatest([collateralInputø, selectedø]).pipe(
  filter( ([ ,{ilk}]) => !!ilk ),
  distinctUntilChanged( ([a],[b]) => a===b ),
  withLatestFrom(appConfigø),
  map(([[collInput, selected], config]) => {
    const { vault, ilk } = selected;
    if (ilk) {
      const existingCollateral_ = vault?.ink.big || ZERO_BN; // if no vault simply return zero.
      const existingCollateralAsWei = decimalNToDecimal18(existingCollateral_, ilk.decimals);

      /* TODO: there is a weird bug if inputting before selecting ilk. */
      const newCollateralAsWei = decimalNToDecimal18(collInput.big, ilk.decimals);
      const totalCollateral = existingCollateralAsWei.add(newCollateralAsWei);
      appConfigø.subscribe( ({diagnostics}) => diagnostics && console.log('Total Collateral (d18): ', totalCollateral.toString()))
      return [totalCollateral, existingCollateralAsWei]; // as decimal18
    }
    config.diagnostics && console.warn('Hey fren. Make sure an Ilk is selected!')
    return [];
  }),
  share()
);

/**
 * The PREDICTED collateralization ratio based on the current INPUT expressed as a ratio
 * @category Borrow | Collateral
 * */
export const collateralizationRatioø: Observable<number | undefined> = combineLatest([
  _totalDebtWithInputø,
  _totalCollateralWithInputø,
  _selectedPairø,
]).pipe(
  // distinctUntilChanged( ([a1,a2],[b1, b2]) => a1===b1 && a2===b2 ),
  withLatestFrom(appConfigø),
  map(([[totalDebt, totalCollat, assetPair], config]) => {
    if (
      /* if all the elements exist and are greater than 0 */
      totalCollat[0]?.gt(ZERO_BN) &&
      totalDebt[0]?.gt(ZERO_BN) &&
      !!assetPair
    ) {
      /* NOTE: this function ONLY deals with decimal18, existing values are converted to decimal18 */
      const pairPriceInWei = decimalNToDecimal18(assetPair.pairPrice.big, assetPair.baseDecimals);
      const ratio = calculateCollateralizationRatio(totalCollat[0], pairPriceInWei, totalDebt[0], false);
      config.diagnostics && console.log('Collateralisation ratio:', ratio);
      return ratio;
    }
    return undefined;
  }),
  share()
);

/**
 * The PREDICTED collateralization based on the current INPUT parameters expressed as a PERCENTAGE
 * ( for display )
 * @category Borrow | Collateral
 * */
export const collateralizationPercentø: Observable<number> = collateralizationRatioø.pipe(
  map((ratio) => ratioToPercent(ratio!, 2)),
  share()
);

/**
 * The minimum protocol allowed collaterallisation level expressed as a ratio
 * @category Borrow | Collateral
 * */
export const minCollateralizationRatioø = _selectedPairø.pipe(
  /* Only emit if assetPair exists */
  filter((assetPair) => !!assetPair),
  /* filtered: we can safelty assume assetPair is defined in here. */
  map((assetPair) => assetPair!.minRatio),
  share()
);

/**
 * The minimum protocol-allowed collaterallisation level expressed as a percentage
 * ( for display )
 * @category Borrow | Collateral
 * */
export const minCollateralizationPercentø: Observable<number> = minCollateralizationRatioø.pipe(
  map((ratio) => ratioToPercent(ratio, 2)),
  share()
);

/**
 * Check if the debt amount is undercollaterallized
 * @category Borrow | Collateral
 * */
export const isUndercollateralizedø: Observable<boolean> = combineLatest([
  collateralizationRatioø,
  minCollateralizationRatioø,
]).pipe(
  map(([ratio, minRatio]) => ratio! <= minRatio),
  share()
);

/**
 * Check if the collateraillization level of a vault is consdired 'unhealthy'
 * @category Borrow | Collateral
 * */
export const isUnhealthyCollateralizationø: Observable<boolean> = combineLatest([
  collateralizationRatioø,
  selectedø,
  minCollateralizationRatioø,
]).pipe(
  filter(([, { vault }]) => !!vault),
  map(([ratio, { vault }, minRatio]) => {
    if (vault?.accruedArt.big.lte(ZERO_BN)) return false;
    return ratio! < minRatio + 0.2;
  }),
  share()
);

/**
 * The minimum collateral required to meet the minimum protocol-allowed levels
 * @category Borrow | Collateral
 * */
export const minCollateralRequiredø: Observable<W3bNumber> = combineLatest([
  _selectedPairø,
  minCollateralizationRatioø,
  _totalDebtWithInputø,
  _totalCollateralWithInputø,
]).pipe(
  map(([assetPair, minCollatRatio, totalDebt, totalCollat]) => {
    const _pairPriceInWei = decimalNToDecimal18(assetPair!.pairPrice.big, assetPair!.baseDecimals);
    const _calcMin = calculateMinCollateral(_pairPriceInWei, totalDebt[0], minCollatRatio!.toString(), totalCollat[1])
    return bnToW3bNumber(_calcMin, assetPair?.baseDecimals! );
  }),
  share()
);

/**
 *  Minimum Safe collatearalization level expressed asa ratio
 *  TODO: would this be better specified with the assetPair data? - possibly
 * @category Borrow | Collateral
 * */
export const minimumSafeRatioø: Observable<number> = minCollateralizationRatioø.pipe(
  map((minRatio: number) => {
    if (minRatio >= 1.5) return minRatio + 1; // eg. 150% -> 250%
    if (minRatio < 1.5 && minRatio >= 1.4) return minRatio + 0.65; // eg. 140% -> 200%
    if (minRatio < 1.4 && minRatio > 1.1) return minRatio + 0.1; // eg. 133% -> 143%
    return minRatio; // eg. 110% -> 110%
  }),
  share()
);

/**
 *  Minimum Safe collatearalization level expressed as a percentage
 * @category Borrow | Collateral
 * */
export const minimumSafePercentø: Observable<number> = minimumSafeRatioø.pipe(
  map((ratio) => ratioToPercent(ratio, 2)),
  share()
);

/**
 * Maximum collateral based selected Ilk and users balance
 * @category Borrow | Collateral
 */
export const maxCollateralø: Observable<W3bNumber> = selectedø.pipe(
  map( (selectedø) =>  selectedø.ilk ? selectedø.ilk.balance : ZERO_W3B ),
  share()
);

/**
 * Calculate the maximum amount of collateral that can be removed
 * without leaving the vault undercollateralised
 * @category Borrow | Collateral
 * */
export const maxRemovableCollateralø: Observable<W3bNumber> = combineLatest([
  selectedø,
  _totalCollateralWithInputø,
  minCollateralRequiredø,
]).pipe(
  map(([{vault}, totalCollat, minReqd]) => {
    if (vault) {
      const tot_ = vault.accruedArt.big.gt(minReqd.big) ? totalCollat[1].sub(ONE_BN) : totalCollat[1];
      return bnToW3bNumber( tot_, vault.baseDecimals )
    }
    return ZERO_W3B;
  }),
  share()
);

/**
 * Price at which the vault will get liquidated
 * @category Borrow | Collateral
 * */
export const vaultLiquidatePriceø: Observable<String|undefined> = combineLatest([selectedø, _selectedPairø]).pipe(
  filter(([selected, pairInfo]) => !!selected.vault && !!pairInfo),
  map(([selected, pairInfo]) =>
    calcLiquidationPrice(selected.vault!.ink.hStr, selected.vault!.accruedArt.hStr, pairInfo!.minRatio)
  ),
  share()
);

/**
 * Pre Transaction estimated Price at which a vault / pair  will get liquidated
 * based on collateral and debt INPUT ( and existing colalteral and debt)
 * @category Borrow | Collateral
 * */
export const estimatedLiquidatePriceø: Observable<String|undefined> = combineLatest([
  _totalDebtWithInputø,
  _totalCollateralWithInputø,
  _selectedPairø,
]).pipe(
  filter(([, pairInfo]) => !!pairInfo),
  map(([ink, art, pairInfo]) => calcLiquidationPrice(ink[0].toString(), art[0].toString(), pairInfo!.minRatio)),
  share()
);

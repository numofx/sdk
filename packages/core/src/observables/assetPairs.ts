import { bytesToBytes32, decimal18ToDecimalN } from '@numo-engine/math';
import { BigNumber, ethers } from 'ethers';
import { BehaviorSubject, filter, first, lastValueFrom, map, Observable, share, shareReplay, withLatestFrom } from 'rxjs';

import { ORACLE_INFO} from '../config';
import { IAssetPair } from '../types';
import { WAD_BN } from '../utils';
import { protocolø } from './protocol';
import { selectedø } from './selected';
import { bnToW3bNumber, getAssetPairId } from '../utils/yieldUtils';
import { chainIdø } from './connection';

const assetPairMap$: BehaviorSubject<Map<string, IAssetPair>> = new BehaviorSubject(new Map([]));
export const assetPairsø: Observable<Map<string, IAssetPair>> = assetPairMap$.pipe(shareReplay(1));

/**
 *
 * Watch selected elements, on every change if both a base and ilk are selected,
 * and they don't already exist in the assetPairMap, update them.
 * 
 * */
selectedø
  .pipe(
    withLatestFrom(chainIdø),
    /* Only handle events that have both a selected base and ilk, and are NOT already in the assetPairMap */
    filter(([sel]) => {
      const bothBaseAndIlkSelected = !!sel.base && !!sel.ilk;
      const mapHasPair = sel.base && sel.ilk && assetPairMap$.value.has(getAssetPairId(sel.base.id, sel.ilk!.id));
      // mapHasPair && console.log ( 'Selected base and asset already in map');
      return bothBaseAndIlkSelected === true && mapHasPair === false;
    }),
    map(([selected, chainId]) => {
      return { base: selected.base, ilk: selected.ilk, chainId };
    })
  )
  .subscribe(({ base, ilk, chainId }) => updatePair(base?.id!, ilk?.id!, chainId));

/* Update Assets function */
export const updatePair = async (baseId: string, ilkId: string, chainId: number): Promise<IAssetPair | null> => {

  const protocol = await lastValueFrom(protocolø.pipe(first()));

  const { cauldron, assetRootMap, oracleMap } = protocol;
  const oracleName = ORACLE_INFO.get(chainId)?.get(baseId)?.get(ilkId);

  const PriceOracle = oracleMap.get(oracleName!);
  const base = assetRootMap.get(baseId);
  const ilk = assetRootMap.get(ilkId);

  // console.log('Fetching Asset Pair Info: ', bytesToBytes32(baseId, 6), bytesToBytes32(ilkId, 6));

  /* if all the parts are there update the pairInfo */
  if (cauldron && PriceOracle && base && ilk) {
    // updateState({ type: PriceState.START_PAIR_FETCH, payload: pairId });
    const pairId = getAssetPairId(base!.id, ilk!.id);

    // /* Get debt params and spot ratios */
    const [{ max, min, sum, dec }, { ratio }] = await Promise.all([
      cauldron.debt(baseId, ilkId),
      cauldron.spotOracles(baseId, ilkId),
    ]);

    /* Get pricing if available */
    let price: BigNumber;
    try {
      // eslint-disable-next-line prefer-const
      [price] = await PriceOracle.peek(
        bytesToBytes32(ilkId, 6),
        bytesToBytes32(baseId, 6),
        decimal18ToDecimalN(WAD_BN, ilk.decimals!)
      );
    } catch (error) {
      price = ethers.constants.Zero;
    }

    const minDebtLimit_ = BigNumber.from(min).mul(BigNumber.from('10').pow(dec));
    const maxDebtLimit_ = max.mul(BigNumber.from('10').pow(dec));

    const newPair: IAssetPair = {
      id: pairId,
      baseId,
      ilkId,
      limitDecimals: dec,
      minDebtLimit:  bnToW3bNumber(minDebtLimit_, base.decimals, base.digitFormat), // NB use limit decimals here > might not be same as base/ilk decimals
      maxDebtLimit:  bnToW3bNumber(maxDebtLimit_, base.decimals, base.digitFormat), // NB use limit decimals here > might not be same as base/ilk decimals
      pairTotalDebt: bnToW3bNumber( sum, base.decimals, base.digitFormat ) ,
      pairPrice: bnToW3bNumber(price, base.decimals, base.digitFormat) , // value of 1 ilk (1x10**n) in terms of base.
      minRatio: parseFloat(ethers.utils.formatUnits(ratio, 6)), // pre-format ratio
      baseDecimals: base.decimals!,
      ilkDecimals: ilk.decimals!,
      oracle: oracleName || '',
    };

    /* update the assetPairMap */
    assetPairMap$.next(assetPairMap$.value.set(pairId, newPair));
    // console.log('New Asset Pair Info: ', newPair);

    /* return the new pair so we don't have to go looking for it again after assetpairMap has been updated */
    return newPair;
  }

  /* if no cauldron, base or ilk, or priceOracle return null */
  return null;
};

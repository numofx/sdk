import { bytesToBytes32, calcAccruedDebt } from '@numo-engine/math';
import { ethers, BigNumber } from 'ethers';
import {
  BehaviorSubject,
  Observable,
  shareReplay,
  lastValueFrom,
  first,
  combineLatest,
  filter,
  withLatestFrom,
} from 'rxjs';
import { buildVaultMap } from '../buildProtocol/initVaults';
import { IVault, IVaultRoot, MessageType, IYieldProtocol, ISeries } from '../types';
import { ZERO_BN } from '../utils';
import { bnToW3bNumber, dateFromMaturity } from '../utils/yieldUtils';
import { appConfigø } from './appConfig';
import { accountø, chainIdø, providerø } from './connection';
import { sendMsg } from './messages';
import { protocolø } from './protocol';

const vaultMap$: BehaviorSubject<Map<string, IVault>> = new BehaviorSubject(new Map([]));
export const vaultsø: Observable<Map<string, IVault>> = vaultMap$.pipe(shareReplay(1));

/* Update vaults function */
export const updateVaults = async (vaultList?: IVault[] | IVaultRoot[], suppressEventLogQueries: boolean = false) => {
  const account = await lastValueFrom(accountø.pipe(first()));
  const protocol = await lastValueFrom(protocolø.pipe(first()));
  const appConfig = await lastValueFrom(appConfigø.pipe(first()));
  const provider = await lastValueFrom(providerø.pipe(first()));
  const chainId = await lastValueFrom(chainIdø.pipe(first()));

  const list =
    vaultList !== undefined
      ? vaultList
      : Array.from((await buildVaultMap(protocol, provider, account!, chainId, appConfig)).values()); // : Array.from(vaultMap$.value.values());

  /* if there are some vaults: */
  if (list.length && account) {
    await Promise.all(
      list.map(async (_vault: IVault | IVaultRoot) => {
        const vaultUpdate = await _updateVault(_vault, account, protocol, suppressEventLogQueries);
        vaultMap$.next(new Map(vaultMap$.value.set(_vault.id, vaultUpdate))); // note: new Map to enforce ref update
      })
    );
  } else {
    /* if the list is empty, return an empty vaultMap */
    vaultMap$.next(new Map([]));
  }
};

/**
 *  Observe protocolø and accountø changes TOGETHER >  Initiate OR Empty VAULT Map
 * */
combineLatest([accountø, protocolø])
  // only emit if account is defined and yp.cauldron adress exists - indicating protocol has mostly loaded
  .pipe(
    filter(([a, yp]) => a !== undefined && yp.cauldron.address !== ''),
    withLatestFrom(chainIdø, appConfigø, providerø)
  )
  .subscribe(async ([[account, protocol], chainId, appConfig, provider]) => {
    if (account !== undefined) {
      console.log('Getting vaults for: ', account);
      const vaultMap = await buildVaultMap(protocol, provider, account, chainId, appConfig);
      await updateVaults(Array.from(vaultMap.values()), appConfig.suppressEventLogQueries);
      console.log('Vaults loading complete.');
      sendMsg({ message: 'Vaults Loaded', type: MessageType.INTERNAL, id: 'vaultsLoaded' });
    } else {
      /* if account changes and is undefined > EMPTY the vaultMap */
      vaultMap$.next(new Map([]));
    }
  });

const _updateVault = async (
  vault: IVault | IVaultRoot,
  account: string,
  protocol: IYieldProtocol,
  suppressEventLogQueries: boolean
): Promise<IVault> => {
  const { seriesRootMap, cauldron, witch, oracleMap } = protocol;
  const RateOracle = oracleMap.get('RateOracle') as ethers.Contract;

  /* Get dynamic vault data */
  const [
    { ink, art },
    { owner, seriesId, ilkId }, // Update balance and series (series - because a vault can have been rolled to another series) */
    liquidations, // Get the list of liquidations on this vault - unless supressed
  ] = await Promise.all([
    cauldron.balances(vault.id),
    cauldron.vaults(vault.id),
    suppressEventLogQueries
      ? []
      : witch.queryFilter(witch.filters.Auctioned(bytesToBytes32(vault.id, 12), null), 'earliest', 'latest'),
  ]);

  /* Check for liquidation event date */
  const liquidationDate = liquidations.length ? liquidations[0].args.start.toNumber() : undefined;

  /* check if the series is mature - Note: calc'd from protocol.seriesMap instead of relying on seriesMap$ observations */
  const series = seriesRootMap.get(seriesId) as ISeries;
  /* Note: If the series is 'ignored' in the appConfig (or undefined) > the series maturity will be considered 'mature' */
  const seriesIsMature = series ? series.maturity - Math.round(new Date().getTime() / 1000) <= 0 : true;

  let accruedArt: BigNumber = art;
  let rateAtMaturity: BigNumber = BigNumber.from('1');
  let rate: BigNumber = BigNumber.from('1');

  if (series && seriesIsMature) {
    rateAtMaturity = await cauldron.ratesAtMaturity(seriesId);
    [rate] = await RateOracle.peek(
      bytesToBytes32(vault.baseId, 6),
      '0x5241544500000000000000000000000000000000000000000000000000000000', // bytes for 'RATE'
      '0'
    );
    [accruedArt] = rateAtMaturity.gt(ZERO_BN)
      ? calcAccruedDebt(rate, rateAtMaturity, art)
      : calcAccruedDebt(rate, rate, art);
  }

  return {
    ...vault,
    owner, // refreshed in case owner has been updated
    isActive: owner === account, // refreshed in case owner has been updated
    seriesId, // refreshed in case seriesId has been updated
    ilkId, // refreshed in case ilkId has been updated

    ink: bnToW3bNumber(ink, vault.ilkDecimals),
    art: bnToW3bNumber(art, vault.baseDecimals),
    accruedArt: bnToW3bNumber(accruedArt, vault.baseDecimals),

    underLiquidation: witch.address === owner, // check if witch is the owner (in liquidation process)
    hasBeenLiquidated: !!liquidationDate, // TODO redundant ??
    liquidationDate,
    liquidationDate_: liquidationDate ? dateFromMaturity(liquidationDate, 'dd MMMM yyyy').display : undefined,

    rateAtMaturity: bnToW3bNumber(rateAtMaturity, 18, 2),
    rate: bnToW3bNumber(rate, 18, 2),
  };
};

import { BehaviorSubject, combineLatest, filter, Observable, share, shareReplay, withLatestFrom } from 'rxjs';
import { BigNumber, ethers } from 'ethers';
import {
  sellFYToken,
  secondsToFrom,
  calculateAPR,
  floorDecimal,
  mulDecimal,
  divDecimal,
  ZERO_BN,
} from '@numo-engine/math';

import request from 'graphql-request';

import * as contracts from '@numo-engine/contracts';

import { ISeries, ISeriesRoot, MessageType } from '../types';
import { accountø, providerø } from './connection';
import { protocolø } from './protocol';
import { ETH_BASED_ASSETS } from '../config/assetsConfig';
import { sendMsg } from './messages';
import { bnToW3bNumber, ZERO_W3B } from '../utils/yieldUtils';

const seriesMap$: BehaviorSubject<Map<string, ISeries>> = new BehaviorSubject(new Map([]));
/**
 * SeriesMap observable and update function.
 */
export const seriesø: Observable<Map<string, ISeries>> = seriesMap$.pipe(shareReplay(1));

export const updateSeries = async (seriesList?: ISeries[], account?: string, accountDataOnly: boolean = false) => {
  const list = seriesList?.length ? seriesList : Array.from(seriesMap$.value.values());
  await Promise.all(
    list.map(async (series: ISeries) => {
      /* if account data only, just return the series */
      const seriesUpdate = accountDataOnly ? series : await _updateSeriesInfo(series);
      /* if account provided, append account data */
      const seriesUpdateAll = account ? await _updateSeriesAccountInfo(seriesUpdate, account) : seriesUpdate;
      seriesMap$.next(new Map(seriesMap$.value.set(series.id, seriesUpdateAll))); // note: new Map to enforce ref update
    })
  );
};

/**
 * Observe protocolø changes, if protocol changes in any way, update series map accordingly
 * */
combineLatest([protocolø, providerø])
  .pipe(
    filter(([protocol]) => protocol.seriesRootMap.size > 0),
    withLatestFrom(accountø)
  )
  .subscribe(async ([[_protocol, _provider], _account]) => {
    /* 'Charge' all the series (using the current provider) */
    const chargedList = Array.from(_protocol.seriesRootMap.values()).map((_series: ISeriesRoot) =>
      _chargeSeries(_series, _provider)
    );
    /* Update the series with dynamic/user data */
    await updateSeries(chargedList, _account);

    console.log('Series loading complete.');
    sendMsg({ message: 'Series Loaded.', type: MessageType.INTERNAL, id: 'seriesLoaded' });
  });

/**
 * Observe Accountø changes ('update dynamic/User Data')
 * */
accountø.pipe(withLatestFrom(seriesø)).subscribe(async ([account, seriesMap]) => {
  if (account && seriesMap.size) {
    await updateSeries(Array.from(seriesMap.values()), account, true);
    console.log('Series updated with new account info.');
    sendMsg({ message: 'Series account info updated.', type: MessageType.INTERNAL, origin: 'seriesMap' });
  }
});

// /**
//  * Set some event listeners on the fytoken contract for the account
//  * */
//  combineLatest([protocolø, accountø ]).subscribe(([protocol, account] ) => {
//   if ( account ) {
//     /* subscribe for updates */
//       console.log( 'Adding in lisneter here', protocol.seriesRootMap )
//   // } else if ( seriesMap.size > 0  ) {
//   //   /* unsubscribe */
//   //   console.log( 'removing lisneter here ')
//   } else {
//     console.log( 'asdasd')
//   }
//  })

/**
 * Internal Functions
 * */
/* Add on extra/calculated SERIES info, contract instances and methods (no async calls) */
const _chargeSeries = (series: ISeriesRoot, provider: ethers.providers.BaseProvider): ISeries => {
  /* contracts need to be added in again in when charging because the cached state only holds strings */
  const poolContract = contracts.Pool__factory.connect(series.poolAddress, provider);
  const fyTokenContract = contracts.FYToken__factory.connect(series.fyTokenAddress, provider);
  return {
    ...series,

    /* live contracts */
    poolContract,
    fyTokenContract,

    /**
     *
     * attach the various built-in functions required (can't be cached yet)
     *
     * */
    getTimeTillMaturity: () => '0', //  series.maturity - Math.round(new Date().getTime() / 1000),
    isMature: () => series.maturity - Math.round(new Date().getTime() / 1000) <= 0,

    /* pre-set the allowance fns */
    getFyTokenAllowance: async (acc: string, spender: string) => fyTokenContract.allowance(acc, spender),
    getPoolAllowance: async (acc: string, spender: string) => poolContract.allowance(acc, spender),

    /* initialise all the dynamic fields to zero/false */
    sharesReserves: ZERO_W3B,
    fyTokenReserves: ZERO_W3B,
    fyTokenRealReserves: ZERO_W3B,
    totalSupply: ZERO_W3B,
    apr: `0`,
    seriesIsMature: false,
    c: ZERO_BN,
    mu: ZERO_BN,
    poolAPY: undefined,
    showSeries: false,

    getShares: () => ZERO_BN,
    getBase: () => ZERO_BN,
  };
};

/**
 *
 * Dynamic asset info not related to a user
 *
 * */
const _updateSeriesInfo = async (series: ISeries): Promise<ISeries> => {
  /* Get all the data simultanenously in a promise.all */
  const [baseReserves, fyTokenReserves, totalSupply, fyTokenRealReserves] = await Promise.all([
    series.poolContract.getBaseBalance(),
    series.poolContract.getFYTokenBalance(),
    series.poolContract.totalSupply(),
    series.fyTokenContract.balanceOf(series.poolAddress),
  ]);

  let sharesReserves: BigNumber ;
  let currentSharePrice: BigNumber;

  let c: BigNumber | undefined ;
  let mu: BigNumber | undefined ;
  let sharesTokenAddress: string | undefined ;

  /* TODO remove this try catch - maybe explicitly reintrouce pool type? */ 
  try {
    [sharesReserves, c, mu, currentSharePrice, sharesTokenAddress] = await Promise.all([
      series.poolContract.getSharesBalance(),
      series.poolContract.getC(),
      series.poolContract.mu(),
      series.poolContract.getCurrentSharePrice(),
      series.poolContract.sharesToken(),
    ]);
  } catch {
    sharesReserves = baseReserves;
    currentSharePrice = ethers.utils.parseUnits('1', series.decimals);
    console.log('Adding a Non-TV pool contract that does not include c, mu, and shares');
  }

  //   // convert base amounts to shares amounts (baseAmount is wad)
  //   const getShares = (baseAmount: BigNumber) =>
  //   toBn(
  //     new Decimal(baseAmount.toString()).mul(10 ** series.decimals).div(new Decimal(currentSharePrice.toString()))
  //   );
  const getShares = (baseAmount: BigNumber) => baseAmount.mul(10**series.decimals).div( currentSharePrice );

  // // convert shares amounts to base amounts
  // const getBase = (sharesAmount: BigNumber) =>
  //   toBn(
  //     new Decimal(sharesAmount.toString())
  //       .mul(new Decimal(currentSharePrice.toString()))
  //       .div(10 ** series.decimals)
  //   );
  const getBase = (sharesAmount: BigNumber) => sharesAmount.mul( currentSharePrice).div(10**series.decimals);

  const rateCheckAmount = ethers.utils.parseUnits(
    ETH_BASED_ASSETS.includes(series.baseId) ? '.001' : '1',
    series.decimals
  );

  /* Calculates the base/fyToken unit selling price */
  const _sellRate = sellFYToken(
    sharesReserves,
    fyTokenReserves,
    rateCheckAmount,
    secondsToFrom(series.maturity.toString()),
    series.ts,
    series.g2,
    series.decimals
  );

  const apr = calculateAPR(floorDecimal(_sellRate), rateCheckAmount, series.maturity) || '0';

  // fetch the euler eToken supply APY from their subgraph
  const poolAPY =  sharesTokenAddress ? await getPoolAPY(sharesTokenAddress) : undefined;

  const seriesIsMature = series.isMature();
  const showSeries = true; // add logic to display particlaur series groups if required

  return {
    ...series,
    sharesReserves: bnToW3bNumber(sharesReserves, series.decimals),
    fyTokenReserves: bnToW3bNumber(fyTokenReserves, series.decimals),
    fyTokenRealReserves: bnToW3bNumber(fyTokenRealReserves, series.decimals),
    totalSupply: bnToW3bNumber(totalSupply, series.decimals),
    apr: `${Number(apr).toFixed(2)}`,

    seriesIsMature,
    showSeries,

    c,
    mu,

    poolAPY,

    getShares,
    getBase,
  };
};

/**
 *
 * Dynamic series info with a user
 *
 * */
const _updateSeriesAccountInfo = async (series: ISeries, account: string): Promise<ISeries> => {
  /* Get all the data simultanenously in a promise.all */
  const [poolTokenBalance, fyTokenBalance] = await Promise.all([
    series.poolContract.balanceOf(account),
    series.fyTokenContract.balanceOf(account),
  ]);
  const poolPercentOwned = mulDecimal(divDecimal(poolTokenBalance, series.totalSupply.big), '100');

  return {
    ...series,
    poolTokenBalance: bnToW3bNumber(poolTokenBalance, series.decimals),
    fyTokenBalance: bnToW3bNumber(fyTokenBalance, series.decimals),
    poolPercentOwned,
  };
};

/* TODO  get this the hell out of Dodg into its own place */
const getPoolAPY = async (sharesTokenAddr: string) => {

  const query = `
  query ($address: Bytes!) {
    eulerMarketStore(id: "euler-market-store") {
      markets(where:{eTokenAddress:$address}) {
        supplyAPY
       } 
    }
  }
`;

  const EULER_SUBGRAPH_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/euler-xyz/euler-mainnet';
  interface EulerRes {
    eulerMarketStore: {
      markets: {
        supplyAPY: string;
      }[];
    };
  }

  try {
    const {
      eulerMarketStore: { markets },
    } = await request<EulerRes>(EULER_SUBGRAPH_ENDPOINT, query, { address: sharesTokenAddr });
    return ((+markets[0].supplyAPY * 100) / 1e27).toString();
  } catch (error) {
    console.log(`Could not get pool apy for pool with shares token: ${sharesTokenAddr}`, error);
    return undefined;
  }
};

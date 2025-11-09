import { ethers } from 'ethers';

import {  IAssetRoot, ISeriesRoot, IYieldConfig } from '../types';
import { Ladle, Cauldron, Pool__factory, FYToken__factory } from '@numo-engine/contracts';

import { getBrowserCachedValue, setBrowserCachedValue } from '../utils/appUtils';
import { dateFromMaturity } from '../utils/yieldUtils';

export const buildSeriesMap = async (
  cauldron: Cauldron,
  ladle: Ladle,
  assetRootMap: Map<string, IAssetRoot>,
  provider: ethers.providers.BaseProvider,
  chainId: number,
  appConfig: IYieldConfig
): Promise<Map<string, ISeriesRoot>> => {
  /* Check for cached assets or start with empty array */
  const seriesList: any[] = (appConfig.browserCaching && getBrowserCachedValue(`${chainId}_series`)) || [];
  /* Check the last time the assets were fetched */
  const lastSeriesUpdate =
    (appConfig.browserCaching && getBrowserCachedValue(`${chainId}_lastSeriesUpdate`)) || 'earliest';

  /* get poolAdded events and series events at the same time */
  const seriesAddedFilter = cauldron.filters.SeriesAdded();
  const poolAddedfilter = ladle.filters.PoolAdded();

  /* Get the series from events - unless fetching historical EventLogs is suppressed */
  const [seriesAddedEvents, poolAddedEvents] = !appConfig.suppressEventLogQueries
    ? await Promise.all([
        cauldron.queryFilter(seriesAddedFilter, lastSeriesUpdate, 'latest'),
        ladle.queryFilter(poolAddedfilter, lastSeriesUpdate, 'latest'),
      ])
    : [[], []];

  /* Create a array from the seriesAdded event data or hardcoded series data if available */
  const seriesAdded = seriesAddedEvents.map((evnt: Cauldron.SeriesAddedEvent) => evnt);
  /* Create a map from the poolAdded event data or hardcoded pool data if available */
  const poolMap = new Map(poolAddedEvents.map((e: Ladle.PoolAddedEvent) => e.args)); // event values);

  /* Add in any extra static series */
  try {
    await Promise.all(
      seriesAdded
        .filter((_evnt: any) => !appConfig.ignoreSeries.includes(_evnt.args.seriesId)) // ignore if on the ignore list
        .map(async (_evnt: any): Promise<void> => {
          const { seriesId: id, baseId, fyToken } = _evnt.args;
          const { maturity } = await cauldron.series(id);
          const baseTokenAddress = assetRootMap.get(baseId)!.address;

          if (poolMap.has(id)) {
            // only add series if it has a pool
            const poolAddress = poolMap.get(id);
            const poolContract = Pool__factory.connect(poolAddress as string, provider);
            const fyTokenContract = FYToken__factory.connect(fyToken, provider);
            const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol, ts, g1, g2] = await Promise.all([
              fyTokenContract.name(),
              fyTokenContract.symbol(),
              fyTokenContract.version(),
              fyTokenContract.decimals(),
              poolContract.name(),
              poolContract.version(),
              poolContract.symbol(),
              poolContract.ts(),
              poolContract.g1(),
              poolContract.g2(),
              // poolContract.decimals(),
            ]);
            const newSeries = {
              id,
              baseId,
              maturity,
              name,
              symbol,
              version,
              address: fyToken,
              fyTokenAddress: fyToken,
              decimals: decimals,
              poolAddress,
              poolVersion,
              poolName,
              poolSymbol,
              baseTokenAddress,
              ts,
              g1,
              g2,
              createdBlock: _evnt.blockNumber,
              createdTxHash: _evnt.transactionHash,

              /* calc'd and display vals */
              maturityDate: dateFromMaturity(maturity).date,  // format(new Date(maturity * 1000), 'dd MMMM yyyy'),
              displayName: dateFromMaturity(maturity).display,  // format(new Date(maturity * 1000), 'dd MMM yyyy'),
              displayNameMobile: dateFromMaturity(maturity).mobile, //`${nameFromMaturity(maturity, 'MMM yyyy')}`,
            };

            seriesList.push(newSeries);
          }
        })
    );
  } catch (e) {
    console.log('Error fetching series data: ', e);

    throw new Error();
  }

  /* create a map from the asset list */
  const seriesRootMap: Map<string, ISeriesRoot> = new Map(seriesList.map((s: any) => [s.id, s]));

  

  // Log the new assets in the cache
  const _blockNum = await provider.getBlockNumber();
  if (appConfig.browserCaching) {
    // setBrowserCachedValue(`${chainId}_series`, seriesList);
    // // Set the 'last checked' block
    // setBrowserCachedValue(`${chainId}_lastSeriesUpdate`, _blockNum);
  }

  console.log(`Yield Protocol SERIES data updated [Block: ${_blockNum}]`);
  return seriesRootMap;
};

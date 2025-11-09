import { ethers } from 'ethers';

import { IAssetRoot, ISeriesRoot, IYieldConfig } from '../types';
import { Ladle, Cauldron, Pool__factory, FYToken__factory } from '@numo-engine/contracts';

import { getBrowserCachedValue, setBrowserCachedValue } from '../utils/appUtils';
import { dateFromMaturity } from '../utils/yieldUtils';
import { SERIES_1, SERIES_42161, SERIES_42220 } from '../config';

export const buildSeriesMap = async (
  cauldron: Cauldron,
  provider: ethers.providers.BaseProvider,
  chainId: number,
  appConfig: IYieldConfig
): Promise<Map<string, ISeriesRoot>> => {
  /* create a map from the asset list */
  // const seriesRootMap: Map<string, ISeriesRoot> = new Map(seriesList.map((s: any) => [s.id, s]));
  const seriesRootMap = new Map();

  /* Select correct Asset map based on chainId */
  let seriesInfoMap = chainId === 1 ? SERIES_1 : chainId === 42161 ? SERIES_42161 : SERIES_42220;

  await Promise.all(
    Array.from(seriesInfoMap).map(async (x): Promise<void> => {
      const id = x[0];
      const baseId = `${id.slice(0, 6)}00000000`;
      const fyTokenAddress = x[1].fyTokenAddress;
      const poolAddress = x[1].poolAddress;

      const poolContract = Pool__factory.connect(poolAddress, provider);
      const fyTokenContract = FYToken__factory.connect(fyTokenAddress, provider);

      // For Celo (42220) or chains without Cauldron, get maturity from fyToken
      // Otherwise use Cauldron for consistency with existing behavior
      const maturity = chainId === 42220
        ? await fyTokenContract.maturity()
        : (await cauldron.series(id)).maturity;

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
      ]);

      const newSeries = {
        id,
        baseId,
        maturity,
        name,
        symbol,
        version,
        address: fyTokenAddress,
        fyTokenAddress: fyTokenAddress,
        decimals,
        poolAddress,
        poolVersion,
        poolName,
        poolSymbol,
        ts,
        g1,
        g2,
        
        /* calc'd and display vals */
        maturityDate: dateFromMaturity(maturity).date, // format(new Date(maturity * 1000), 'dd MMMM yyyy'),
        displayName: dateFromMaturity(maturity).display, // format(new Date(maturity * 1000), 'dd MMM yyyy'),
        displayNameMobile: dateFromMaturity(maturity).mobile, //`${nameFromMaturity(maturity, 'MMM yyyy')}`,
      };

      seriesRootMap.set(id, newSeries);
    })
  ).catch((e) => console.log('Problems getting Series data. Check SERIES CONFIG.', e));

  // Log the new assets in the cache
  const _blockNum = await provider.getBlockNumber();
  if (appConfig.browserCaching) {
    /**
     * If: the CACHE is empty then, get fetch asset data for chainId and cache it:
     * */
    const cacheKey = `series_${chainId}`;
    const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

    /* cache results */
    // newSeriesList.length && localStorage.setItem(cacheKey, JSON.stringify(newSeriesList));
    // newSeriesList.length && console.log('Yield Protocol Series data retrieved successfully.');

    // setBrowserCachedValue(`${chainId}_series`, seriesList);
    // // Set the 'last checked' block
    // setBrowserCachedValue(`${chainId}_lastSeriesUpdate`, _blockNum);
  }

  console.log(`Numo Engine SERIES data updated [Block: ${_blockNum}]`);
  return seriesRootMap;
};

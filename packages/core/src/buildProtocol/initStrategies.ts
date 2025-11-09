import { ethers } from 'ethers';
import { IStrategyRoot, IYieldConfig } from '../types';
import * as contracts from '@numo-engine/contracts';

import { strategyAddresses } from '../config';
import { getBrowserCachedValue, setBrowserCachedValue } from '../utils/appUtils';

export const buildStrategyMap = async (
  provider: ethers.providers.BaseProvider,
  chainId: number,
  appConfig: IYieldConfig
): Promise<Map<string, IStrategyRoot>> => {
  const _strategyAddresses = strategyAddresses.get(chainId);
  const strategyList: any[] = (appConfig.browserCaching && getBrowserCachedValue(`${chainId}_strategies`)) || [];

  try {
    if (_strategyAddresses) {
      await Promise.all(
        _strategyAddresses.map(async (strategyAddr) => {
        /* if the strategy is NOT already in the cache : */
        if (strategyList.findIndex((_s: any) => _s.address === strategyAddr) === -1) {
          const Strategy = contracts.Strategy__factory.connect(strategyAddr, provider);
          const [name, symbol, baseId, decimals, version] = await Promise.all([
            Strategy.name(),
            Strategy.symbol(),
            Strategy.baseId(),
            Strategy.decimals(),
            Strategy.version(),
          ]);

          const newStrategy = {
            id: strategyAddr,
            address: strategyAddr,
            symbol,
            name,
            version,
            baseId,
            decimals,
          };
          // update state and cache
          strategyList.push(newStrategy);
        }
        })
      );
    }
  } catch (e) {
    console.log('Error fetching strategy data: ', e);
  }

  /* create a map from the list */
  const strategyRootMap: Map<string, IStrategyRoot> = new Map(strategyList.map((s: any) => [s.id, s]));

  // Log the new assets in the cache
  const _blockNum = await provider.getBlockNumber();
  if (appConfig.browserCaching) {
    setBrowserCachedValue(`${chainId}_strategies`, strategyList);
    // Set the 'last checked' block
    setBrowserCachedValue(`${chainId}_lastStrategyUpdate`, _blockNum);
  }

  console.log(`Numo Engine STRATEGY data updated [Block: ${_blockNum}]`);
  // console.log(strategyRootMap);

  return strategyRootMap;
};

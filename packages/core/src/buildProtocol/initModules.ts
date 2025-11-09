import { Contract, ethers } from 'ethers';
import * as contracts from '@numo-engine/contracts';

import { ARBITRUM, ETHEREUM } from '../utils/constants';
import { moduleAddresses } from '../config';

export const buildModuleMap = (provider: ethers.providers.BaseProvider, chainId: number) => {
  /** Get addresses of the module contracts */
  const _moduleAddresses = moduleAddresses.get(chainId);

  /** Inititiate contracts (and distribution as a map) */
  const moduleMap = new Map<string, Contract>([]);

  /** If no module addresses configured for this chain, return empty map */
  if (!_moduleAddresses) {
    return moduleMap;
  }

  /** Common modules for all chains */
  if (_moduleAddresses.WrapEtherModule) {
    moduleMap.set(
      'WrapEtherModule',
      contracts.WrapEtherModule__factory.connect(_moduleAddresses.WrapEtherModule, provider)
    );
  }

  /** Modules Contracts For Ethereum Chains */
  if ( chainId === 1 ) { // supportedChains.get(ETHEREUM)!.includes(chainId)) {
    // Modules
    if (_moduleAddresses.ConvexLadleModule) {
      moduleMap.set(
        'ConvexLadleModule',
        contracts.ConvexLadleModule__factory.connect(_moduleAddresses.ConvexLadleModule, provider)
      );
    }
  }

  /** Modules For Arbitrum Chains */
  // if (supportedChains.get(ARBITRUM)!.includes(chainId)) {
  //   // Modules
  // }

  return  moduleMap;
};

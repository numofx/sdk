import { Contract, ethers } from 'ethers';
import * as contracts from '@numo-engine/contracts';

import { ARBITRUM, ETHEREUM } from '../utils/constants';

import { oracleAddresses } from '../config';

export const buildOracleMap = (provider: ethers.providers.BaseProvider, chainId:number) => {
  /** Get addresses of the oracle contracts */
  const _oracleAddresses = oracleAddresses.get(chainId);

  /** Inititiate contracts (and distribution as a map) */
  const oracleMap = new Map<string, Contract>([]);

  /** Oracle Contracts For Ethereum Chains */
  if (chainId === 1) {
    // Oracles
    oracleMap.set(
      'ChainlinkMultiOracle',
      contracts.ChainlinkMultiOracle__factory.connect(_oracleAddresses!.ChainlinkMultiOracle as string, provider)
    );
    oracleMap.set(
      'CompositeMultiOracle',
      contracts.CompositeMultiOracle__factory.connect(_oracleAddresses!.CompositeMultiOracle as string, provider)
    );
    oracleMap.set(
      'YearnVaultMultiOracle',
      contracts.YearnVaultMultiOracle__factory.connect(_oracleAddresses!.YearnVaultMultiOracle as string, provider)
    );
    oracleMap.set(
      'NotionalMultiOracle',
      contracts.NotionalMultiOracle__factory.connect(_oracleAddresses!.NotionalMultiOracle as string, provider)
    );
    // Rate Oracle
    oracleMap.set(
      'RateOracle',
      contracts.CompoundMultiOracle__factory.connect(_oracleAddresses!.CompoundMultiOracle as string, provider)
    );
  }

  /** Oracles For Arbitrum Chains */
  if (chainId === 42161) {
    // Oracles
    const AccumulatorOracle: contracts.AccumulatorOracle = contracts.AccumulatorOracle__factory.connect(
      _oracleAddresses!.AccumulatorOracle as string,
      provider
    );
    oracleMap.set('AccumulatorOracle', AccumulatorOracle);
    oracleMap.set(
      'ChainlinkUSDOracle',
      contracts.ChainlinkUSDOracle__factory.connect(_oracleAddresses!.ChainlinkUSDOracle as string, provider)
    );
    // Rate Oracle
    oracleMap.set('RateOracle', AccumulatorOracle);
  }

  return oracleMap;
};

import { IVaultRoot, IYieldConfig, IYieldProtocol } from '../types';
import { getBrowserCachedValue, setBrowserCachedValue } from '../utils/appUtils';
import { Cauldron } from '@numo-engine/contracts';
import { generateVaultName } from '../utils/yieldUtils';
import { ethers } from 'ethers';

/**
 *
 * Build the Vault map from Cauldron events
 *
 * */
export const buildVaultMap = async (
  protocol: IYieldProtocol,
  provider: ethers.providers.BaseProvider,
  account: string,
  chainId: number,
  appConfig: IYieldConfig
): Promise<Map<string, IVaultRoot>> => {
  const { cauldron, seriesRootMap, assetRootMap } = protocol;

  /* Check for cached assets or start with empty array - note: ignore if not using browser cahcing or a forked env*/
  const cachedVaults: any[] = (!appConfig.useFork && appConfig.browserCaching && getBrowserCachedValue(`${chainId}_vaults#${account}`)) || [];
  /* Check the last time the assets were fetched */
  const lastVaultUpdate =
    (!appConfig.useFork && appConfig.browserCaching && getBrowserCachedValue(`${chainId}_lastVaultUpdate#${account}`)) || 'earliest';

  /** vaults can either be 'built' or 'given by a third party, so both events neded to be checked */
  const vaultsBuiltFilter = cauldron.filters.VaultBuilt(null, account, null);
  const vaultsReceivedfilter = cauldron.filters.VaultGiven(null, account);

  /* Get the vaults built/recieved - unless fetching historical EventLogs is suppressed */
  const [vaultsBuilt, vaultsReceived] = !appConfig.suppressEventLogQueries
    ? await Promise.all([
        cauldron.queryFilter(vaultsBuiltFilter, lastVaultUpdate, 'latest'),
        cauldron.queryFilter(vaultsReceivedfilter, lastVaultUpdate, 'latest'),
      ])
    : [[], []]; // this is when eventlogQueries are suppressed

  const builtVaults = vaultsBuilt.map((_evnt: Cauldron.VaultBuiltEvent): IVaultRoot => {
    const { vaultId, ilkId, seriesId } = _evnt.args;
    const series = seriesRootMap.get(seriesId);
    const ilk = assetRootMap.get(ilkId);
    return {
      id: vaultId,
      seriesId,
      baseId: series?.baseId || '',
      ilkId,
      displayName: generateVaultName(vaultId),
      baseDecimals: series?.decimals!,
      ilkDecimals: ilk?.decimals!,
      createdBlock: _evnt.blockNumber,
      createdTxHash: _evnt.transactionHash,
    };
  });

  const recievedVaults = await Promise.all(
    vaultsReceived.map(async (_evnt: Cauldron.VaultGivenEvent): Promise<IVaultRoot> => {
      const { vaultId: id } = _evnt.args;
      const { ilkId, seriesId } = await cauldron.vaults(id);
      const series = seriesRootMap.get(seriesId);
      const ilk = assetRootMap.get(ilkId);
      return {
        id,
        seriesId,
        baseId: series?.baseId || '',
        ilkId,
        displayName: generateVaultName(id),
        baseDecimals: series?.decimals!,
        ilkDecimals: ilk?.decimals!,
        createdBlock: _evnt.blockNumber,
        createdTxHash: _evnt.transactionHash,
      };
    })
  );

  /* combine built and given vault lists  */
  const vaultList = [...cachedVaults, ...builtVaults, ...recievedVaults];

  /* create a map from the 'charged' asset list */
  const vaultRootMap: Map<string, IVaultRoot> = new Map(vaultList.map((v: any) => [v.id as string, v]));

  /* Log the new assets in the cache */
  const _blockNum = await provider.getBlockNumber(); // TODO: maybe lose this
  if (appConfig.browserCaching) {
    setBrowserCachedValue(`${chainId}_vaults#${account}`, vaultList);
    setBrowserCachedValue(`${chainId}_lastVaultUpdate#${account}`, _blockNum);
  }

  console.log(`User VAULT data updated [Block: ${_blockNum}]`);

  return vaultRootMap;
};

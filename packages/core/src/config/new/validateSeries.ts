import { BaseProvider } from '@ethersproject/providers';
import { Pool__factory, FYToken__factory, Cauldron__factory } from '@numo-engine/contracts';
// import { Cauldron__factory, FYToken__factory, Pool__factory } from '../contracts';

import SERIES, { ISeriesStatic } from './series';

// TODO validate series
export const validateSeries = async (provider: BaseProvider, cauldronAddress: string) => {
  const preText = '### SERIES SET VALIDATION ERROR ### ';
  const chainId = (await provider.getNetwork()).chainId;
  
  const seriesList = SERIES.get(chainId)!;  // TODO throw if not available

  seriesList.forEach(async (s: ISeriesStatic) => {
    const poolContract = Pool__factory.connect(s.poolAddress, provider);
    const fyTokenContract = FYToken__factory.connect(s.address, provider);
    const cauldron = Cauldron__factory.connect(cauldronAddress, provider);

    console.log( chainId, cauldronAddress)

    try {
      const { maturity, baseId } = await cauldron.series(s.id);
      s.maturity !== maturity && console.log(preText, s.address, ': series maturity mismatch');
      s.baseId !== baseId && console.log(preText, s.address, ': baseId mismatch');

      const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol, ts, g1, g2, baseAddress] =
        await Promise.all([
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
          poolContract.base(),
        ]);

      console.table([name, maturity, baseId, symbol, version, decimals, poolName, poolVersion, poolSymbol, ts, g1, g2, baseAddress])

      s.symbol !== symbol && console.log(preText, s.address, ': symbol mismatch');
      s.name !== name && console.log(preText, s.address, ': name mismatch');
      s.decimals !== decimals && console.log(preText, s.address, ': decimals mismatch');
      s.version !== version && console.log(preText, s.address, ': version mismatch', version, s.version);
      s.poolSymbol !== poolSymbol && console.log(preText, s.address, ': pool symbol mismatch');
      // s.baseAddress !== baseAddress && console.log(preText, s.address, ': base Address mismatch');
      s.poolName !== poolName && console.log(preText, s.address, ': pool name mismatch');
      s.poolVersion !== poolVersion && console.log(preText, s.address, ': pool version mismatch');
      s.ts !== ts.toString() && console.log(preText, s.address, ': pool ts mismatch');
      s.g1 !== g1.toString() && console.log(preText, s.address, ': pool g1 mismatch');
      s.g2 !== g2.toString() && console.log(preText, s.address, ': pool g2 mismatch');
    } catch (e) {
      console.log(preText, s.address, ': Contract not reachable');
    }
  });
};
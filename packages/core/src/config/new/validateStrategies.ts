import {BaseProvider} from "@ethersproject/providers";
import { Strategy__factory } from "@numo-engine/contracts";
import STRATEGIES, { StrategyInfo } from "./strategies";

export const validateStrategies = async (provider: BaseProvider) => {
    const preText = '### STRATEGY VALIDATION ERROR ### ';
    const chainId = (await provider.getNetwork()).chainId;
    const strategyList = STRATEGIES.get(chainId)!;
    strategyList.forEach(async (s: StrategyInfo) => {
      const strategy = Strategy__factory.connect(s.address, provider);
      try {
        const [symbol, baseId, name, decimals, version] = await Promise.all([
          strategy.symbol(),
          strategy.baseId(),
          strategy.name(),
          strategy.decimals(),
          strategy.version(),
        ]);
        s.symbol !== symbol && console.log(preText, s.address, ': symbol mismatch');
        s.baseId !== baseId && console.log(preText, s.address, ': baseId mismatch');
        s.name !== name && console.log(preText, s.address, ': name mismatch');
        s.decimals !== decimals && console.log(preText, s.address, ': decimals mismatch');
        s.version !== version && console.log(preText, s.address, ': version mismatch');
      } catch (e) {
        console.log(preText, s.address, ': Contract not reachable.');
      }
    });
  };
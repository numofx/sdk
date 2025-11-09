import {
  BehaviorSubject,
  Observable,
  share,
  withLatestFrom,
  filter,
  shareReplay,
  first,
  lastValueFrom,
} from 'rxjs';
import { BigNumber, ethers } from 'ethers';
import { mulDecimal, divDecimal } from '@numo-engine/math';

import * as contracts from '@numo-engine/contracts';
import { IStrategy, IStrategyRoot, MessageType } from '../types';

import { accountø, providerø } from './connection';
import { protocolø } from './protocol';
import { ZERO_BN } from '../utils/constants';
import { sendMsg } from './messages';
import { bnToW3bNumber } from '../utils/yieldUtils';


const strategyMap$: BehaviorSubject<Map<string, IStrategy>> = new BehaviorSubject(new Map([]));
export const strategiesø: Observable<Map<string, IStrategy>> = strategyMap$.pipe(shareReplay(1));

/* Update strategies function */
export const updateStrategies = async (
  // provider: ethers.providers.BaseProvider,
  strategyList?: IStrategy[],
  account?: string,
  accountDataOnly: boolean = false
) => {
  /* If strategyList parameter is empty/undefined, update all the straetegies in the strategyMap */
  const list = strategyList?.length ? strategyList : Array.from(strategyMap$.value.values());

  await Promise.all(
    list.map(async (strategy: IStrategy) => {
      /* if account data only, just return the strategy */
      const strategyUpdate = accountDataOnly ? strategy : await _updateInfo(strategy);
      /* if account provided, append account data */
      const strategyUpdateAll = account ? await _updateAccountInfo(strategyUpdate, account) : strategyUpdate;
      strategyMap$.next(new Map(strategyMap$.value.set(strategy.id, strategyUpdateAll))); // note: new Map to enforce ref update
    })
  );
};

/* Observe protocolø changes, and update map accordingly */
protocolø
  .pipe(
    filter((protocol) => protocol.strategyRootMap.size > 0),
    withLatestFrom(providerø, accountø)
  )
  .subscribe(async ([_protocol, _provider, _account]) => {
    /* 'Charge' all the assets (using the current provider) */
    const chargedList = Array.from(_protocol.strategyRootMap.values()).map((st: IStrategyRoot) =>
      _chargeStrategy(st, _provider)
    );
    /* Update the assets with dynamic/user data */
    await updateStrategies(chargedList, _account);
    console.log('Strategy loading complete.');
    sendMsg({ message: 'Strategies Loaded.', type: MessageType.INTERNAL, id: 'strategiesLoaded' });
  });

/**
 * Observe Account$ changes ('update dynamic/User Data')
 * */
accountø.pipe(withLatestFrom(strategiesø)).subscribe(async ([account, stratMap]) => {
  if (account && stratMap.size) {
    await updateStrategies(Array.from(stratMap.values()), account, true);
    console.log('Strategies updated with new account info.');
  }
});

/* Add on extra/calculated Strategy info, contract instances and methods (no async calls) */
const _chargeStrategy = (strategy: any, provider: ethers.providers.BaseProvider): IStrategy => {
  const _strategy = contracts.Strategy__factory.connect(strategy.address, provider);
  return {
    ...strategy,
    strategyContract: _strategy,
    getAllowance: async (acc: string, spender: string) => _strategy.allowance(acc, spender),
  };
};

const _updateInfo = async (
  strategy: IStrategy,
  // provider: ethers.providers.BaseProvider // TODO: this provider is a pimple, but required :(
): Promise<IStrategy> => {

  // TODO: this provider is a bit of a pimple pimple, but required :(
  const provider = await lastValueFrom(providerø.pipe(first()));
  
  /**
   * Dynamic strategy info ( not related to a user )
   * */
  /* Get all the data simultanenously in a promise.all */
  const [strategyTotalSupply, currentSeriesId, currentPoolAddr, nextSeriesId] = await Promise.all([
    strategy.strategyContract.totalSupply(),
    strategy.strategyContract.seriesId(),
    strategy.strategyContract.pool(),
    strategy.strategyContract.nextSeriesId(),
  ]);

  const strategyPoolContract = contracts.Pool__factory.connect(currentPoolAddr, provider);

  /* Init supplys and balances as zero unless htere is a currnet series */
  let [poolTotalSupply, strategyPoolBalance, currentInvariant, initInvariant] = [ZERO_BN, ZERO_BN, ZERO_BN, ZERO_BN];

  [poolTotalSupply, strategyPoolBalance] = await Promise.all([
    strategyPoolContract.totalSupply(),
    strategyPoolContract.balanceOf(strategy.address),
  ]);

  // [currentInvariant, initInvariant] = currentSeries.isMature() ? [ZERO_BN, ZERO_BN] : [ZERO_BN, ZERO_BN];
  // strategyPoolPercent = mulDecimal(divDecimal(strategyPoolBalance, poolTotalSupply), '100');

  const returnRate = currentInvariant && currentInvariant.sub(initInvariant)!;

  return {
    ...strategy,
    strategyTotalSupply: bnToW3bNumber(strategyTotalSupply, strategy.decimals),
    strategyPoolContract,
    strategyPoolBalance: bnToW3bNumber(strategyPoolBalance, strategy.decimals),
    currentSeriesId,
    currentPoolAddr,
    nextSeriesId,
    initInvariant: initInvariant || BigNumber.from('0'),
    currentInvariant: currentInvariant || BigNumber.from('0'),
    returnRate: bnToW3bNumber(returnRate, strategy.decimals),
    active: true,
  };
};

/**
 *
 * Dynamic strategy info with a user
 *
 * */
const _updateAccountInfo = async (strategy: IStrategy, account: string): Promise<IStrategy> => {
  /* Get all the data simultanenously in a promise.all */
  const [accountBalance, accountPoolBalance] = await Promise.all([
    strategy.strategyContract.balanceOf(account),
    strategy.strategyPoolContract?.balanceOf(account) || ZERO_BN,
  ]);
  const accountStrategyPercent = mulDecimal(divDecimal(accountBalance, strategy.strategyTotalSupply?.big || '0'), '100');
  return {
    ...strategy,
    accountBalance: bnToW3bNumber(accountBalance, strategy.decimals),
    accountPoolBalance: bnToW3bNumber(accountPoolBalance, strategy.decimals),
    accountStrategyPercent,
  };
};

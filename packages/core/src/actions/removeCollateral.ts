import { ethers } from 'ethers';
import { transact } from '../chainActions';
import { ETH_BASED_ASSETS, CONVEX_BASED_ASSETS } from '../config/assetsConfig';
import { combineLatest, take } from 'rxjs';
import { ConvexJoin__factory } from '@numo-engine/contracts';
import { protocolø, accountø, assetsø, chainIdø, providerø } from '../observables';
import { IVault, ActionCodes, ICallData, LadleActions, RoutedActions } from '../types';
import { getProcessCode, ONE_BN, ZERO_BN } from '../utils';
import { inputToTokenValue } from '../utils/yieldUtils';
import { removeEth } from './_addRemoveEth';
import { unwrapAsset } from './_wrapUnwrapAsset';

export const removeCollateral = async (amount: string, vault: IVault, unwrapOnRemove: boolean = true) => {
  /* Subscribe to and get the values from the observables:  */
  combineLatest([protocolø, assetsø, accountø, providerø])
    .pipe(take(1)) // only take one and then finish.
    .subscribe(async ([{ ladle }, assetMap, account, provider]) => {
      /* generate the txCode for tx tracking and tracing */
      const txCode = getProcessCode(ActionCodes.REMOVE_COLLATERAL, vault.id);

      /* get associated series and ilk */
      const ilk = assetMap.get(vault.ilkId)!;
      const ladleAddress = ladle.address;

      /* get unwrap handler if required */
      const unwrapHandlerAddress = ilk.unwrapHandlerAddress;
      /* check if the ilk/asset is an eth asset variety OR if it is wrapped token, if so pour to Ladle */
      const isEthCollateral = ETH_BASED_ASSETS.includes(ilk.proxyId);

      /* parse inputs to BigNumber in Wei */
      const _amount = inputToTokenValue(amount, ilk.decimals);

      /* handle wrapped tokens:  */
      const unwrapCallData: ICallData[] = unwrapOnRemove ? await unwrapAsset(ilk, account!) : [];
      const removeEthCallData: ICallData[] = isEthCollateral ? await removeEth(ONE_BN) : []; // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)

      /* is convex-type collateral */
      const isConvexCollateral = CONVEX_BASED_ASSETS.includes(ilk.proxyId);
      const convexJoinContract = ConvexJoin__factory.connect(ilk.joinAddress, provider);

      /* pour destination based on ilk/asset is an eth asset variety ( or unwrapHadnler address if unwrapping) */
      const pourToAddress = () => {
        console.log('Requires unwrapping? ', unwrapCallData.length);
        if (isEthCollateral) return ladleAddress;
        if (unwrapCallData.length) return unwrapHandlerAddress; // if there is something to unwrap
        return account;
      };

      const calls: ICallData[] = [
        /* convex-type collateral; ensure checkpoint before giving collateral back to account */
        {
          operation: LadleActions.Fn.ROUTE,
          args: [vault.owner] as RoutedActions.Args.CHECKPOINT,
          fnName: RoutedActions.Fn.CHECKPOINT,
          targetContract: convexJoinContract, // use the convex join contract to checkpoint
          ignoreIf: !isConvexCollateral,
        },
        {
          operation: LadleActions.Fn.POUR,
          args: [
            vault.id,
            pourToAddress(),
            _amount.mul(-1), // NOTE: negated value!
            ZERO_BN, // No debt written off
          ] as LadleActions.Args.POUR,
          ignoreIf: false,
        },
        ...removeEthCallData,
        ...unwrapCallData,
      ];

      transact(calls, txCode);
    });
};

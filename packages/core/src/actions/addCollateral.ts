import { ethers } from 'ethers';
import { combineLatest, take } from 'rxjs';
import { sign, transact } from '../chainActions';
import { ETH_BASED_ASSETS, CONVEX_BASED_ASSETS } from '../config/assetsConfig';
import { ConvexLadleModule } from '@numo-engine/contracts';
import {
  accountø,
  assetsø,
  chainIdø,
  selectedø,
  vaultsø,
  protocolø,
} from '../observables';
import { MessageType, sendMsg } from '../observables/messages';
import { IVault, ActionCodes, ICallData, LadleActions, IAsset } from '../types';
import { ModuleActions } from '../types/operations';
import { BLANK_VAULT, getProcessCode, ZERO_BN } from '../utils';
import { inputToTokenValue } from '../utils/yieldUtils';
import { addEth } from './_addRemoveEth';
import { wrapAsset } from './_wrapUnwrapAsset';

export const addCollateral = async (amount: string, vault?: IVault | string) => {
  /* Subscribe to and get the values from the observables:  */
  combineLatest([protocolø, assetsø, vaultsø, accountø, selectedø ])
    .pipe(take(1)) // only take one and then finish.
    .subscribe(
      async ([
        { ladle, moduleMap },
        assetMap,
        vaultMap,
        account,
        selected,
      ]) => {
        /* Get the values from the observables/subjects */
        const ladleAddress = ladle.address;

        /** Use the vault/vaultId provided else use blank vault TODO: Add a check for existing vault */
        const getValidatedVault = (v: IVault | string | undefined): IVault | undefined => {
          if (v) {
            if ((v as IVault).id) return v as IVault;
            if (vaultMap.has(v as string)) return vaultMap.get(v as string);
            sendMsg({
              message: 'Vault ID provided, but not recognised.',
              type: MessageType.WARNING,
              origin: 'Borrow()',
            });
            throw new Error('Vault ID provided, but was not recognised.');
          }
          sendMsg({
            message: 'No Vault ID provided. Creating a new Vault...',
            type: MessageType.INFO,
            origin: 'Borrow()',
          });
          return undefined;
        };

        const _vault: IVault | undefined = getValidatedVault(vault);
        const vaultId: string = _vault ? _vault.id : BLANK_VAULT;

        /* Set the ilk based on if a vault has been selected or it's a new vault */
        const ilk: IAsset | null | undefined = _vault ? assetMap.get(_vault.ilkId) : selected.ilk;

        /* generate the reproducible txCode for tx tracking and tracing */
        const txCode = getProcessCode(ActionCodes.ADD_COLLATERAL, vaultId);

        /* parse inputs to BigNumber in Wei */
        const _amount = inputToTokenValue(amount, ilk!.decimals);

        /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
        const isEthCollateral = ETH_BASED_ASSETS.includes(ilk?.proxyId!);

        /* is convex-type collateral */
        const isConvexCollateral = CONVEX_BASED_ASSETS.includes(ilk?.proxyId!);
        const ConvexLadleModuleContract = moduleMap.get('ConvexLadleModule') as ConvexLadleModule;

        /* if approveMAx, check if signature is required : note: getAllowance may return FALSE if ERC1155 */
        const _allowance = await ilk?.getAllowance(account!, ilk.joinAddress);
        const alreadyApproved = ethers.BigNumber.isBigNumber(_allowance) ? _allowance.gte(_amount) : _allowance;

        /* Handle wrapping of tokens:  */
        const wrapAssetCallData: ICallData[] = await wrapAsset(_amount, ilk!, txCode );

        /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
        const permitCallData: ICallData[] = await sign(
          [
            {
              target: ilk!,
              spender: ilk?.joinAddress!,
              amount: _amount,
              /* ignore if: 1) collateral is ETH 2) approved already 3) wrapAssets call is > 0 (because the permit is handled with wrapping) */
              ignoreIf: isEthCollateral || alreadyApproved === true || wrapAssetCallData.length > 0,
            },
          ],
          txCode
        );

        /* Handle adding eth if required (ie. if the ilk is ETH_BASED). If not, else simply sent ZERO to the addEth fn */
        const addEthCallData: ICallData[] = await addEth(
          ETH_BASED_ASSETS.includes(ilk?.proxyId!) ? _amount : ZERO_BN,
          undefined,
          ilk?.proxyId
        );

        /* pour destination based on ilk/asset is an eth asset variety */
        const pourToAddress = () => {
          if (isEthCollateral) return ladleAddress;
          return account;
        };

        /**
         * BUILD CALL DATA ARRAY
         * */
        const calls: ICallData[] = [
          /* If vault is null, build a new vault, else ignore */
          {
            operation: LadleActions.Fn.BUILD,
            args: [selected.series?.id, ilk?.proxyId, '0'] as LadleActions.Args.BUILD,
            ignoreIf: !!vault, // ignore if vault exists
          },

          /* If convex-type collateral, add vault using convex ladle module */
          {
            operation: LadleActions.Fn.MODULE,
            fnName: ModuleActions.Fn.ADD_CONVEX_VAULT,
            args: [ilk?.joinAddress, vaultId] as ModuleActions.Args.ADD_CONVEX_VAULT,
            targetContract: ConvexLadleModuleContract,
            ignoreIf: !!vault || !isConvexCollateral,
          },

          /* handle wrapped token deposit, if required */
          ...wrapAssetCallData,

          /* add in add ETH calls */
          ...addEthCallData,

          /* handle permits if required */
          ...permitCallData,

          {
            operation: LadleActions.Fn.POUR,
            args: [vaultId, pourToAddress(), _amount, ethers.constants.Zero] as LadleActions.Args.POUR,
            ignoreIf: false, // never ignore
          },
        ];

        /* TRANSACT */
        transact(calls, txCode);
      }
    );
};

import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import { ERC20Permit__factory, ERC1155__factory } from '@numo-engine/contracts';
import {
  ISignData,
  ICallData,
  TokenType,
  LadleActions,
  ApprovalMethod,
  ProcessStage,
  TxState,
  IYieldSig,
} from '../types';
import { IGNORED_CALLDATA, MAX_256 } from '../utils/constants';
import { resetProcess, updateProcess } from '../observables/transactions';
import { getSignId } from '../utils/yieldUtils';
import { first, lastValueFrom } from 'rxjs';
import { accountProviderø, accountø, chainIdø, userSettingsø } from '../observables';

// const _handleSignSuccess = (reqSig: ISignData, processCode:string ) => {
//     /* update the processMap to indicate the signing was successfull */
//     updateProcess({
//       processCode,
//       signMap: new Map(transactionMap$.value.signMap.set(getSignId(reqSig), { signData: reqSig, status: TxState.SUCCESSFUL })),
//     });
// };

const _handleSignError = (err: Error, processCode: string) => {
  /* End the process on signature rejection or sign failure */
  resetProcess(processCode);
  console.log(err);
  return Promise.reject();
};

/**
 *
 * SIGNING
 *
 * 1. Build the signatures of provided by ISignData[], returns ICallData[] for a batched calls to ladle.
 * 2. (Optionally, Sends off the approval tx, on completion of all txs, returns an empty array).
 *
 * @param { ISignData[] } requestedSignatures
 * @param { string } processCode
 *
 * @returns { Promise<ICallData[]> }
 */

export const sign = async (requestedSignatures: ISignData[], processCode: string): Promise<ICallData[]> => {
  const account = await lastValueFrom(accountø.pipe(first()));
  const chainId = await lastValueFrom(chainIdø.pipe(first()));
  const { maxApproval, approvalMethod } = await lastValueFrom(userSettingsø.pipe(first()));
  const accountProvider = await lastValueFrom(accountProviderø.pipe(first())); //  await lastValueFrom(accountProviderø);

  // /* Get the signer from the accountProvider */
  const signer = accountProvider.getSigner(account);

  /* check if a contract wallet is being used */
  const walletCode = await accountProvider.getCode(account!);
  const isContractWallet = walletCode !== '0x';
  isContractWallet && console.log('Contract wallet detected - using approval by transaction');

  /* First, filter out any ignored calls */
  const _requestedSigs = requestedSignatures.filter((_rs: ISignData) => !_rs.ignoreIf);

  /* Build out the signMap for this process */
  const _signMap: Map<string, IYieldSig> = new Map(
    _requestedSigs.map((s: ISignData) => [getSignId(s), { signData: s, status: TxState.PENDING }])
  );

  /* update the process with a list of signatures required, and start the process*/
  updateProcess({
    processCode,
    signMap: new Map(_signMap),
    stage: ProcessStage.SIGNING_APPROVAL_REQUESTED,
  });

  // const signer = account ? accountProvider.getSigner(account) : accountProvider.getSigner(0); // TODO: signer is WRONG here.
  const _processedSigs = _requestedSigs.map(async (reqSig: ISignData): Promise<ICallData> => {
    /**
     * CASE 1:  ERC2612 Permit style (and approval by transaction not  selected)
     * */
    if (
      !isContractWallet &&
      approvalMethod === ApprovalMethod.SIG &&
      reqSig.target.tokenType === TokenType.ERC20_Permit
    ) {
      console.log( 'Approval via permit signature: ERC2612')
      /* get the  ERC2612 signed data */
      const _amount = maxApproval ? MAX_256 : reqSig.amount?.toString();
      const { v, r, s, value, deadline } = await signERC2612Permit(
        accountProvider,
        /* build domain */
        reqSig.domain || {
          // uses custom domain if provided, else use created Domain
          name: reqSig.target.name,
          version: reqSig.target.version,
          chainId,
          verifyingContract: reqSig.target.address,
        },
        account!,
        reqSig.spender,
        _amount
      ).catch((err: any) => _handleSignError(err, processCode));

      const args = [
        reqSig.target.address, // the asset id OR the seriesId (if signing fyToken)
        reqSig.spender,
        reqSig.amount,
        deadline,
        v,
        r as unknown as Buffer, // TODO: check typing
        s as unknown as Buffer,
      ] as LadleActions.Args.FORWARD_PERMIT;

      return {
        operation: LadleActions.Fn.FORWARD_PERMIT,
        args,
        ignoreIf: false, // Never ignore a successfully completed signature
      };
    }

    /**
     * CASE 2:  DAI Permit style (and approval by transaction not  selected)
     * */
    if (
      !isContractWallet &&
      approvalMethod === ApprovalMethod.SIG &&
      reqSig.target.tokenType === TokenType.ERC20_DaiPermit
    ) {
      console.log( 'Approval via permit signature: Dai Permit')
      /* Get the sign data */
      const { v, r, s, nonce, expiry, allowed } = await signDaiPermit(
        accountProvider,
        /* build domain */
        {
          name: reqSig.target.name,
          version: reqSig.target.version,
          chainId,
          verifyingContract: reqSig.target.address,
        },
        account!,
        reqSig.spender
      ).catch((err: any) => _handleSignError(err, processCode));

      const args = [
        reqSig.target.address,
        reqSig.spender,
        nonce,
        expiry,
        allowed, // TODO check use amount if provided, else defaults to MAX.
        v,
        r as unknown as Buffer, // TODO: check typing
        s as unknown as Buffer,
      ] as LadleActions.Args.FORWARD_DAI_PERMIT;

      /* update the entry in the processMap to indicate the signing was successfull */
      updateProcess({
        processCode,
        signMap: new Map(_signMap.set(getSignId(reqSig), { signData: reqSig, status: TxState.SUCCESSFUL })),
      });

      return {
        operation: LadleActions.Fn.FORWARD_DAI_PERMIT,
        args,
        ignoreIf: false, // Never ignore a successfully completed signature
      };
    }

    /**
     * CASE 3: FALLBACK / DEFAULT CASE: Approval by transaction 
     * ( after transaction success,  return blank ICallData value (IGNORED_CALLDATA). )
     * */
    if (reqSig.target.tokenType === TokenType.ERC1155) {
      
      console.log( 'Approval via transaction: ERC1155')
      /* if token type is ERC1155 then set approval 'ApprovalForAll' */
      const connectedERC1155 = ERC1155__factory.connect(reqSig.target.address, signer);
      await connectedERC1155
        .setApprovalForAll(reqSig.spender, true)
        .catch((err: any) => _handleSignError(err, processCode));
      /* update the processMap to indicate the signing was successfull */
      updateProcess({
        processCode,
        signMap: new Map(_signMap.set(getSignId(reqSig), { signData: reqSig, status: TxState.SUCCESSFUL })),
      });
      /* Approval transaction complete: return a dummy ICalldata ( which will ALWAYS get ignored )*/
      return IGNORED_CALLDATA;

    } else {

      console.log('Approval via transaction: ERC20')
      /* else use a regular approval */
      const connectedERC20 = ERC20Permit__factory.connect(reqSig.target.address, signer);
      await connectedERC20
        .approve(reqSig.spender, reqSig.amount as string)
        .catch((err: any) => _handleSignError(err, processCode));

      /* update the processMap to indicate the signing was successfull */
      updateProcess({
        processCode,
        signMap: new Map(_signMap.set(getSignId(reqSig), { signData: reqSig, status: TxState.SUCCESSFUL })),
      });

      /* Approval transaction complete: return a dummy ICalldata ( which will ALWAYS get ignored )*/
      return IGNORED_CALLDATA;
    }
  });

  /* Returns the processed list of txs required as ICallData[] if all successful (  may as well filter out ignored values here too ) */
  const signedList = await Promise.all(_processedSigs);

  return signedList.filter((x: ICallData) => !x.ignoreIf);
};

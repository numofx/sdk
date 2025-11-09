import { Contract, PayableOverrides, BigNumber, ContractTransaction } from 'ethers';
import { Ladle } from '@numo-engine/contracts';
import { accountProviderø, accountø, protocolø } from '../observables/';
import { ICallData, LadleActions, ProcessStage, TxState } from '../types';
import { ZERO_BN } from '../utils/constants';
import { resetProcess, updateProcess } from '../observables/transactions';
import { combineLatest, concatMap, finalize, take } from 'rxjs';
import { appConfigø } from '../observables/appConfig';

/* Encode the calls: */ // TODO: this could probably be refactored to look better
const _encodeCalls = (calls: ICallData[], ladle: Ladle) =>
  calls
    .filter((call: ICallData) => call.ignoreIf !== true)
    .map((call: ICallData) => {
      /* 'pre-encode' routed/module calls if required */
      if (call.operation === LadleActions.Fn.ROUTE || call.operation === LadleActions.Fn.MODULE) {
        if (call.fnName && call.targetContract) {
          const encodedFn = (call.targetContract as any).interface.encodeFunctionData(call.fnName, call.args);

          if (call.operation === LadleActions.Fn.ROUTE)
            return ladle.interface.encodeFunctionData(LadleActions.Fn.ROUTE, [call.targetContract.address, encodedFn]);

          if (call.operation === LadleActions.Fn.MODULE)
            return ladle.interface.encodeFunctionData(LadleActions.Fn.MODULE, [call.targetContract.address, encodedFn]);
        }
        throw new Error('Function name and contract target required for routing / module interaction');
      }
      /* else */
      return (ladle as Contract).interface.encodeFunctionData(call.operation as string, call.args);
    });

/* Get the sum of the VALUE of all calls */
const _totalBatchValue = (calls: ICallData[]) =>
  calls.reduce((sum: BigNumber, call: ICallData) => {
    return sum.add(call.overrides?.value ? BigNumber.from(call?.overrides?.value) : ZERO_BN);
  }, ZERO_BN);

/* handle case when user or wallet rejects the tx (before submission) */
const _handleTxRejection = (err: any, processCode: string) => {
  resetProcess(processCode);
  /* If user cancelled/rejected the tx */
  if (err.code === 4001) {
    console.log('User cancelled');
    updateProcess({
      processCode,
      stage: ProcessStage.PROCESS_INACTIVE,
      error: { error: err, message: 'Transaction rejected by user.' },
    });
  } else {
    /* Else, the transaction was likely cancelled by the wallet/provider before getting submitted?  */
    const _msg = err.data.message.includes()
      ? `${err.data.message.split('VM Exception while processing transaction: revert').pop()}`
      : `Something went wrong.`;
    updateProcess({ processCode, stage: ProcessStage.PROCESS_INACTIVE, error: { error: err, message: _msg } });
    /* Always log error to the console */
    console.log('here', err);
  }
};

/* Handle the case where the transaction will inevitably fail */
const _handleTxWillFail = (error: any, processCode: string, transaction?: any) => {
  /* simply toggles the txWillFail txState */
  updateProcess({
    processCode,
    stage: ProcessStage.PROCESS_INACTIVE,
    error: { error, message: 'Transaction Aborted (expected to fail)' },
    tx: transaction,
  });

  resetProcess(processCode);
};

/* Handle the transaction completed > either fail or pass */
const _handleTxError = (error: any, processCode: string) => {
  // /* update process list > Tx Complete + status */
  // updateProcess({
  //   processCode,
  //   stage: ProcessStage.PROCESS_COMPLETE,
  //   tx: { ...transaction!, status: TxState.FAILED },
  // });

  /* simply toggles the txWillFail txState */
  console.log(error);
  resetProcess(processCode);
};

export const transact = async (
  calls: ICallData[],
  processCode: string,
  callback: () => void = () => console.log('transaction done.')
) => {
  /* Subscribe to observables */
  combineLatest([protocolø, accountø, accountProviderø, appConfigø])
    .pipe(
      take(1), // take one and then unsubscribe
      concatMap(async ([{ ladle }, account, provider, { forceTransactions }]) => {
        updateProcess({ processCode, stage: ProcessStage.TRANSACTION_REQUESTED });
        /* Get the signer */
        const signer = account ? provider.getSigner(account) : provider.getSigner(0);
        /* Set the connected contract instance, ladle by default */
        const ladleContract = ladle.connect(signer) as Ladle;
        /* Filter out ignored calls */
        const filteredCalls = calls.filter((call: ICallData) => call.ignoreIf !== true);
        /* Encode the calls */
        const encodedCalls = _encodeCalls(filteredCalls, ladleContract);
        /* Get the total value of all the calls */
        const batchValue = _totalBatchValue(filteredCalls);

        let gasEst: BigNumber;

        try {
          console.log('getting gas estimate');
          gasEst = await ladleContract.estimateGas.batch(encodedCalls, { value: batchValue } as PayableOverrides);
          console.log('Auto Gas estimate: ', gasEst.mul(120).div(100).toString());
        } catch (e: any) {
          /* handle if the tx if going to fail and transactions aren't forced */
          gasEst = BigNumber.from(1000000);
          if (!forceTransactions) {
            _handleTxWillFail(e.error, processCode, e.transaction);
            /* and simply exit process silently */
            return;
          }
          /* if transactions are forced, simply catch the error and move on */
        }

        let tx: ContractTransaction;
        /* first try the transaction with connected wallet and catch any 'pre-chain'/'pre-tx' errors */
        try {
          tx = await ladleContract.batch(encodedCalls, {
            value: batchValue,
            gasLimit: gasEst.mul(120).div(100),
          } as PayableOverrides);
          /* update process list > Tx Pending */
          updateProcess({
            processCode,
            stage: ProcessStage.TRANSACTION_PENDING,
            tx: { ...tx, receipt: null, status: TxState.PENDING },
          });
        } catch (e) {
          /* This case is when user rejects tx OR Wallet rejects tx */
          _handleTxRejection(e, processCode);
          /* return out of the function silently */
          return;
        }

        /* wait for the tx to complete */
        try {
          const res = await tx.wait();
          /* check the tx status ( failed/success ) */
          const txSuccess: boolean = res.status === 1 || false;
          /* update process list > Tx Complete + status */
          updateProcess({
            processCode,
            stage: ProcessStage.PROCESS_COMPLETE,
            tx: { ...tx!, receipt: res, status: txSuccess ? TxState.SUCCESSFUL : TxState.FAILED },
          });
        } catch (e) {
          // TODO: handle error on forced tx
          _handleTxError(e, processCode);
        }
      }),
      finalize(() => callback())
    )
    .subscribe();
};

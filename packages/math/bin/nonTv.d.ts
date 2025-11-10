import { ethers, BigNumber, BigNumberish } from 'ethers';
import { Decimal } from 'decimal.js';
export declare const MAX_256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export declare const MAX_128 = "0xffffffffffffffffffffffffffffffff";
export declare const ZERO_DEC: Decimal;
export declare const ONE_DEC: Decimal;
export declare const TWO_DEC: Decimal;
export declare const MAX_DEC: Decimal;
export declare const RAY_DEC: Decimal;
export declare const ZERO_BN: ethers.BigNumber;
export declare const ONE_BN: ethers.BigNumber;
export declare const MINUS_ONE_BN: ethers.BigNumber;
export declare const WAD_RAY_BN: ethers.BigNumber;
export declare const WAD_BN: ethers.BigNumber;
export declare const SECONDS_PER_YEAR: number;
export declare const secondsInOneYear: ethers.BigNumber;
export declare const secondsInTenYears: ethers.BigNumber;
/** *************************
 Support functions
 *************************** */
/**
 * Convert a bignumber with any decimal to a bn with decimal of 18
 * @param x bn to convert.
 * @param decimals of the current bignumber
 * @returns BigNumber
 */
export declare const decimalNToDecimal18: (x: BigNumber, decimals: number) => BigNumber;
/**
 * Convert a decimal18 to a bn of any decimal
 * @param x 18 decimal to reduce
 * @param decimals required
 * @returns BigNumber
 */
export declare const decimal18ToDecimalN: (x: BigNumber, decimals: number) => BigNumber;
/**
 * TODO: maybe move this out to gerneral yieldUtils
 * Convert bytesX to bytes32 (BigEndian?)
 * @param x string to convert.
 * @param n current bytes value eg. bytes6 or bytes12
 * @returns string bytes32
 */
export declare function bytesToBytes32(x: string, n: number): string;
/**
 * TODO: Possibily move this out to general yieldUtils?
 * @param { BigNumber | string } to unix time
 * @param { BigNumber | string } from  unix time *optional* default: now
 * @returns { string } as number seconds 'from' -> 'to'
 */
export declare const secondsToFrom: (to: BigNumber | string, from?: BigNumber | string) => string;
/**
 * @param { BigNumber | string } value
 * @returns { string }
 */
export declare const floorDecimal: (value: BigNumber | string) => string;
/**
 * @param { Decimal } value
 * @returns { BigNumber }
 */
export declare const toBn: (value: Decimal) => BigNumber;
/**
 * @param { BigNumber | string } multiplicant
 * @param { BigNumber | string } multiplier
 * @param { string } precisionDifference  // Difference between multiplicant and mulitplier precision (eg. wei vs ray '1e-27' )
 * @returns { string } in decimal precision of the multiplicant
 */
export declare const mulDecimal: (multiplicant: BigNumber | string, multiplier: BigNumber | string, precisionDifference?: string) => string;
/**
 * @param  { BigNumber | string } numerator
 * @param { BigNumber | string } divisor
 * @param { BigNumber | string } precisionDifference // Difference between multiplicant and mulitplier precision (eg. wei vs ray '1e-27' )
 * @returns { string } in decimal precision of the numerator
 */
export declare const divDecimal: (numerator: BigNumber | string, divisor: BigNumber | string, precisionDifference?: string) => string;
/** ************************
 YieldSpace functions
 *************************** */
/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } base
 * @returns {[BigNumber, BigNumber]}
 *
 * https://www.desmos.com/calculator/mllhtohxfx
 */
export declare function mint(baseReserves: BigNumber | string, fyTokenReserves: BigNumber | string, totalSupply: BigNumber | string, base: BigNumber | string, fromBase?: boolean): [BigNumber, BigNumber];
/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } lpTokens
 * @returns {[BigNumber, BigNumber]}
 *
 * https://www.desmos.com/calculator/ubsalzunpo
 */
export declare function burn(baseReserves: BigNumber | string, fyTokenReserves: BigNumber | string, totalSupply: BigNumber | string, lpTokens: BigNumber | string): [BigNumber, BigNumber];
/**
 *
 * @param { BigNumber | string } poolTotalSupply
 * @param { BigNumber | string } strategyTotalsupply
 * @param { BigNumber | string } strategyTokensToBurn
 *
 * @returns {BigNumber}
 *
 */
export declare function burnFromStrategy(poolTotalSupply: BigNumber | string, strategyTotalsupply: BigNumber | string, strategyTokensToBurn: BigNumber | string): BigNumber;
/**
 * @param { BigNumber } baseReserves
 * @param { BigNumber } fyTokenReservesVirtual
 * @param { BigNumber } fyTokenReservesReal
 * @param { BigNumber | string } fyToken
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g1
 * @param { number } decimals
 *
 * @returns {[BigNumber, BigNumber]}
 */
export declare function mintWithBase(baseReserves: BigNumber, fyTokenReservesVirtual: BigNumber, fyTokenReservesReal: BigNumber, fyToken: BigNumber | string, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g1: BigNumber | string, decimals: number): [BigNumber, BigNumber];
/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReservesVirtual
 * @param { BigNumber | string } fyTokenReservesReal
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } lpTokens
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 *
 * @returns { BigNumber }
 */
export declare function burnForBase(baseReserves: BigNumber, fyTokenReservesVirtual: BigNumber, fyTokenReservesReal: BigNumber, lpTokens: BigNumber, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g2: BigNumber | string, decimals: number): BigNumber;
/**
 * Calculate the amount of fyToken a user would get for given amount of Base.
 * fyTokenOutForBaseIn
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } base
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g1
 * @param { number } decimals
 *
 * @returns { BigNumber }
 */
export declare function sellBase(baseReserves: BigNumber | string, fyTokenReserves: BigNumber | string, base: BigNumber | string, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g1: BigNumber | string, decimals: number): BigNumber;
/**
 * Calculate the amount of base a user would get for certain amount of fyToken.
 * baseOutForFYTokenIn
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } fyToken
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 *
 * @returns { BigNumber }
 */
export declare function sellFYToken(baseReserves: BigNumber | string, fyTokenReserves: BigNumber | string, fyToken: BigNumber | string, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g2: BigNumber | string, decimals: number): BigNumber;
/**
 * Calculate the amount of fyToken a user could sell for given amount of Base.
 * fyTokenInForBaseOut
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } base
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 *
 * @returns { BigNumber }
 */
export declare function buyBase(baseReserves: BigNumber | string, fyTokenReserves: BigNumber | string, base: BigNumber | string, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g2: BigNumber | string, decimals: number): BigNumber;
/**
 * Calculate the amount of base a user would have to pay for certain amount of fyToken.
 * baseInForFYTokenOut
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } fyToken
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g1
 * @param { number } decimals
 *
 * @returns { BigNumber }
 */
export declare function buyFYToken(baseReserves: BigNumber | string, fyTokenReserves: BigNumber | string, fyToken: BigNumber | string, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g1: BigNumber | string, decimals: number): BigNumber;
/**
 * Calculate the max amount of base that can be sold to into the pool without making the interest rate negative.
 *
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g1
 * @param { number } decimals
 *
 * @returns { BigNumber } max amount of base that can be bought from the pool
 *
 */
export declare function maxBaseIn(baseReserves: BigNumber, fyTokenReserves: BigNumber, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g1: BigNumber | string, decimals: number): BigNumber;
/**
 * Calculate the max amount of base that can be bought from the pool.
 *
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 *
 * @returns { BigNumber } max amount of base that can be bought from the pool
 *
 */
export declare function maxBaseOut(baseReserves: BigNumber, fyTokenReserves: BigNumber, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g2: BigNumber | string, decimals: number): BigNumber;
/**
 * Calculate the max amount of fyTokens that can be sold to into the pool.
 *
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 *
 * @returns { BigNumber }
 */
export declare function maxFyTokenIn(baseReserves: BigNumber, fyTokenReserves: BigNumber, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g2: BigNumber | string, decimals: number): BigNumber;
/**
 * Calculate the max amount of fyTokens that can be bought from the pool without making the interest rate negative.
 * See section 6.3 of the YieldSpace White paper
 *
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g1
 * @param { number } decimals
 *
 * @returns { BigNumber }
 */
export declare function maxFyTokenOut(baseReserves: BigNumber, fyTokenReserves: BigNumber, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g1: BigNumber | string, decimals: number): BigNumber;
/**
 * Calculate the amount of fyToken that should be bought when providing liquidity with only underlying.
 * The amount bought leaves a bit of unused underlying, to allow for the pool reserves to change between
 * the calculation and the mint. The pool returns any unused underlying.
 *
 * @param baseReserves
 * @param fyTokenRealReserves
 * @param fyTokenVirtualReserves
 * @param base
 * @param timeTillMaturity
 * @param ts
 * @param g1
 * @param decimals
 * @param slippage How far from the optimum we want to be
 * @param precision How wide the range in which we will accept a value
 * @returns fyTokenToBuy, surplus
 */
export declare function fyTokenForMint(baseReserves: BigNumber, fyTokenRealReserves: BigNumber, fyTokenVirtualReserves: BigNumber, base: BigNumber | string, timeTillMaturity: BigNumber | string, ts: BigNumber | string, g1: BigNumber | string, decimals: number, slippage?: number, // 1% default
precision?: number): [BigNumber, BigNumber];
/**
 * Split a certain amount of X liquidity into its two components (eg. base and fyToken)
 * @param { BigNumber } xReserves // eg. base reserves
 * @param { BigNumber } yReserves // eg. fyToken reservers
 * @param {BigNumber} xAmount // amount to split in wei
 * @param {BigNumber} asBn
 * @returns  [ BigNumber, BigNumber ] returns an array of [base, fyToken]
 */
export declare const splitLiquidity: (xReserves: BigNumber | string, yReserves: BigNumber | string, xAmount: BigNumber | string, asBn?: boolean) => [BigNumberish, BigNumberish];
/**
 * Calculate Slippage
 * @param { BigNumber } value
 * @param { BigNumber } slippage optional: defaults to 0.005 (0.5%)
 * @param { boolean } minimise optional: whether the result should be a minimum or maximum (default max)
 * @returns { string } human readable string
 */
export declare const calculateSlippage: (value: BigNumber | string, slippage?: BigNumber | string, minimise?: boolean) => string;
/**
 * Calculate Annualised Yield Rate
 * @param { BigNumber | string } tradeValue // current [base]
 * @param { BigNumber | string } amount // y[base] amount at maturity
 * @param { number } maturity  // date of maturity
 * @param { number } fromDate // ***optional*** start date - defaults to now()
 * @returns { string | undefined } human readable string
 */
export declare const calculateAPR: (tradeValue: BigNumber | string, amount: BigNumber | string, maturity: number, fromDate?: number) => string | undefined;
/**
 * Calculates the collateralization ratio
 * based on the collat amount and value and debt value.
 * @param { BigNumber | string } collateralAmount  amount of collateral (in wei)
 * @param { BigNumber | string } basePrice bases per unit of collateral (in wei)
 * @param { BigNumber | string } baseAmount amount base debt (in wei)
 * @param {boolean} asPercent OPTIONAL: flag to return ratio as a percentage
 * @returns { number | undefined } // can be undefined because of 0 baseAmount as a denominator.
 */
export declare const calculateCollateralizationRatio: (collateralAmount: BigNumber | string, basePrice: BigNumber | string, baseAmount: BigNumber | string, asPercent?: boolean) => number | undefined;
/**
 * Calculates the min collateralization ratio
 * based on the collat amount and value and debt value.
 * @param { BigNumber | string } basePrice bases per unit collateral (in wei)
 * @param { BigNumber | string } baseAmount amount of bases / debt (in wei)
 * @param {BigNumber | string} liquidationRatio  OPTIONAL: 1.5 (150%) as default
 * @param {BigNumber | string} existingCollateral  0 as default (as wei)
 * @param {Boolean} asBigNumber return as big number? in wei
 *
 * @returns BigNumber
 */
export declare const calculateMinCollateral: (basePrice: BigNumber | string, baseAmount: BigNumber | string, liquidationRatio: string, existingCollateral?: BigNumber | string) => BigNumber;
/**
 * Calcualtes the amount (base, or other variant) that can be borrowed based on
 * an amount of collateral (ETH, or other), and collateral price.
 *
 * @param {BigNumber | string} collateralAmount amount of collateral
 * @param {BigNumber | string} collateralPrice price of unit collateral (in currency x)
 * @param {BigNumber | string} debtValue value of debt (in currency x)
 * @param {BigNumber | string} liquidationRatio  OPTIONAL: 1.5 (150%) as default
 *
 * @returns {string}
 */
export declare const calculateBorrowingPower: (collateralAmount: BigNumber | string, collateralPrice: BigNumber | string, debtValue: BigNumber | string, liquidationRatio?: string) => string;
/**
 * Calcualtes the amount (base, or other variant) that can be borrowed based on
 * an amount of collateral (ETH, or other), and collateral price.
 *
 * @param {string} collateralAmount amount of collateral in human readable decimals
 * @param {string} debtAmount amount of debt in human readable decimals
 * @param {number} liquidationRatio  OPTIONAL: 1.5 (150%) as default
 *
 * @returns {string}
 */
export declare const calcLiquidationPrice: (collateralAmount: string, //
debtAmount: string, liquidationRatio: number) => string;
/**
 *  @param {BigNumber}  baseChange
 * @param {BigNumber}  fyTokenChange
 * @param {BigNumber}  poolBaseReserves
 * @param {BigNumber}  poolFyTokenRealReserves
 * @param {BigNumber}  poolTotalSupply
 *
 * @returns {BigNumber[]} [newBaseReserves, newFyTokenRealReserves, newTotalSupply, newFyTokenVirtualReserves]
 */
export declare const newPoolState: (baseChange: BigNumber, fyTokenChange: BigNumber, poolBaseReserves: BigNumber, poolFyTokenRealReserves: BigNumber, poolTotalSupply: BigNumber) => {
    baseReserves: BigNumber;
    fyTokenRealReserves: BigNumber;
    totalSupply: BigNumber;
    fyTokenVirtualReserves: BigNumber;
};
/**
 *  @param {BigNumber}  strategyTokenAmount
 * @param {BigNumber}  strategyTotalSupply
 * @param {BigNumber}  poolStrategyBalance
 * @param {BigNumber}  poolBaseReserves
 * @param {BigNumber}  poolFyTokenReserves
 * @param {BigNumber}  poolTotalSupply
 * @param {number}  poolTimeToMaturity
 *
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 *
 * @returns {BigNumber} [soldValue, totalValue]
 */
export declare const strategyTokenValue: (strategyTokenAmount: BigNumber | string, strategyTotalSupply: BigNumber, strategyPoolBalance: BigNumber, poolBaseReserves: BigNumber, poolFyTokenRealReserves: BigNumber, poolTotalSupply: BigNumber, poolTimeToMaturity: string | BigNumber, ts: BigNumber | string, g2: BigNumber | string, decimals: number) => [BigNumber, BigNumber];
/**
 * Calculates the estimated percentage of the pool given an inputted base amount.
 *
 * @param {BigNumber} input amount of base
 * @param {BigNumber} strategyTotalSupply strategy's total supply
 *
 * @returns {BigNumber}
 */
export declare const getPoolPercent: (input: BigNumber, strategyTotalSupply: BigNumber) => string;
/**
 * Calcualtes the MIN and MAX reserve ratios of a pool for a given slippage value
 *
 * @param {BigNumber} baseReserves
 * @param {BigNumber} fyTokenReserves
 * @param {number} slippage
 *
 * @returns {[BigNumber, BigNumber] }
 */
export declare const calcPoolRatios: (baseReserves: BigNumber, fyTokenReserves: BigNumber, slippage?: number) => [BigNumber, BigNumber];
/**
 * Calculate accrued debt value after maturity
 *
 * @param {BigNumber} rate
 * @param {BigNumber} rateAtMaturity
 * @param {BigNumberr} debt
 *
 * @returns {[BigNumber, BigNumber]} accruedDebt, debt less accrued value
 */
export declare const calcAccruedDebt: (rate: BigNumber, rateAtMaturity: BigNumber, debt: BigNumber) => BigNumber[];

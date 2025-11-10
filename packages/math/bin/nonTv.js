"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcAccruedDebt = exports.calcPoolRatios = exports.getPoolPercent = exports.strategyTokenValue = exports.newPoolState = exports.calcLiquidationPrice = exports.calculateBorrowingPower = exports.calculateMinCollateral = exports.calculateCollateralizationRatio = exports.calculateAPR = exports.calculateSlippage = exports.splitLiquidity = exports.divDecimal = exports.mulDecimal = exports.toBn = exports.floorDecimal = exports.secondsToFrom = exports.decimal18ToDecimalN = exports.decimalNToDecimal18 = exports.secondsInTenYears = exports.secondsInOneYear = exports.SECONDS_PER_YEAR = exports.WAD_BN = exports.WAD_RAY_BN = exports.MINUS_ONE_BN = exports.ONE_BN = exports.ZERO_BN = exports.RAY_DEC = exports.MAX_DEC = exports.TWO_DEC = exports.ONE_DEC = exports.ZERO_DEC = exports.MAX_128 = exports.MAX_256 = void 0;
exports.bytesToBytes32 = bytesToBytes32;
exports.mint = mint;
exports.burn = burn;
exports.burnFromStrategy = burnFromStrategy;
exports.mintWithBase = mintWithBase;
exports.burnForBase = burnForBase;
exports.sellBase = sellBase;
exports.sellFYToken = sellFYToken;
exports.buyBase = buyBase;
exports.buyFYToken = buyFYToken;
exports.maxBaseIn = maxBaseIn;
exports.maxBaseOut = maxBaseOut;
exports.maxFyTokenIn = maxFyTokenIn;
exports.maxFyTokenOut = maxFyTokenOut;
exports.fyTokenForMint = fyTokenForMint;
/* eslint-disable @typescript-eslint/naming-convention */
const ethers_1 = require("ethers");
const decimal_js_1 = require("decimal.js");
decimal_js_1.Decimal.set({ precision: 64 });
/* constants exposed for export */
exports.MAX_256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
exports.MAX_128 = '0xffffffffffffffffffffffffffffffff';
exports.ZERO_DEC = new decimal_js_1.Decimal(0);
exports.ONE_DEC = new decimal_js_1.Decimal(1);
exports.TWO_DEC = new decimal_js_1.Decimal(2);
exports.MAX_DEC = new decimal_js_1.Decimal(exports.MAX_256);
exports.RAY_DEC = new decimal_js_1.Decimal('1000000000000000000000000000');
exports.ZERO_BN = ethers_1.ethers.constants.Zero;
exports.ONE_BN = ethers_1.ethers.constants.One;
exports.MINUS_ONE_BN = ethers_1.ethers.constants.One.mul(-1);
exports.WAD_RAY_BN = ethers_1.BigNumber.from('1000000000000000000000000000');
exports.WAD_BN = ethers_1.BigNumber.from('1000000000000000000');
exports.SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
exports.secondsInOneYear = ethers_1.BigNumber.from(31557600);
exports.secondsInTenYears = exports.secondsInOneYear.mul(10); // Seconds in 10 years
/* Convenience naming local constants */
const ZERO = exports.ZERO_DEC;
const ONE = exports.ONE_DEC;
const TWO = exports.TWO_DEC;
const MAX = exports.MAX_DEC;
/* Protocol Specific Constants */
const k_default = new decimal_js_1.Decimal(1 / exports.secondsInTenYears.toNumber()).mul(Math.pow(2, 64)); // inv of seconds in 10 years
const g1_default = new decimal_js_1.Decimal(950 / 1000).mul(Math.pow(2, 64));
const g2_default = new decimal_js_1.Decimal(1000 / 950).mul(Math.pow(2, 64));
const precisionFee = new decimal_js_1.Decimal(1000000000000);
/** *************************
 Support functions
 *************************** */
/**
 * Convert a bignumber with any decimal to a bn with decimal of 18
 * @param x bn to convert.
 * @param decimals of the current bignumber
 * @returns BigNumber
 */
const decimalNToDecimal18 = (x, decimals) => 
// BigNumber.from(x.toString() + '0'.repeat(18 - decimals));
ethers_1.BigNumber.from(x).mul(ethers_1.BigNumber.from('10').pow(18 - decimals));
exports.decimalNToDecimal18 = decimalNToDecimal18;
/**
 * Convert a decimal18 to a bn of any decimal
 * @param x 18 decimal to reduce
 * @param decimals required
 * @returns BigNumber
 */
const decimal18ToDecimalN = (x, decimals) => {
    const str = x.toString();
    const first = str.slice(0, str.length - (18 - decimals));
    return ethers_1.BigNumber.from(first || 0); // zero if slice removes more than the number of decimals
};
exports.decimal18ToDecimalN = decimal18ToDecimalN;
/**
 * TODO: maybe move this out to gerneral yieldUtils
 * Convert bytesX to bytes32 (BigEndian?)
 * @param x string to convert.
 * @param n current bytes value eg. bytes6 or bytes12
 * @returns string bytes32
 */
function bytesToBytes32(x, n) {
    return x + '00'.repeat(32 - n);
}
/**
 * TODO: Possibily move this out to general yieldUtils?
 * @param { BigNumber | string } to unix time
 * @param { BigNumber | string } from  unix time *optional* default: now
 * @returns { string } as number seconds 'from' -> 'to'
 */
const secondsToFrom = (to, from = ethers_1.BigNumber.from(Math.round(new Date().getTime() / 1000)) // OPTIONAL: FROM defaults to current time if omitted
) => {
    const to_ = ethers_1.ethers.BigNumber.isBigNumber(to) ? to : ethers_1.BigNumber.from(to);
    const from_ = ethers_1.ethers.BigNumber.isBigNumber(from) ? from : ethers_1.BigNumber.from(from);
    return to_.sub(from_).toString();
};
exports.secondsToFrom = secondsToFrom;
/**
 * @param { BigNumber | string } value
 * @returns { string }
 */
const floorDecimal = (value) => decimal_js_1.Decimal.floor(value.toString()).toFixed();
exports.floorDecimal = floorDecimal;
/**
 * @param { Decimal } value
 * @returns { BigNumber }
 */
const toBn = (value) => ethers_1.BigNumber.from((0, exports.floorDecimal)(value.toFixed()));
exports.toBn = toBn;
/**
 * @param { BigNumber | string } multiplicant
 * @param { BigNumber | string } multiplier
 * @param { string } precisionDifference  // Difference between multiplicant and mulitplier precision (eg. wei vs ray '1e-27' )
 * @returns { string } in decimal precision of the multiplicant
 */
const mulDecimal = (multiplicant, multiplier, precisionDifference = '1' // DEFAULT = 1 (same precision)
) => {
    const multiplicant_ = new decimal_js_1.Decimal(multiplicant.toString());
    const multiplier_ = new decimal_js_1.Decimal(multiplier.toString());
    const _preDif = new decimal_js_1.Decimal(precisionDifference.toString());
    const _normalisedMul = multiplier_.mul(_preDif);
    return multiplicant_.mul(_normalisedMul).toFixed();
};
exports.mulDecimal = mulDecimal;
/**
 * @param  { BigNumber | string } numerator
 * @param { BigNumber | string } divisor
 * @param { BigNumber | string } precisionDifference // Difference between multiplicant and mulitplier precision (eg. wei vs ray '1e-27' )
 * @returns { string } in decimal precision of the numerator
 */
const divDecimal = (numerator, divisor, precisionDifference = '1' // DEFAULT = 1 (same precision)
) => {
    const numerator_ = new decimal_js_1.Decimal(numerator.toString());
    const divisor_ = new decimal_js_1.Decimal(divisor.toString());
    const _preDif = new decimal_js_1.Decimal(precisionDifference.toString());
    const _normalisedDiv = divisor_.mul(_preDif);
    return numerator_.div(_normalisedDiv).toFixed();
};
exports.divDecimal = divDecimal;
/**
 * specific Yieldspace helper functions
 * */
const _computeA = (timeToMaturity, ts, g) => {
    const timeTillMaturity_ = new decimal_js_1.Decimal(timeToMaturity.toString());
    // console.log( new Decimal(BigNumber.from(g).toString()).div(2 ** 64).toString() )
    const _g = new decimal_js_1.Decimal(ethers_1.BigNumber.from(g).toString()).div(Math.pow(2, 64));
    const _ts = new decimal_js_1.Decimal(ethers_1.BigNumber.from(ts).toString()).div(Math.pow(2, 64));
    // t = ts * timeTillMaturity
    const t = _ts.mul(timeTillMaturity_);
    // a = (1 - gt)
    const a = ONE.sub(_g.mul(t));
    const invA = ONE.div(a);
    return [a, invA]; /* returns a and inverse of a */
};
const _computeB = (timeToMaturity, ts, g) => {
    const timeTillMaturity_ = new decimal_js_1.Decimal(timeToMaturity.toString());
    const _g = new decimal_js_1.Decimal(ethers_1.BigNumber.from(g).toString()).div(Math.pow(2, 64));
    const _ts = new decimal_js_1.Decimal(ethers_1.BigNumber.from(ts).toString()).div(Math.pow(2, 64));
    // t = ts * timeTillMaturity
    const t = _ts.mul(timeTillMaturity_);
    // b = (1 - t/g)
    const b = ONE.sub(t.div(_g));
    const invB = ONE.div(b);
    return [b, invB]; /* returns b and inverse of b */
};
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
function mint(baseReserves, fyTokenReserves, totalSupply, base, fromBase = false) {
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves.toString());
    const supply_ = new decimal_js_1.Decimal(totalSupply.toString());
    const base_ = new decimal_js_1.Decimal(base.toString());
    const m = fromBase ? supply_.mul(base_).div(baseReserves_) : supply_.mul(base_).div(fyTokenReserves_);
    const y = fromBase ? fyTokenReserves_.mul(m).div(supply_) : baseReserves_.mul(m).div(supply_);
    return [(0, exports.toBn)(m), (0, exports.toBn)(y)];
}
/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } lpTokens
 * @returns {[BigNumber, BigNumber]}
 *
 * https://www.desmos.com/calculator/ubsalzunpo
 */
function burn(baseReserves, fyTokenReserves, totalSupply, lpTokens) {
    const Z = new decimal_js_1.Decimal(baseReserves.toString());
    const Y = new decimal_js_1.Decimal(fyTokenReserves.toString());
    const S = new decimal_js_1.Decimal(totalSupply.toString());
    const x = new decimal_js_1.Decimal(lpTokens.toString());
    const z = x.mul(Z).div(S);
    const y = x.mul(Y).div(S);
    return [(0, exports.toBn)(z), (0, exports.toBn)(y)];
}
/**
 *
 * @param { BigNumber | string } poolTotalSupply
 * @param { BigNumber | string } strategyTotalsupply
 * @param { BigNumber | string } strategyTokensToBurn
 *
 * @returns {BigNumber}
 *
 */
function burnFromStrategy(poolTotalSupply, strategyTotalsupply, strategyTokensToBurn) {
    const pS = new decimal_js_1.Decimal(poolTotalSupply.toString());
    const sS = new decimal_js_1.Decimal(strategyTotalsupply.toString());
    const tS = new decimal_js_1.Decimal(strategyTokensToBurn.toString());
    const x = pS.mul(tS.div(sS));
    return (0, exports.toBn)(x);
}
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
function mintWithBase(baseReserves, fyTokenReservesVirtual, fyTokenReservesReal, fyToken, timeTillMaturity, ts, g1, decimals) {
    const Z = new decimal_js_1.Decimal(baseReserves.toString());
    const YR = new decimal_js_1.Decimal(fyTokenReservesReal.toString());
    const supply = fyTokenReservesVirtual.sub(fyTokenReservesReal);
    const y = new decimal_js_1.Decimal(fyToken.toString());
    // buyFyToken:
    const z1 = new decimal_js_1.Decimal(buyFYToken(baseReserves, fyTokenReservesVirtual, fyToken, timeTillMaturity, ts, g1, decimals).toString());
    const Z2 = Z.add(z1); // Base reserves after the trade
    const YR2 = YR.sub(y); // FYToken reserves after the trade
    // Mint specifying how much fyToken to take in. Reverse of `mint`.
    const [minted, z2] = mint((0, exports.toBn)(Z2), (0, exports.toBn)(YR2), supply, fyToken, false);
    return [minted, (0, exports.toBn)(z1).add(z2)];
}
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
function burnForBase(baseReserves, fyTokenReservesVirtual, fyTokenReservesReal, lpTokens, timeTillMaturity, ts, g2, decimals) {
    const supply = fyTokenReservesVirtual.sub(fyTokenReservesReal);
    // Burn FyToken
    const [z1, y] = burn(baseReserves, fyTokenReservesReal, supply, lpTokens);
    // Sell FyToken for base
    const z2 = sellFYToken(baseReserves, fyTokenReservesVirtual, y, timeTillMaturity, ts, g2, decimals);
    const z1D = new decimal_js_1.Decimal(z1.toString());
    const z2D = new decimal_js_1.Decimal(z2.toString());
    return (0, exports.toBn)(z1D.add(z2D));
}
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
function sellBase(baseReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals) {
    /* convert to 18 decimals, if required */
    const baseReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(baseReserves), decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenReserves), decimals);
    const base18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(base), decimals);
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const base_ = new decimal_js_1.Decimal(base18.toString());
    const [a, invA] = _computeA(timeTillMaturity, ts, g1);
    const Za = baseReserves_.pow(a);
    const Ya = fyTokenReserves_.pow(a);
    const Zxa = baseReserves_.add(base_).pow(a);
    const sum = Za.add(Ya).sub(Zxa);
    const y = fyTokenReserves_.sub(sum.pow(invA));
    const yFee = y.sub(precisionFee);
    return yFee.isNaN() ? ethers_1.ethers.constants.Zero : (0, exports.decimal18ToDecimalN)((0, exports.toBn)(yFee), decimals);
}
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
function sellFYToken(baseReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals) {
    /* convert to 18 decimals, if required */
    const baseReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(baseReserves), decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenReserves), decimals);
    const fyToken18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyToken), decimals);
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const fyDai_ = new decimal_js_1.Decimal(fyToken18.toString());
    const [a, invA] = _computeA(timeTillMaturity, ts, g2);
    const Za = baseReserves_.pow(a);
    const Ya = fyTokenReserves_.pow(a);
    const Yxa = fyTokenReserves_.add(fyDai_).pow(a);
    const sum = Za.add(Ya.sub(Yxa));
    const y = baseReserves_.sub(sum.pow(invA));
    const yFee = y.sub(precisionFee);
    return yFee.isNaN() ? ethers_1.ethers.constants.Zero : (0, exports.decimal18ToDecimalN)((0, exports.toBn)(yFee), decimals);
}
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
function buyBase(baseReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals) {
    /* convert to 18 decimals, if required */
    const baseReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(baseReserves), decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenReserves), decimals);
    const base18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(base), decimals);
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const base_ = new decimal_js_1.Decimal(base18.toString());
    const [a, invA] = _computeA(timeTillMaturity, ts, g2);
    const Za = baseReserves_.pow(a);
    const Ya = fyTokenReserves_.pow(a);
    const Zxa = baseReserves_.sub(base_).pow(a);
    const sum = Za.add(Ya).sub(Zxa);
    const y = sum.pow(invA).sub(fyTokenReserves_);
    const yFee = y.add(precisionFee);
    return yFee.isNaN() ? ethers_1.ethers.constants.Zero : (0, exports.decimal18ToDecimalN)((0, exports.toBn)(yFee), decimals);
}
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
function buyFYToken(baseReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals) {
    /* convert to 18 decimals, if required */
    const baseReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(baseReserves), decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenReserves), decimals);
    const fyToken18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyToken), decimals);
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const fyDai_ = new decimal_js_1.Decimal(fyToken18.toString());
    // const _g = withNoFee ? ONE : g1;
    const [a, invA] = _computeA(timeTillMaturity, ts, g1);
    const Za = baseReserves_.pow(a);
    const Ya = fyTokenReserves_.pow(a);
    const Yxa = fyTokenReserves_.sub(fyDai_).pow(a);
    const sum = Za.add(Ya.sub(Yxa));
    const y = sum.pow(invA).sub(baseReserves_);
    const yFee = y.add(precisionFee);
    return yFee.isNaN() ? ethers_1.ethers.constants.Zero : (0, exports.decimal18ToDecimalN)((0, exports.toBn)(yFee), decimals);
}
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
function maxBaseIn(baseReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals) {
    /* calculate the max possible fyToken (fyToken amount) */
    const fyTokenAmountOut = maxFyTokenOut(baseReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals);
    /* convert to 18 decimals, if required */
    const baseReserves18 = (0, exports.decimalNToDecimal18)(baseReserves, decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(fyTokenReserves, decimals);
    const fyTokenAmountOut18 = (0, exports.decimalNToDecimal18)(fyTokenAmountOut, decimals);
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const fyTokenAmountOut_ = new decimal_js_1.Decimal(fyTokenAmountOut18.toString());
    /*  abort if maxFyTokenOut() is zero */
    if (fyTokenAmountOut_.eq(ZERO))
        return exports.ZERO_BN;
    // baseInForFYTokenOut(baseReserves, fyTokenReserves, _maxFYTokenOut, timeTillMaturity, ts, g)
    const [a, invA] = _computeA(timeTillMaturity, ts, g1);
    const za = baseReserves_.pow(a);
    const ya = fyTokenReserves_.pow(a);
    // yx =
    const yx = fyTokenReserves_.sub(fyTokenAmountOut_);
    // yxa = yx ** a
    const yxa = yx.pow(a);
    // sum = za + ya - yxa
    const sum = za.add(ya).sub(yxa);
    // result = (sum ** (1/a)) - baseReserves
    const res = sum.pow(invA).sub(baseReserves_);
    /* Handle precision variations */
    const safeRes = res.gt(MAX.sub(precisionFee)) ? MAX : res.add(precisionFee);
    /* Convert to back to token native decimals, if required */
    return (0, exports.decimal18ToDecimalN)((0, exports.toBn)(safeRes), decimals);
}
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
function maxBaseOut(baseReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals) {
    /* calculate the max possible fyToken (fyToken amount) */
    const fyTokenAmountIn = maxFyTokenIn(baseReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals);
    /* convert to 18 decimals, if required */
    const baseReserves18 = (0, exports.decimalNToDecimal18)(baseReserves, decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(fyTokenReserves, decimals);
    const fyTokenAmountIn18 = (0, exports.decimalNToDecimal18)(fyTokenAmountIn, decimals);
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const fyTokenAmountIn_ = new decimal_js_1.Decimal(fyTokenAmountIn18.toString());
    // baseOutForFYTokenIn(baseReserves, fyTokenReserves, _maxFYTokenIn, timeTillMaturity, ts, g);
    const [a, invA] = _computeA(timeTillMaturity, ts, g2);
    const za = baseReserves_.pow(a);
    const ya = fyTokenReserves_.pow(a);
    // yx = fyDayReserves + fyTokenAmount
    const yx = fyTokenReserves_.add(fyTokenAmountIn_);
    // yxa = yx ** a
    const yxa = yx.pow(a);
    // sum = za + ya - yxa
    const sum = za.add(ya).sub(yxa);
    // result = baseReserves - (sum ** (1/a))
    const res = baseReserves_.sub(sum.pow(invA));
    /* Handle precision variations */
    const safeRes = res.gt(precisionFee) ? res.sub(precisionFee) : ZERO;
    /* Convert to back to token native decimals, if required */
    return (0, exports.decimal18ToDecimalN)((0, exports.toBn)(safeRes), decimals);
}
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
function maxFyTokenIn(baseReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals) {
    /* convert to 18 decimals, if required */
    const baseReserves18 = (0, exports.decimalNToDecimal18)(baseReserves, decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(fyTokenReserves, decimals);
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const [b, invB] = _computeB(timeTillMaturity, ts, g2);
    const xa = baseReserves_.pow(b);
    const ya = fyTokenReserves_.pow(b);
    const sum = xa.add(ya);
    const res = sum.pow(invB).sub(fyTokenReserves_);
    /* Handle precision variations */
    const safeRes = res.gt(precisionFee) ? res.sub(precisionFee) : ZERO;
    /* convert to back to token native decimals, if required */
    return (0, exports.decimal18ToDecimalN)((0, exports.toBn)(safeRes), decimals);
}
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
function maxFyTokenOut(baseReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals) {
    /* convert to 18 decimals, if required */
    const baseReserves18 = (0, exports.decimalNToDecimal18)(baseReserves, decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(fyTokenReserves, decimals);
    /* convert to decimal for the math */
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const [a, invA] = _computeA(timeTillMaturity, ts, g1);
    const xa = baseReserves_.pow(a);
    const ya = fyTokenReserves_.pow(a);
    const xy = xa.add(ya);
    const inaccessible = xy.div(2).pow(invA);
    const res = inaccessible.gt(fyTokenReserves_) ? ZERO : fyTokenReserves_.sub(inaccessible);
    /* Handle precision variations */
    const safeRes = res.gt(MAX.sub(precisionFee)) ? MAX : res.add(precisionFee);
    /* convert to back to token native decimals, if required */
    return (0, exports.decimal18ToDecimalN)((0, exports.toBn)(safeRes), decimals);
}
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
function fyTokenForMint(baseReserves, fyTokenRealReserves, fyTokenVirtualReserves, base, timeTillMaturity, ts, g1, decimals, slippage = 0.01, // 1% default
precision = 0.0001 // 0.01% default
) {
    const base_ = new decimal_js_1.Decimal(base.toString());
    const minSurplus = base_.mul(slippage);
    const maxSurplus = minSurplus.add(base_.mul(precision));
    let maxFYToken = new decimal_js_1.Decimal(maxFyTokenOut(baseReserves, fyTokenVirtualReserves, timeTillMaturity, ts, g1, decimals).toString());
    let minFYToken = exports.ZERO_DEC;
    if (maxFYToken.lt(2))
        return [exports.ZERO_BN, exports.ZERO_BN]; // won't be able to parse using toBn
    let i = 0;
    while (true) {
        /* NB return ZERO when not converging > not mintable */
        // eslint-disable-next-line no-plusplus
        if (i++ > 100) {
            console.log('No solution');
            return [exports.ZERO_BN, exports.ZERO_BN];
        }
        const fyTokenToBuy = minFYToken.add(maxFYToken).div(2);
        // console.log('fyToken tobuy',  fyTokenToBuy.toFixed() )
        const baseIn = mintWithBase(baseReserves, fyTokenVirtualReserves, fyTokenRealReserves, (0, exports.toBn)(fyTokenToBuy), timeTillMaturity, ts, g1, decimals)[1];
        const surplus = base_.sub(new decimal_js_1.Decimal(baseIn.toString()));
        // console.log( 'min:',  minSurplus.toFixed() ,  'max:',   maxSurplus.toFixed() , 'surplus: ', surplus.toFixed() )
        // Just right
        if (minSurplus.lt(surplus) && surplus.lt(maxSurplus)) {
            // console.log('fyToken to buy: ', fyTokenToBuy.toFixed(), 'surplus: ', surplus.toFixed());
            return [(0, exports.toBn)(fyTokenToBuy), (0, exports.toBn)(surplus)];
        }
        // Bought too much, lower the max and the buy
        if (baseIn.gt(base) || surplus.lt(minSurplus)) {
            // console.log('Bought too much');
            maxFYToken = fyTokenToBuy;
        }
        // Bought too little, raise the min and the buy
        if (surplus.gt(maxSurplus)) {
            // console.log('Bought too little');
            minFYToken = fyTokenToBuy;
        }
    }
}
/**
 * Split a certain amount of X liquidity into its two components (eg. base and fyToken)
 * @param { BigNumber } xReserves // eg. base reserves
 * @param { BigNumber } yReserves // eg. fyToken reservers
 * @param {BigNumber} xAmount // amount to split in wei
 * @param {BigNumber} asBn
 * @returns  [ BigNumber, BigNumber ] returns an array of [base, fyToken]
 */
const splitLiquidity = (xReserves, yReserves, xAmount, asBn = true) => {
    const xReserves_ = new decimal_js_1.Decimal(xReserves.toString());
    const yReserves_ = new decimal_js_1.Decimal(yReserves.toString());
    const xAmount_ = new decimal_js_1.Decimal(xAmount.toString());
    const xPortion = xAmount_.mul(xReserves_).div(yReserves_.add(xReserves_));
    const yPortion = xAmount_.sub(xPortion);
    if (asBn)
        return [(0, exports.toBn)(xPortion), (0, exports.toBn)(yPortion)];
    return [xPortion.toFixed(), yPortion.toFixed()];
};
exports.splitLiquidity = splitLiquidity;
/**
 * Calculate Slippage
 * @param { BigNumber } value
 * @param { BigNumber } slippage optional: defaults to 0.005 (0.5%)
 * @param { boolean } minimise optional: whether the result should be a minimum or maximum (default max)
 * @returns { string } human readable string
 */
const calculateSlippage = (value, slippage = '0.005', minimise = false) => {
    const value_ = new decimal_js_1.Decimal(value.toString());
    const _slippageAmount = (0, exports.floorDecimal)((0, exports.mulDecimal)(value, slippage));
    if (minimise) {
        return value_.sub(_slippageAmount).toFixed();
    }
    return value_.add(_slippageAmount).toFixed();
};
exports.calculateSlippage = calculateSlippage;
/**
 * Calculate Annualised Yield Rate
 * @param { BigNumber | string } tradeValue // current [base]
 * @param { BigNumber | string } amount // y[base] amount at maturity
 * @param { number } maturity  // date of maturity
 * @param { number } fromDate // ***optional*** start date - defaults to now()
 * @returns { string | undefined } human readable string
 */
const calculateAPR = (tradeValue, amount, maturity, fromDate = Math.round(new Date().getTime() / 1000) // if not provided, defaults to current time.
) => {
    const tradeValue_ = new decimal_js_1.Decimal(tradeValue.toString());
    const amount_ = new decimal_js_1.Decimal(amount.toString());
    if (maturity > Math.round(new Date().getTime() / 1000)) {
        const secsToMaturity = maturity - fromDate;
        const propOfYear = new decimal_js_1.Decimal(secsToMaturity / exports.SECONDS_PER_YEAR);
        const priceRatio = amount_.div(tradeValue_);
        const powRatio = ONE.div(propOfYear);
        const apr = priceRatio.pow(powRatio).sub(ONE);
        if (apr.gt(ZERO) && apr.lt(100)) {
            return apr.mul(100).toFixed();
        }
        return undefined;
    }
    return undefined;
};
exports.calculateAPR = calculateAPR;
/**
 * Calculates the collateralization ratio
 * based on the collat amount and value and debt value.
 * @param { BigNumber | string } collateralAmount  amount of collateral (in wei)
 * @param { BigNumber | string } basePrice bases per unit of collateral (in wei)
 * @param { BigNumber | string } baseAmount amount base debt (in wei)
 * @param {boolean} asPercent OPTIONAL: flag to return ratio as a percentage
 * @returns { number | undefined } // can be undefined because of 0 baseAmount as a denominator.
 */
const calculateCollateralizationRatio = (collateralAmount, basePrice, baseAmount, asPercent = false // OPTIONAL:  flag to return as percentage
) => {
    if (ethers_1.ethers.BigNumber.isBigNumber(baseAmount) ? baseAmount.isZero() : baseAmount === '0') {
        return undefined;
    }
    const _baseUnitPrice = (0, exports.divDecimal)(basePrice, exports.WAD_BN);
    const _baseVal = (0, exports.divDecimal)(baseAmount, _baseUnitPrice); // base/debt value in terms of collateral
    const _ratio = (0, exports.divDecimal)(collateralAmount, _baseVal); // collateralValue divide by debtValue
    if (asPercent) {
        return parseFloat((0, exports.mulDecimal)('100', _ratio));
    }
    return parseFloat(_ratio);
};
exports.calculateCollateralizationRatio = calculateCollateralizationRatio;
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
const calculateMinCollateral = (basePrice, baseAmount, liquidationRatio, existingCollateral = '0' // OPTIONAL add in
) => {
    const _baseUnitPrice = (0, exports.divDecimal)(basePrice, exports.WAD_BN);
    const _baseVal = (0, exports.divDecimal)(baseAmount, _baseUnitPrice);
    const _existingCollateralValue = new decimal_js_1.Decimal(ethers_1.ethers.utils.formatUnits(existingCollateral, 18));
    const _minCollatValue = new decimal_js_1.Decimal((0, exports.mulDecimal)(_baseVal, liquidationRatio));
    const requiredCollateral = _existingCollateralValue.gt(_minCollatValue)
        ? new decimal_js_1.Decimal('0')
        : _minCollatValue.sub(_existingCollateralValue); // .add('1'); // hmm, i had to add one check
    return (0, exports.toBn)(requiredCollateral);
};
exports.calculateMinCollateral = calculateMinCollateral;
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
const calculateBorrowingPower = (collateralAmount, collateralPrice, debtValue, liquidationRatio = '1.5' // OPTIONAL: 150% as default
) => {
    const collateralValue = (0, exports.mulDecimal)(collateralAmount, collateralPrice);
    const maxSafeDebtValue_ = new decimal_js_1.Decimal((0, exports.divDecimal)(collateralValue, liquidationRatio));
    const debtValue_ = new decimal_js_1.Decimal(debtValue.toString());
    const _max = debtValue_.lt(maxSafeDebtValue_) ? maxSafeDebtValue_.sub(debtValue_) : new decimal_js_1.Decimal('0');
    return _max.toFixed(0);
};
exports.calculateBorrowingPower = calculateBorrowingPower;
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
const calcLiquidationPrice = (collateralAmount, //
debtAmount, liquidationRatio) => {
    const _collateralAmount = parseFloat(collateralAmount);
    const _debtAmount = parseFloat(debtAmount);
    // condition/logic: collAmount*price > debtAmount*ratio
    const liquidationPoint = _debtAmount * liquidationRatio;
    const price = (liquidationPoint / _collateralAmount).toString();
    return price;
};
exports.calcLiquidationPrice = calcLiquidationPrice;
/**
 *  @param {BigNumber}  baseChange
 * @param {BigNumber}  fyTokenChange
 * @param {BigNumber}  poolBaseReserves
 * @param {BigNumber}  poolFyTokenRealReserves
 * @param {BigNumber}  poolTotalSupply
 *
 * @returns {BigNumber[]} [newBaseReserves, newFyTokenRealReserves, newTotalSupply, newFyTokenVirtualReserves]
 */
const newPoolState = (baseChange, fyTokenChange, poolBaseReserves, poolFyTokenRealReserves, poolTotalSupply) => {
    const newBaseReserves = poolBaseReserves.add(baseChange);
    const newFyTokenRealReserves = poolFyTokenRealReserves.add(fyTokenChange);
    const newTotalSupply = poolTotalSupply.add(fyTokenChange);
    const newFyTokenVirtualReserves = newTotalSupply.add(newFyTokenRealReserves); // virtualReserves  = totalsupply + realBalance
    return {
        baseReserves: newBaseReserves,
        fyTokenRealReserves: newFyTokenRealReserves,
        totalSupply: newTotalSupply,
        fyTokenVirtualReserves: newFyTokenVirtualReserves,
    };
};
exports.newPoolState = newPoolState;
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
const strategyTokenValue = (strategyTokenAmount, strategyTotalSupply, strategyPoolBalance, poolBaseReserves, poolFyTokenRealReserves, poolTotalSupply, poolTimeToMaturity, ts, g2, decimals) => {
    // 0. Calc amount of lpTokens from strat token burn
    // 1. calc amount base/fyToken recieved from burn
    // 2. calculate new reserves (baseReserves and fyTokenReserevs)
    // 3. try trade with new reserves
    // 4. add the estimated base derived from selling fyTokens and the current base tokens of the poolToken
    const lpReceived = burnFromStrategy(strategyPoolBalance, strategyTotalSupply, strategyTokenAmount);
    const [_baseTokenReceived, _fyTokenReceived] = burn(poolBaseReserves, poolFyTokenRealReserves, poolTotalSupply, lpReceived);
    const newPool = (0, exports.newPoolState)(_baseTokenReceived.mul(-1), _fyTokenReceived.mul(-1), poolBaseReserves, poolFyTokenRealReserves, poolTotalSupply);
    const sellValue = sellFYToken(newPool.baseReserves, newPool.fyTokenVirtualReserves, _fyTokenReceived, poolTimeToMaturity.toString(), ts, g2, decimals);
    const totalValue = sellValue.add(_baseTokenReceived);
    return [sellValue, totalValue];
};
exports.strategyTokenValue = strategyTokenValue;
/**
 * Calculates the estimated percentage of the pool given an inputted base amount.
 *
 * @param {BigNumber} input amount of base
 * @param {BigNumber} strategyTotalSupply strategy's total supply
 *
 * @returns {BigNumber}
 */
const getPoolPercent = (input, strategyTotalSupply) => {
    const input_ = new decimal_js_1.Decimal(input.toString());
    const totalSupply_ = new decimal_js_1.Decimal(strategyTotalSupply.toString());
    const ratio = input_.div(totalSupply_.add(input_));
    const percent = ratio.mul(new decimal_js_1.Decimal(100));
    return percent.toString();
};
exports.getPoolPercent = getPoolPercent;
/**
 * Calcualtes the MIN and MAX reserve ratios of a pool for a given slippage value
 *
 * @param {BigNumber} baseReserves
 * @param {BigNumber} fyTokenReserves
 * @param {number} slippage
 *
 * @returns {[BigNumber, BigNumber] }
 */
const calcPoolRatios = (baseReserves, fyTokenReserves, slippage = 0.1) => {
    const baseReserves_ = new decimal_js_1.Decimal(baseReserves.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves.toString());
    const slippage_ = new decimal_js_1.Decimal(slippage.toString());
    const wad = new decimal_js_1.Decimal(exports.WAD_BN.toString());
    const ratio = baseReserves_.div(fyTokenReserves_).mul(wad);
    const ratioSlippage = ratio.mul(slippage_);
    const min = (0, exports.toBn)(ratio.sub(ratioSlippage));
    const max = (0, exports.toBn)(ratio.add(ratioSlippage));
    return [min, max];
};
exports.calcPoolRatios = calcPoolRatios;
/**
 * Calculate accrued debt value after maturity
 *
 * @param {BigNumber} rate
 * @param {BigNumber} rateAtMaturity
 * @param {BigNumberr} debt
 *
 * @returns {[BigNumber, BigNumber]} accruedDebt, debt less accrued value
 */
const calcAccruedDebt = (rate, rateAtMaturity, debt) => {
    const rate_ = new decimal_js_1.Decimal(rate.toString());
    const rateAtMaturity_ = new decimal_js_1.Decimal(rateAtMaturity.toString());
    const debt_ = new decimal_js_1.Decimal(debt.toString());
    const accRatio_ = rate_.div(rateAtMaturity_);
    const invRatio_ = rateAtMaturity_.div(rate_); // to reverse calc the debt LESS the accrued value
    const accruedDebt = !accRatio_.isNaN() ? debt_.mul(accRatio_) : debt_;
    const debtLessAccrued = debt_.mul(invRatio_);
    return [(0, exports.toBn)(accruedDebt), (0, exports.toBn)(debtLessAccrued)];
};
exports.calcAccruedDebt = calcAccruedDebt;
//# sourceMappingURL=nonTv.js.map
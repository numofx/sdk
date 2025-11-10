"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharesAPY = exports.getFyTokenAPY = exports.getFeesAPY = exports.getPoolBaseValue = exports.getFyTokenPrice = exports.getSharesFromBase = exports.getBaseFromShares = exports.getTimeStretchYears = exports.calcInterestRate = exports.changeRateNonTv = exports.calcAccruedDebt = exports.calcPoolRatios = exports.getPoolPercent = exports.strategyTokenValue = exports.newPoolState = exports.calcLiquidationPrice = exports.calculateBorrowingPower = exports.calculateMinCollateral = exports.calculateCollateralizationRatio = exports.calculateAPR = exports.calculateSlippage = exports.splitLiquidity = exports._getC = exports.divDecimal = exports.mulDecimal = exports.toBn = exports.floorDecimal = exports.secondsToFrom = exports.decimal18ToDecimalN = exports.decimalNToDecimal18 = exports.mu_DEFAULT = exports.c_DEFAULT = exports.g2_DEFAULT = exports.g1_DEFAULT = exports.k = exports.secondsInTenYears = exports.secondsInOneYear = exports.SECONDS_PER_YEAR = exports.WAD_BN = exports.WAD_RAY_BN = exports.MINUS_ONE_BN = exports.ONE_BN = exports.ZERO_BN = exports.RAY_DEC = exports.MAX_DEC = exports.TWO_DEC = exports.ONE_DEC = exports.ZERO_DEC = exports.MAX_128 = exports.MAX_256 = void 0;
exports.bytesToBytes32 = bytesToBytes32;
exports.baseIdFromSeriesId = baseIdFromSeriesId;
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
exports.invariant = invariant;
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
exports.k = new decimal_js_1.Decimal(1 / ethers_1.BigNumber.from(exports.SECONDS_PER_YEAR).mul(10).toNumber()).mul(Math.pow(2, 64)); // inv of seconds in 10 years
exports.g1_DEFAULT = new decimal_js_1.Decimal(950 / 1000).mul(Math.pow(2, 64));
exports.g2_DEFAULT = new decimal_js_1.Decimal(1000 / 950).mul(Math.pow(2, 64));
exports.c_DEFAULT = '0x10000000000000000'; // 1 in 64 bit
exports.mu_DEFAULT = '0x10000000000000000'; // 1 in 64 bit
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
 * Calculate the baseId from the series name
 * @param seriesId seriesID.
 * @returns string bytes32
 */
function baseIdFromSeriesId(seriesId) {
    return seriesId.slice(0, 6).concat('00000000');
}
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
/** remove _computeB */
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
/**
 * Converts c from 64 bit to a decimal like 1.1
 * @param c
 * @returns
 */
const _getC = (c) => new decimal_js_1.Decimal(c.toString()).div(Math.pow(2, 64));
exports._getC = _getC;
/**
 * Converts mu from 64 bit to a decimal like 1.0
 * @param mu
 * @returns
 */
const _getMu = (mu) => new decimal_js_1.Decimal(mu.toString()).div(Math.pow(2, 64));
/** ************************
 YieldSpace functions
 *************************** */
/**
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } shares
 * @returns {[BigNumber, BigNumber]}
 *
 * https://www.desmos.com/calculator/mllhtohxfx
 */
function mint(sharesReserves, fyTokenReserves, totalSupply, shares, fromBase = false) {
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves.toString());
    const supply_ = new decimal_js_1.Decimal(totalSupply.toString());
    const shares_ = new decimal_js_1.Decimal(shares.toString());
    const m = fromBase ? supply_.mul(shares_).div(sharesReserves_) : supply_.mul(shares_).div(fyTokenReserves_);
    const y = fromBase ? fyTokenReserves_.mul(m).div(supply_) : sharesReserves_.mul(m).div(supply_);
    return [(0, exports.toBn)(m), (0, exports.toBn)(y)];
}
/**
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenRealReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } lpTokens
 * @returns {[BigNumber, BigNumber]}
 *
 * https://www.desmos.com/calculator/ubsalzunpo
 */
function burn(sharesReserves, fyTokenRealReserves, totalSupply, lpTokens) {
    const Z = new decimal_js_1.Decimal(sharesReserves.toString());
    const Y = new decimal_js_1.Decimal(fyTokenRealReserves.toString());
    const S = new decimal_js_1.Decimal(totalSupply.toString());
    const x = new decimal_js_1.Decimal(lpTokens.toString());
    if (S.isZero()) {
        return [(0, exports.toBn)(ZERO), (0, exports.toBn)(ZERO)];
    }
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
 * @param { BigNumber } sharesReserves
 * @param { BigNumber } fyTokenReservesVirtual
 * @param { BigNumber } fyTokenReservesReal
 * @param { BigNumber | string } fyToken
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g1
 * @param { number } decimals
 * @param { BigNumber | string } c
 * @param { BigNumber | string } mu
 *
 * @returns {[BigNumber, BigNumber]}
 */
function mintWithBase(sharesReserves, fyTokenReservesVirtual, fyTokenReservesReal, fyToken, timeTillMaturity, ts, g1, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    const Z = new decimal_js_1.Decimal(sharesReserves.toString());
    const YR = new decimal_js_1.Decimal(fyTokenReservesReal.toString());
    const supply = fyTokenReservesVirtual.sub(fyTokenReservesReal);
    const y = new decimal_js_1.Decimal(fyToken.toString());
    // buyFyToken:
    const z1 = new decimal_js_1.Decimal(buyFYToken(sharesReserves, fyTokenReservesVirtual, fyToken, timeTillMaturity, ts, g1, decimals, c, mu).toString());
    const Z2 = Z.add(z1); // Base reserves after the trade
    const YR2 = YR.sub(y); // FYToken reserves after the trade
    // Mint specifying how much fyToken to take in. Reverse of `mint`.
    const [minted, z2] = mint((0, exports.toBn)(Z2), (0, exports.toBn)(YR2), supply, fyToken, false);
    return [minted, (0, exports.toBn)(z1).add(z2)];
}
/**
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenReservesVirtual
 * @param { BigNumber | string } fyTokenReservesReal
 * @param { BigNumber | string } lpTokens
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 * @param { BigNumber | string } c
 * @param { BigNumber | string } mu
 *
 * @returns { BigNumber }
 */
function burnForBase(sharesReserves, fyTokenReservesVirtual, fyTokenReservesReal, lpTokens, timeTillMaturity, ts, g2, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    const supply = fyTokenReservesVirtual.sub(fyTokenReservesReal);
    // Burn FyToken
    const [z1, y] = burn(sharesReserves, fyTokenReservesReal, supply, lpTokens);
    // Sell FyToken for base
    const z2 = sellFYToken(sharesReserves, fyTokenReservesVirtual, y, timeTillMaturity, ts, g2, decimals, c, mu);
    const z1D = new decimal_js_1.Decimal(z1.toString());
    const z2D = new decimal_js_1.Decimal(z2.toString());
    return (0, exports.toBn)(z1D.add(z2D));
}
/**
 * Calculates the amount of fyToken a user would get for given amount of shares.
 * fyTokenOutForSharesIn
 * https://www.desmos.com/calculator/bdplcpol2y
 * @param { BigNumber | string } sharesReserves yield bearing vault shares reserve amount
 * @param { BigNumber | string } fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } sharesIn shares amount to be traded
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g1 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } fyTokenOut: the amount of fyToken a user would get for given amount of shares
 *
 * y = fyToken reserves
 * z = base reserves
 * x = Δz (sharesIn)
 *
 *      y - (                         sum                          )^(   invA   )
 *      y - ( (    Za        ) + (  Ya  ) - (       Zxa          ) )^(   invA   )
 * Δy = y - ( c/μ * (μz)^(1-t) +  y^(1-t) -  c/μ * (μz + μx)^(1-t) )^(1 / (1 - t)
 */
function sellBase(sharesReserves, fyTokenReserves, sharesIn, timeTillMaturity, ts, g1, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    /* convert to 18 decimals, if required */
    const sharesReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(sharesReserves), decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenReserves), decimals);
    const shares18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(sharesIn), decimals);
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const shares_ = new decimal_js_1.Decimal(shares18.toString());
    const c_ = (0, exports._getC)(c);
    const mu_ = _getMu(mu);
    const [a, invA] = _computeA(timeTillMaturity, ts, g1);
    const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
    const Ya = fyTokenReserves_.pow(a);
    const Zxa = c_.div(mu_).mul(mu_.mul(sharesReserves_).add(mu_.mul(shares_)).pow(a));
    const sum = Za.add(Ya).sub(Zxa);
    const y = fyTokenReserves_.sub(sum.pow(invA));
    const yFee = y.sub(precisionFee);
    return yFee.isNaN() ? ethers_1.ethers.constants.Zero : (0, exports.decimal18ToDecimalN)((0, exports.toBn)(yFee), decimals);
}
/**
 * Calculates the amount of shares a user would get for certain amount of fyToken.
 * sharesOutForFYTokenIn
 * https://www.desmos.com/calculator/mjzqajjsq6
 * @param { BigNumber | string } sharesReserves sharesReserves shares reserves amount
 * @param { BigNumber | string } fyTokenReserves fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } fyTokenIn fyToken amount to be traded
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g2 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } sharesOut: amount of shares a user would get for given amount of fyToken
 *
 * y = fyToken
 * z = vyToken
 * x = Δy
 *
 *      z - 1/μ * (                      sum                                      )^(   invA    )
 *      z - 1/μ * ( (       Za           ) + ( Ya  ) - (    Yxa    )  ) / (c / μ) )^(   invA    )
 * Δz = z - 1/μ * ( ( (c / μ) * (μz)^(1-t) + y^(1-t) - (y + x)^(1-t)  ) / (c / μ) )^(1 / (1 - t))
 */
function sellFYToken(sharesReserves, fyTokenReserves, fyTokenIn, timeTillMaturity, ts, g2, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    /* convert to 18 decimals, if required */
    const sharesReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(sharesReserves), decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenReserves), decimals);
    const fyToken18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenIn), decimals);
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const fyToken_ = new decimal_js_1.Decimal(fyToken18.toString());
    const c_ = (0, exports._getC)(c);
    const mu_ = _getMu(mu);
    const [a, invA] = _computeA(timeTillMaturity, ts, g2);
    const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
    const Ya = fyTokenReserves_.pow(a);
    const Yxa = fyTokenReserves_.add(fyToken_).pow(a);
    const sum = Za.add(Ya).sub(Yxa).div(c_.div(mu_));
    const y = sharesReserves_.sub(ONE.div(mu_).mul(sum.pow(invA)));
    const yFee = y.sub(precisionFee);
    return yFee.isNaN() ? ethers_1.ethers.constants.Zero : (0, exports.decimal18ToDecimalN)((0, exports.toBn)(yFee), decimals);
}
/**
 * Calculates the amount of fyToken a user could sell for given amount of shares.
 * fyTokenInForSharesOut
 * https://www.desmos.com/calculator/8dgux6slgq
 * @param { BigNumber | string } sharesReserves shares reserves amount
 * @param { BigNumber | string } fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } sharesOut shares amount to be traded
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g2 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } fyTokenIn: the amount of fyToken a user could sell for given amount of shares
 *
 * y = fyToken reserves
 * z = shares reserves
 * x = Δz (sharesOut)
 *
 *      (                  sum                               )^(   invA   )  - y
 *      ( (    Za        ) + ( Ya  ) - (      Zxa            )^(   invA   )  - y
 * Δy = ( c/μ * (μz)^(1-t) + y^(1-t) - c/μ * (μz - μx)^(1-t) )^(1 / (1 - t)) - y
 */
function buyBase(sharesReserves, fyTokenReserves, sharesOut, timeTillMaturity, ts, g2, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    /* convert to 18 decimals, if required */
    const sharesReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(sharesReserves), decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenReserves), decimals);
    const shares18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(sharesOut), decimals);
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const shares_ = new decimal_js_1.Decimal(shares18.toString());
    const c_ = (0, exports._getC)(c);
    const mu_ = _getMu(mu);
    const [a, invA] = _computeA(timeTillMaturity, ts, g2);
    const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
    const Ya = fyTokenReserves_.pow(a);
    const Zxa = c_.div(mu_).mul(mu_.mul(sharesReserves_).sub(mu_.mul(shares_)).pow(a));
    const sum = Za.add(Ya).sub(Zxa);
    const y = sum.pow(invA).sub(fyTokenReserves_);
    const yFee = y.add(precisionFee);
    return yFee.isNaN() ? ethers_1.ethers.constants.Zero : (0, exports.decimal18ToDecimalN)((0, exports.toBn)(yFee), decimals);
}
/**
 * Calculates the amount of fyToken a user could buy for given amount of shares.
 * sharesInForFYTokenOut
 * https://www.desmos.com/calculator/oyj2qzevzs
 * @param { BigNumber | string } sharesReserves yield bearing vault shares reserve amount
 * @param { BigNumber | string } fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } fyTokenOut fyToken amount to be traded
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g1 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } sharesIn: result the amount of shares a user would have to pay for given amount of fyToken
 *
 * y = fyToken
 * z = vyToken
 * x = Δy
 *
 *      ( 1/μ * (                         sum                           ) )^(   invA    ) - z
 *      ( 1/μ * ( (     Za       ) + ( Ya   ) - (    Yxa    ) ) / (c/μ) ) )^(   invA    ) - z
 * Δz = ( 1/μ * ( ( c/μ * μz^(1-t) + y^(1-t)  - (y - x)^(1-t) ) / (c/μ) ) )^(1 / (1 - t)) - z
 */
function buyFYToken(sharesReserves, // z
fyTokenReserves, // y
fyTokenOut, timeTillMaturity, ts, g1, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    /* convert to 18 decimals, if required */
    const sharesReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(sharesReserves), decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenReserves), decimals);
    const fyToken18 = (0, exports.decimalNToDecimal18)(ethers_1.BigNumber.from(fyTokenOut), decimals);
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const fyToken_ = new decimal_js_1.Decimal(fyToken18.toString());
    const c_ = (0, exports._getC)(c);
    const mu_ = _getMu(mu);
    const [a, invA] = _computeA(timeTillMaturity, ts, g1);
    const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
    const Ya = fyTokenReserves_.pow(a);
    const Yxa = fyTokenReserves_.sub(fyToken_).pow(a);
    const sum = Za.add(Ya.sub(Yxa)).div(c_.div(mu_));
    const y = ONE.div(mu_).mul(sum.pow(invA)).sub(sharesReserves_);
    const yFee = y.add(precisionFee);
    return yFee.isNaN() ? ethers_1.ethers.constants.Zero : (0, exports.decimal18ToDecimalN)((0, exports.toBn)(yFee), decimals);
}
/**
 * Calculate the max amount of shares that can be sold to into the pool without making the interest rate negative.
 *
 * @param { BigNumber | string } sharesReserves yield bearing vault shares reserve amount
 * @param { BigNumber | string } fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g1 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } max amount of shares that can be bought from the pool
 *
 * y = fyToken
 * z = vyToken
 * x = Δy
 *
 *      1/μ * ( (               sum                 )^(   invA    ) - z
 *      1/μ * ( ( (  cua   ) * Za  + Ya ) / (c/μ + 1) )^(   invA    ) - z
 * Δz = 1/μ * ( ( ( cμ^a * z^a + μy^a) / (c + μ) )^(1 / (1 - t)) - z
 *
 */
function maxBaseIn(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    /* convert to 18 decimals, if required */
    const sharesReserves18 = (0, exports.decimalNToDecimal18)(sharesReserves, decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(fyTokenReserves, decimals);
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const [a, invA] = _computeA(timeTillMaturity, ts, g1);
    const c_ = (0, exports._getC)(c);
    const mu_ = _getMu(mu);
    const cua = c_.mul(mu_.pow(a));
    const Za = sharesReserves_.pow(a);
    const Ya = mu_.mul(fyTokenReserves_.pow(a));
    const top = cua.mul(Za).add(Ya);
    const bottom = c_.add(mu_);
    const sum = top.div(bottom);
    const res = ONE.div(mu_).mul(sum.pow(invA)).sub(sharesReserves_);
    /* Handle precision variations */
    const safeRes = res.gt(MAX.sub(precisionFee)) ? MAX : res.add(precisionFee);
    /* Convert to back to token native decimals, if required */
    return (0, exports.decimal18ToDecimalN)((0, exports.toBn)(safeRes), decimals);
}
/**
 * Calculate the max amount of shares that can be bought from the pool.
 * Since the amount of shares that can be purchased is not bounded, maxSharesOut is equivalent to the toal amount of shares in the pool.
 *
 * @param { BigNumber | string } sharesReserves
 *
 * @returns { BigNumber } max amount of shares that can be bought from the pool
 *
 */
function maxBaseOut(sharesReserves) {
    return sharesReserves;
}
/**
 * Calculate the max amount of fyTokens that can be sold to into the pool.
 *
 * y = maxFyTokenIn
 * Y = fyTokenReserves (virtual)
 * Z = sharesReserves
 *
 *     (       sum           )^(invA) - y
 *     ( (    Za      ) + Ya )^(invA) - y
 * y = ( (c/μ) * (μZ)^a + Y^a)^(1/a)  - y
 *
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 * @param { BigNumber | string } c
 * @param { BigNumber | string } mu
 *
 * @returns { BigNumber }
 */
function maxFyTokenIn(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    /* convert to 18 decimals, if required */
    const sharesReserves18 = (0, exports.decimalNToDecimal18)(sharesReserves, decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(fyTokenReserves, decimals);
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const c_ = (0, exports._getC)(c);
    const mu_ = _getMu(mu);
    const [a, invA] = _computeA(timeTillMaturity, ts, g2);
    const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
    const Ya = fyTokenReserves_.pow(a);
    const sum = Za.add(Ya);
    const res = sum.pow(invA).sub(fyTokenReserves_);
    /* Handle precision variations */
    const safeRes = res.gt(precisionFee) ? res.sub(precisionFee) : ZERO;
    /* convert to back to token native decimals, if required */
    return (0, exports.decimal18ToDecimalN)((0, exports.toBn)(safeRes), decimals);
}
/**
 * Calculate the max amount of fyTokens that can be bought from the pool without making the interest rate negative.
 *
 * y = maxFyTokenOut
 * Y = fyTokenReserves (virtual)
 * Z = sharesReserves
 * cmu = cμ^a
 *
 *         ( (       sum                 ) / (  denominator  ) )^invA
 *         ( ( (    Za      ) + (  Ya  ) ) / (  denominator  ) )^invA
 * y = Y - ( ( ( cμ^a * Z^a ) + ( μY^a ) ) / (    c + μ    ) )^(1/a)
 *
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g1
 * @param { number } decimals
 * @param { BigNumber | string } c
 * @param { BigNumber | string } mu
 *
 * @returns { BigNumber }
 */
function maxFyTokenOut(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    /* convert to 18 decimals, if required */
    const sharesReserves18 = (0, exports.decimalNToDecimal18)(sharesReserves, decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(fyTokenReserves, decimals);
    /* convert to decimal for the math */
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const c_ = (0, exports._getC)(c);
    const mu_ = _getMu(mu);
    const [a, invA] = _computeA(timeTillMaturity, ts, g1);
    const cmu = c_.mul(mu_.pow(a));
    const Za = cmu.mul(sharesReserves_.pow(a));
    const Ya = mu_.mul(fyTokenReserves_.pow(a));
    const sum = Za.add(Ya);
    const denominator = c_.add(mu_);
    const res = fyTokenReserves_.sub(sum.div(denominator).pow(invA));
    /* Handle precision variations */
    const safeRes = res.gt(MAX.sub(precisionFee)) ? MAX : res.add(precisionFee);
    /* convert to back to token native decimals, if required */
    return (0, exports.decimal18ToDecimalN)((0, exports.toBn)(safeRes), decimals);
}
/**
 * Calculates the total supply invariant.
 *
 *  y = invariant
 *  Y = fyTokenReserves (virtual)
 *  Z = sharesReserves
 *  s = total supply
 *
 *      c/μ ( (       numerator           ) / (  denominator  ) )^invA  / s
 *      c/μ ( ( (    Za      ) + (  Ya  ) ) / (  denominator  ) )^invA  / s
 *  y = c/μ ( ( c/μ * (μZ)^a   +    Y^a   ) / (     c/u + 1   ) )^(1/a) / s
 *
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 * @param { BigNumber | string } c
 * @param { BigNumber | string } mu
 *
 * @returns { BigNumber }
 */
function invariant(sharesReserves, fyTokenReserves, totalSupply, timeTillMaturity, ts, g2, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) {
    /* convert to 18 decimals, if required */
    const sharesReserves18 = (0, exports.decimalNToDecimal18)(sharesReserves, decimals);
    const fyTokenReserves18 = (0, exports.decimalNToDecimal18)(fyTokenReserves, decimals);
    const totalSupply18 = (0, exports.decimalNToDecimal18)(totalSupply, decimals);
    /* convert to decimal for the math */
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves18.toString());
    const fyTokenReserves_ = new decimal_js_1.Decimal(fyTokenReserves18.toString());
    const totalSupply_ = new decimal_js_1.Decimal(totalSupply18.toString());
    const c_ = (0, exports._getC)(c);
    const mu_ = _getMu(mu);
    const [a, invA] = _computeA(timeTillMaturity, ts, g2);
    const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
    const Ya = fyTokenReserves_.pow(a);
    const numerator = Za.add(Ya);
    const denominator = c_.div(mu_).add(ONE);
    const topTerm = c_.div(mu_).mul(numerator.div(denominator).pow(invA));
    const res = topTerm.div(totalSupply_).mul(Math.pow(10, decimals));
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
 * @param sharesReserves
 * @param fyTokenRealReserves
 * @param fyTokenVirtualReserves
 * @param shares
 * @param timeTillMaturity
 * @param ts
 * @param g1
 * @param decimals
 * @param slippage How far from the optimum we want to be
 * @param precision How wide the range in which we will accept a value
 * @param c
 * @param mu
 *
 * @returns fyTokenToBuy, surplus
 */
function fyTokenForMint(sharesReserves, fyTokenRealReserves, fyTokenVirtualReserves, shares, timeTillMaturity, ts, g1, decimals, slippage = 0.01, // 1% default
c = exports.c_DEFAULT, mu = exports.mu_DEFAULT, precision = 0.0001 // 0.01% default
) {
    const shares_ = new decimal_js_1.Decimal(shares.toString());
    const minSurplus = shares_.mul(slippage);
    const maxSurplus = minSurplus.add(shares_.mul(precision));
    let maxFYToken = new decimal_js_1.Decimal(maxFyTokenOut(sharesReserves, fyTokenVirtualReserves, timeTillMaturity, ts, g1, decimals, c, mu).toString());
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
        const sharesIn = mintWithBase(sharesReserves, fyTokenVirtualReserves, fyTokenRealReserves, (0, exports.toBn)(fyTokenToBuy), timeTillMaturity, ts, g1, decimals, c, mu)[1];
        const surplus = shares_.sub(new decimal_js_1.Decimal(sharesIn.toString()));
        // console.log( 'min:',  minSurplus.toFixed() ,  'max:',   maxSurplus.toFixed() , 'surplus: ', surplus.toFixed() )
        // Just right
        if (minSurplus.lt(surplus) && surplus.lt(maxSurplus)) {
            // console.log('fyToken to buy: ', fyTokenToBuy.toFixed(), 'surplus: ', surplus.toFixed());
            return [(0, exports.toBn)(fyTokenToBuy), (0, exports.toBn)(surplus)];
        }
        // Bought too much, lower the max and the buy
        if (sharesIn.gt(shares) || surplus.lt(minSurplus)) {
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
 * Split a certain amount of X liquidity into its two components (eg. shares and fyToken)
 * @param { BigNumber } xReserves // eg. shares reserves
 * @param { BigNumber } yReserves // eg. fyToken reservers
 * @param {BigNumber} xAmount // amount to split in wei
 * @param {BigNumber} asBn
 * @returns  [ BigNumber, BigNumber ] returns an array of [shares, fyToken]
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
 * @returns {string | undefined} returns price or undefined if can't calculate
 */
const calcLiquidationPrice = (collateralAmount, debtAmount, liquidationRatio) => {
    if (parseFloat(debtAmount) === 0 || parseFloat(collateralAmount) === 0)
        return undefined;
    const _collateralAmount = parseFloat(collateralAmount);
    const _debtAmount = parseFloat(debtAmount);
    // condition/logic: collAmount * price > debtAmount * ratio
    const liquidationPoint = _debtAmount * liquidationRatio;
    const price = (liquidationPoint / _collateralAmount).toString();
    return price;
};
exports.calcLiquidationPrice = calcLiquidationPrice;
/**
 *  @param {BigNumber} sharesChange change in shares
 * @param {BigNumber} fyTokenChange change in fyToken
 * @param {BigNumber} poolSharesReserves pool shares reserves
 * @param {BigNumber} poolFyTokenReserves pool fyToken reserves
 * @param {BigNumber} poolTotalSupply pool total supply
 *
 * @returns {BigNumber[]} [newSharesReserves, newFyTokenRealReserves, newTotalSupply, newFyTokenVirtualReserves]
 */
const newPoolState = (sharesChange, fyTokenChange, poolSharesReserves, poolFyTokenReserves, poolTotalSupply) => {
    const newSharesReserves = poolSharesReserves.add(sharesChange);
    const newFyTokenReserves = poolFyTokenReserves.add(fyTokenChange);
    const newTotalSupply = poolTotalSupply.add(fyTokenChange);
    const newFyTokenRealReserves = newFyTokenReserves.sub(newTotalSupply); // real = virtual - totalSupply
    return {
        sharesReserves: newSharesReserves,
        fyTokenRealReserves: newFyTokenRealReserves,
        totalSupply: newTotalSupply,
        fyTokenVirtualReserves: newFyTokenReserves,
    };
};
exports.newPoolState = newPoolState;
/**
 *  @param {BigNumber | string} strategyTokenAmount
 * @param {BigNumber} strategyTotalSupply
 * @param {BigNumber} strategyPoolBalance
 * @param {BigNumber} poolSharesReserves
 * @param {BigNumber} poolFyTokenRealReserves
 * @param {BigNumber} poolTotalSupply
 * @param {BigNumber | string} poolTimeToMaturity
 * @param {BigNumber | string} ts
 * @param {BigNumber | string} g2
 * @param { number } decimals
 * @param {BigNumber | string} c
 * @param {BigNumber | string} mu
 *
 * @returns {BigNumber} [fyToken sold to shares, shares received]
 */
const strategyTokenValue = (strategyTokenAmount, strategyTotalSupply, strategyPoolBalance, poolSharesReserves, poolFyTokenReserves, poolTotalSupply, poolTimeToMaturity, ts, g2, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) => {
    // 0. Calc amount of lpTokens from strat token burn
    // 1. calc amount shares/fyToken recieved from burn
    // 2. calculate new reserves (sharesReserves and fyTokenReserves)
    // 3. try to trade fyToken to shares with new reserves
    const lpReceived = burnFromStrategy(strategyPoolBalance, strategyTotalSupply, strategyTokenAmount);
    const [_sharesReceived, _fyTokenReceived] = burn(poolSharesReserves, poolFyTokenReserves.sub(poolTotalSupply), poolTotalSupply, lpReceived);
    const newPool = (0, exports.newPoolState)(_sharesReceived.mul(-1), _fyTokenReceived.mul(-1), poolSharesReserves, poolFyTokenReserves, poolTotalSupply);
    const fyTokenToShares = sellFYToken(newPool.sharesReserves, newPool.fyTokenVirtualReserves, _fyTokenReceived, poolTimeToMaturity.toString(), ts, g2, decimals, c, mu);
    return [fyTokenToShares, _sharesReceived];
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
 * @param {BigNumber} sharesReserves
 * @param {BigNumber} fyTokenRealReserves
 * @param {number} slippage
 *
 * @returns {[BigNumber, BigNumber] } [minRatio with slippage, maxRatio with slippage]
 */
const calcPoolRatios = (sharesReserves, fyTokenRealReserves, slippage = 0.1) => {
    const sharesReserves_ = new decimal_js_1.Decimal(sharesReserves.toString());
    const fyTokenRealReserves_ = new decimal_js_1.Decimal(fyTokenRealReserves.toString());
    // use min/max values when real reserves are very close to (or) zero, due to difficulty estimating precise min/max ratios
    if (fyTokenRealReserves_.lte(exports.ONE_DEC))
        return [(0, exports.toBn)(exports.ZERO_DEC), (0, exports.toBn)(exports.MAX_DEC)];
    const slippage_ = new decimal_js_1.Decimal(slippage.toString());
    const wad = new decimal_js_1.Decimal(exports.WAD_BN.toString());
    const ratio = sharesReserves_.div(fyTokenRealReserves_).mul(wad);
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
/**
 * Calculates the amount of base needed to adjust a pool to a desired interest rate
 *
 * @param {BigNumber} sharesReserves shares reserves of the pool
 * @param {BigNumber} fyTokenReserves virtual fyToken of the pool
 * @param {number} timeTillMaturity fyToken of the pool
 * @param {BigNumber} ts time stretch
 * @param {BigNumber} g1 fee
 * @param {BigNumber} g2 fee
 * @param {number} desiredInterestRate desired interest rate for the pool, in decimal format (i.e.: .1 for 10%)
 *
 * @returns {BigNumber} // input into amo func
 */
const changeRateNonTv = (sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, g2, desiredInterestRate // in decimal format (i.e.: .1 is 10%)
) => {
    // format series data
    const _sharesReserves = new decimal_js_1.Decimal(sharesReserves.toString());
    const _fyTokenReserves = new decimal_js_1.Decimal(fyTokenReserves.toString());
    // time stretch in years
    const u = (0, exports.getTimeStretchYears)(ts);
    // calculate current rate
    const _currRate = (0, exports.calcInterestRate)(fyTokenReserves, sharesReserves, ts);
    // format desired rate
    const _desiredRate = new decimal_js_1.Decimal(desiredInterestRate.toString());
    // assess which g to use: decrease rates means sellBase, so g1; otherwise, buyBase, so g2
    const g = _desiredRate.gt(_currRate) ? g1 : g2;
    const [a, invA] = _computeA(timeTillMaturity, ts, g);
    const top = _sharesReserves.pow(a).add(_fyTokenReserves.pow(a));
    const bottom = ONE.add(ONE.add(_desiredRate).pow(u.mul(a)));
    const sharesReservesNew = top.div(bottom).pow(invA);
    const sharesDiff = sharesReservesNew.sub(_sharesReserves);
    const fyTokenReservesNew = sharesReservesNew.mul(ONE.add(_desiredRate).pow(u));
    const fyTokenDiff = fyTokenReservesNew.sub(_fyTokenReserves);
    // result is the input into the amo func, which is the shares diff if decreasing rates, and the fyToken diff if increasing rates
    // sellBase (decrease rates {shares goes in}) or sellFyToken (increase rates {shares come out})
    return _desiredRate.gt(_currRate) ? (0, exports.toBn)(fyTokenDiff.abs()) : (0, exports.toBn)(sharesDiff.abs());
};
exports.changeRateNonTv = changeRateNonTv;
/**
 * Calculates the current market interest rate
 *
 * @param {BigNumber} sharesReserves shares reserves of the pool
 * @param {BigNumber} fyTokenReserves virtual fyToken of the pool
 * @param {BigNumber} ts years associated with time stretch
 * @param {BigNumber | string} mu
 *
 * @returns {Decimal} // market rate in number format (i.e.: 10% is .10)
 */
const calcInterestRate = (sharesReserves, fyTokenReserves, ts, mu = exports.mu_DEFAULT) => {
    const _sharesReserves = new decimal_js_1.Decimal(sharesReserves.toString());
    const _fyTokenReserves = new decimal_js_1.Decimal(fyTokenReserves.toString());
    const _mu = _getMu(mu);
    const timeStretchYears = (0, exports.getTimeStretchYears)(ts);
    return _fyTokenReserves.div(_sharesReserves.mul(_mu)).pow(ONE.div(timeStretchYears)).sub(ONE);
};
exports.calcInterestRate = calcInterestRate;
/**
 * @param ts time stretch associated with series (i.e.: 10 years)
 * @returns {Decimal} num years in decimals
 */
const getTimeStretchYears = (ts) => {
    const _ts = new decimal_js_1.Decimal(ts.toString()).div(Math.pow(2, 64));
    const _secondsInOneYear = new decimal_js_1.Decimal(exports.secondsInOneYear.toString());
    const invTs = ONE.div(_ts);
    return invTs.div(_secondsInOneYear);
};
exports.getTimeStretchYears = getTimeStretchYears;
/**
 * Calculates the amount of base from shares
 * @param shares amount of shares
 * @param currentSharePrice current share price in base terms
 * @param decimals
 * @returns {BigNumber} base amount of shares
 */
const getBaseFromShares = (shares, currentSharePrice, decimals) => (0, exports.toBn)(new decimal_js_1.Decimal(shares.toString()).mul(new decimal_js_1.Decimal(currentSharePrice.toString())).div(Math.pow(10, decimals)));
exports.getBaseFromShares = getBaseFromShares;
/**
 * Calculates the amount of shares from base
 * @param base amount of base
 * @param currentSharePrice current share price in base terms
 * @param decimals
 * @returns {BigNumber} shares amount of base
 *
 */
const getSharesFromBase = (base, currentSharePrice, decimals) => (0, exports.toBn)(new decimal_js_1.Decimal(base.toString()).mul(Math.pow(10, decimals)).div(new decimal_js_1.Decimal(currentSharePrice.toString())));
exports.getSharesFromBase = getSharesFromBase;
/**
 * Calculates the amount of base from fyToken
 * @param input amount of fyToken used as input to estimate the fyToken price in base terms; in decimals format
 * @param sharesReserves shares reserves of the pool
 * @param fyTokenReserves fyToken reserves of the pool
 * @param timeTillMaturity time till maturity of the pool
 * @param ts time stretch
 * @param g2 fee
 * @param decimals
 * @param c
 * @param mu
 * @returns {number} fyToken price in base terms
 *
 */
const getFyTokenPrice = (input, sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) => {
    const sharesOut = sellFYToken(sharesReserves, fyTokenReserves, input, timeTillMaturity, ts, g2, decimals, c, mu);
    const baseValueOfInput = (0, exports.getBaseFromShares)(sharesOut, fyTokenReserves, decimals);
    return +baseValueOfInput / +input;
};
exports.getFyTokenPrice = getFyTokenPrice;
/**
 * Calculate the total base value of the pool
 * total = shares value in base + fyToken value in base
 *
 * @param input amount of fyToken used as input to estimate the fyToken price in base terms; in decimals format
 * @param sharesReserves shares reserves of the pool
 * @param fyTokenReserves fyToken reserves of the pool
 * @param totalSupply total supply of the pool
 * @param timeTillMaturity time till maturity of the pool
 * @param ts time stretch
 * @param g2 fee
 * @param decimals
 * @param c
 * @param mu
 * @returns {number} total base value of pool in decimals terms
 */
const getPoolBaseValue = (input, sharesReserves, fyTokenReserves, totalSupply, timeTillMaturity, ts, g2, decimals, currentSharePrice, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) => {
    const fyTokenPrice = (0, exports.getFyTokenPrice)(input, sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c, mu); // fyToken price in base terms
    const sharesBaseVal = +(0, exports.getBaseFromShares)(sharesReserves, currentSharePrice, decimals);
    const realReserves = +fyTokenReserves - +totalSupply;
    const fyTokenBaseVal = realReserves * fyTokenPrice;
    return sharesBaseVal + fyTokenBaseVal;
};
exports.getPoolBaseValue = getPoolBaseValue;
/**
 * Calculate (estimate) the apy associated with how much fees have accrued to LP's using invariant func
 * @param currentPool pool data now
 * @param initPool pool data at start of pool
 * @returns {number}
 */
const getFeesAPY = (currentPool, initPool) => {
    // destructure current pool
    const { sharesReserves: currentSharesReserves, fyTokenReserves: currentFYTokenReserves, totalSupply: currentTotalSupply, timeTillMaturity: currentTimeTillMaturity, ts: currentTs, g2: currentG2, decimals: currentDecimals, c: currentC, mu: currentMu, } = currentPool;
    // destruct init pool
    const { sharesReserves: initSharesReserves, fyTokenReserves: initFYTokenReserves, totalSupply: initTotalSupply, timeTillMaturity: initTimeTillMaturity, ts: initTs, g2: initG2, decimals: initDecimals, c: initC, mu: initMu, } = initPool;
    // calculate current invariant
    const currentInvariant = invariant(currentSharesReserves, currentFYTokenReserves, currentTotalSupply, currentTimeTillMaturity, currentTs, currentG2, currentDecimals, currentC, currentMu);
    // calculate initial invariant
    const initInvariant = invariant(initSharesReserves, initFYTokenReserves, initTotalSupply, initTimeTillMaturity, initTs, initG2, initDecimals, initC, initMu);
    // estimate apy
    const res = (0, exports.calculateAPR)(initInvariant, currentInvariant, +initTimeTillMaturity, +currentTimeTillMaturity); // currentTimeTillMaturity - initTimeTillMaturity = time elapsed
    return !isNaN(+res) ? +res : 0;
};
exports.getFeesAPY = getFeesAPY;
/**
 * Calculate (estimate) the apy associated with how much interest would be captured by LP position using market rates and fyToken proportion of the pool
 *
 * @returns {number} estimated fyToken interest from LP position
 */
const getFyTokenAPY = (sharesReserves, fyTokenReserves, totalSupply, input, timeTillMaturity, ts, g2, decimals, currentSharePrice, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) => {
    const marketInterestRate = (0, exports.calcInterestRate)(sharesReserves, fyTokenReserves, ts, mu).mul(100); // interest rate is formatted in decimal (.1) so multiply by 100 to get percent
    const fyTokenPrice = (0, exports.getFyTokenPrice)(input, sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c, mu);
    const poolBaseValue = (0, exports.getPoolBaseValue)(input, sharesReserves, fyTokenReserves, totalSupply, timeTillMaturity, ts, g2, decimals, currentSharePrice, c, mu);
    // real reserves * fyTokenPrice in base terms / poolBaseValue = fyToken proportion of pool
    const fyTokenValRatio = ((+fyTokenReserves - +totalSupply) * fyTokenPrice) / poolBaseValue;
    // fyTokenValRatio * marketInterestRate = estimated fyToken interest from LP position
    return +marketInterestRate * fyTokenValRatio;
};
exports.getFyTokenAPY = getFyTokenAPY;
/**
 * Calculates estimated apy from shares portion of pool
 * @returns {number} shares apy of pool
 */
const getSharesAPY = (sharesReserves, fyTokenReserves, totalSupply, timeTillMaturity, ts, g2, decimals, currentSharePrice, currentPoolAPY, c = exports.c_DEFAULT, mu = exports.mu_DEFAULT) => {
    const input = (0, exports.toBn)(new decimal_js_1.Decimal(Math.pow(10, decimals)));
    const poolBaseValue = (0, exports.getPoolBaseValue)(input, sharesReserves, fyTokenReserves, totalSupply, timeTillMaturity, ts, g2, decimals, currentSharePrice, c, mu);
    const sharesBaseVal = +(0, exports.getBaseFromShares)(sharesReserves, currentSharePrice, decimals);
    const sharesValRatio = sharesBaseVal / poolBaseValue; // shares proportion of pool
    return currentPoolAPY * sharesValRatio;
};
exports.getSharesAPY = getSharesAPY;
//# sourceMappingURL=index.js.map
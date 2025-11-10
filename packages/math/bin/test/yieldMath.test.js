"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai_1 = tslib_1.__importStar(require("chai"));
const decimal_js_1 = require("decimal.js");
const ethereum_waffle_1 = require("ethereum-waffle");
const ethers_1 = require("ethers");
const index_1 = require("../index");
chai_1.default.use(ethereum_waffle_1.solidity);
const { parseUnits } = ethers_1.utils;
const calcPrice = (shares, fyToken, c, decimals) => (0, index_1.toBn)(new decimal_js_1.Decimal(shares.toString())
    .mul((0, index_1._getC)(c))
    .div(new decimal_js_1.Decimal(fyToken.toString()))
    .mul(Math.pow(10, decimals)));
describe('Shares YieldMath', () => {
    let g1 = (0, index_1.toBn)(index_1.g1_DEFAULT);
    let g2 = (0, index_1.toBn)(index_1.g2_DEFAULT);
    let ts = (0, index_1.toBn)(index_1.k);
    let sharesReserves;
    let fyTokenReserves;
    let totalSupply;
    let c; // c: the price of vyToken to Token
    let cGreater; // greater c than c above
    let mu; // mu: the price of vyToken to Token (c) at initialization
    let timeTillMaturity;
    let decimals = 18;
    const base = parseUnits('100000', decimals); // 100,000
    const fyToken = parseUnits('100000', decimals); // 100,000
    let comparePrecision = parseUnits('.001', decimals); // how close the equality check should be within
    beforeEach(() => {
        sharesReserves = parseUnits('1000000', decimals); // 1,000,000 base reserves to decimals
        fyTokenReserves = parseUnits('1000000', decimals); // 1,000,000 fyToken reserves to decimals
        totalSupply = parseUnits('1200000', decimals); // 1,200,000 total supply
        c = ethers_1.BigNumber.from('0x1199999999999999a'); // 1.1 in 64 bit
        cGreater = ethers_1.BigNumber.from('0x13333333333333333'); // 1.2 in 64 bit
        mu = ethers_1.BigNumber.from('0x10ccccccccccccccd'); // 1.05 in 64 bit
        timeTillMaturity = (10000000).toString(); // 10000000 seconds
        ts = (0, index_1.toBn)(index_1.k);
    });
    describe('when c is 1 and mu is 1', () => {
        it('should equal the non-variable yield function with non-variable base', () => {
            c = ethers_1.BigNumber.from('0x10000000000000000'); // 1.0 in 64 bit: non-variable initially
            mu = ethers_1.BigNumber.from('0x10000000000000000'); // 1.0 in 64 bit: non-variable initially
            const sellBaseResult = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
            // expect(sellBaseResult).to.equal(sellBaseResult);
            // buyBase
            const buyBaseResult = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
            // expect(buyBaseResult).to.equal(buyBaseResult);
            // buyFYToken
            const buyFYTokenResult = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
            // expect(buyFYTokenResult).to.equal(buyFYTokenResult);
            const sellFYTokenResult = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
        });
    });
    describe('when c is 1.1 and mu is 1.05', () => {
        describe('sellBaseShares (fyTokenOutForSharesIn)', () => {
            it('should be more fyToken out for shares in', () => {
                const result = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.gt(base);
            });
            it('should output a specific number with a specific input', () => {
                const result = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('109490.652', decimals), comparePrecision); // 109,490.652
            });
            it('should have a price of one at maturity', () => {
                // when c stays the same
                const result = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken out
                (0, chai_1.expect)(calcPrice(base, result, c, decimals)).to.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1 formatted to decimals with precision of 3 decimal places
                // when c grew
                const result2 = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g1, decimals, cGreater, mu);
                (0, chai_1.expect)(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken out
                (0, chai_1.expect)(calcPrice(base, result2, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
            });
            it('should mirror buyFYTokenShares (fyTokenInForSharesOut)', () => {
                const fyTokensOut = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
                // plug the fyTokens out from above into mirror swap function
                const baseIn = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyTokensOut, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(baseIn).to.be.closeTo(base, comparePrecision);
            });
        });
        describe('sellFYTokenShares (sharesOutForFYTokenIn)', () => {
            it('should be fewer shares out than fyToken in', () => {
                const result = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.lt(fyToken);
            });
            it('should output a specific number with a specific input', () => {
                const result = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('90768.266', decimals), comparePrecision); // 90,768.266
            });
            it('should have a price of one at maturity', () => {
                const result = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken out
                (0, chai_1.expect)(calcPrice(result, fyToken, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
                // when c grew
                const result2 = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g2, decimals, cGreater, mu);
                (0, chai_1.expect)(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken out
                (0, chai_1.expect)(calcPrice(result2, fyToken, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
            });
            it('should mirror buyBaseShares (fyTokenInForSharesOut)', () => {
                const sharesOut = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
                // plug the shares out from above into mirror swap function
                const fyTokenIn = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, sharesOut, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(fyTokenIn).to.be.closeTo(fyToken, comparePrecision);
            });
        });
        describe('buyBaseShares (fyTokenInForSharesOut)', () => {
            it('should be more fyToken in than shares out', () => {
                const result = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.gt(base);
            });
            it('should output a specific number with a specific input', () => {
                const result = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('110206.353', decimals), comparePrecision); // 110,206.353
            });
            it('should have a price of one at maturity', () => {
                const result = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken in
                (0, chai_1.expect)(calcPrice(base, result, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
                // when c grew
                const result2 = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g2, decimals, cGreater, mu);
                (0, chai_1.expect)(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken in
                (0, chai_1.expect)(calcPrice(base, result2, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
            });
            it('should mirror sellFYTokenShares (sharesOutForFYTokenIn)', () => {
                const fyTokenIn = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
                // plug the fyToken in from above into mirror swap function
                const sharesOut = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyTokenIn, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(sharesOut).to.be.closeTo(base, comparePrecision);
            });
        });
        describe('buyFYTokenShares (sharesInForFYTokenOut)', () => {
            it('should be fewer shares in than fyToken out', () => {
                const result = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.lt(fyToken);
            });
            it('should output a specific number with a specific input', () => {
                const result = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('91306.706', decimals), comparePrecision); // 91,306.706
            });
            it('should have a price of one at maturity', () => {
                const result = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken in
                (0, chai_1.expect)(calcPrice(result, fyToken, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
                // when c grew
                const result2 = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g1, decimals, cGreater, mu);
                (0, chai_1.expect)(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken in
                (0, chai_1.expect)(calcPrice(result2, fyToken, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
            });
            it('should mirror sellBaseShares (fyTokenOutForSharesIn)', () => {
                // shares in
                const sharesIn = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
                // plug the shares in from above into mirror swap function
                const fyTokensOut = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, sharesIn, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(fyTokensOut).to.be.closeTo(fyToken, comparePrecision);
            });
        });
        describe('maxFyTokenOut', () => {
            // https://www.desmos.com/calculator/msohzeucu5
            it('should output a specific number with a specific input', () => {
                c = ethers_1.BigNumber.from('0x1199999999999999a'); // 1.1
                mu = ethers_1.BigNumber.from('0x10ccccccccccccccd'); // 1.05
                ts = (0, index_1.toBn)(new decimal_js_1.Decimal(1 /
                    ethers_1.BigNumber.from(index_1.SECONDS_PER_YEAR)
                        .mul(10 * 25)
                        .toNumber()).mul(Math.pow(2, 64))); // inv of seconds in 10 years
                sharesReserves = parseUnits('1100000', decimals);
                fyTokenReserves = parseUnits('1500000', decimals);
                timeTillMaturity = (77760000).toString();
                const result = (0, index_1.maxFyTokenOut)(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('176616.991', decimals), comparePrecision); // 176,616.991033
            });
        });
        describe('maxFyTokenIn', () => {
            // https://www.desmos.com/calculator/jcdfr1qv3z
            it('should output a specific number with a specific input', () => {
                c = ethers_1.BigNumber.from('0x1199999999999999a');
                mu = ethers_1.BigNumber.from('0x10ccccccccccccccd');
                ts = (0, index_1.toBn)(new decimal_js_1.Decimal(1 /
                    ethers_1.BigNumber.from(index_1.SECONDS_PER_YEAR)
                        .mul(10 * 25)
                        .toNumber()).mul(Math.pow(2, 64))); // inv of seconds in 10 years
                sharesReserves = parseUnits('1100000', decimals);
                fyTokenReserves = parseUnits('1500000', decimals);
                timeTillMaturity = (77760000).toString();
                const result = (0, index_1.maxFyTokenIn)(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('1230211.594', decimals), comparePrecision); // 1,230,211.59495
            });
        });
        describe('maxBaseIn', () => {
            // https://www.desmos.com/calculator/q0vu2axmji
            it('should output a specific number with a specific input', () => {
                c = ethers_1.BigNumber.from('0x1199999999999999a');
                mu = ethers_1.BigNumber.from('0x10ccccccccccccccd');
                ts = (0, index_1.toBn)(new decimal_js_1.Decimal(1 /
                    ethers_1.BigNumber.from(index_1.SECONDS_PER_YEAR)
                        .mul(10 * 25)
                        .toNumber()).mul(Math.pow(2, 64))); // inv of seconds in 10 years
                sharesReserves = parseUnits('1100000', decimals);
                fyTokenReserves = parseUnits('1500000', decimals);
                timeTillMaturity = (77760000).toString();
                const result = (0, index_1.maxBaseIn)(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('160364.770', decimals), comparePrecision); // 160,364.770445
            });
        });
        describe('invariant', () => {
            // https://www.desmos.com/calculator/tl0of4wrju
            it('should output a specific number with a specific input', () => {
                c = ethers_1.BigNumber.from('0x1199999999999999a');
                mu = ethers_1.BigNumber.from('0x10ccccccccccccccd');
                ts = (0, index_1.toBn)(new decimal_js_1.Decimal(1 /
                    ethers_1.BigNumber.from(index_1.SECONDS_PER_YEAR)
                        .mul(10 * 25)
                        .toNumber()).mul(Math.pow(2, 64))); // inv of seconds in 10 years
                sharesReserves = parseUnits('1100000', decimals);
                fyTokenReserves = parseUnits('1500000', decimals);
                timeTillMaturity = (77760000).toString();
                const result = (0, index_1.invariant)(sharesReserves, fyTokenReserves, totalSupply, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('1.15532443539', decimals), comparePrecision); // 1.15532443539
            });
        });
    });
    describe('when c is 110 and mu is 105', () => {
        c = ethers_1.BigNumber.from('0x6e0000000000000000'); // 110 in 64 bit
        mu = ethers_1.BigNumber.from('0x690000000000000000'); // 105 in 64 bit
        describe('sellBaseShares (fyTokenOutForSharesIn)', () => {
            it('should be more fyToken out for shares in', () => {
                const result = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.gt(base);
            });
            it('should output a specific number with a specific input', () => {
                const result = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('109490.652', decimals), comparePrecision); // 109,490.652
            });
            it('should have a price of one at maturity', () => {
                // when c stays the same
                const result = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken out
                (0, chai_1.expect)(calcPrice(base, result, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
                // when c grew
                const result2 = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g1, decimals, cGreater, mu);
                (0, chai_1.expect)(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken out
                (0, chai_1.expect)(calcPrice(base, result2, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
            });
            it('should mirror buyFYTokenShares (fyTokenInForSharesOut)', () => {
                const fyTokensOut = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
                // plug the fyTokens out from above into mirror swap function
                const baseIn = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyTokensOut, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(baseIn).to.be.closeTo(base, comparePrecision);
            });
        });
        describe('sellFYTokenShares (sharesOutForFYTokenIn)', () => {
            it('should be fewer shares out than fyToken in', () => {
                const result = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.lt(fyToken);
            });
            it('should output a specific number with a specific input', () => {
                const result = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('90768.266', decimals), comparePrecision); // 90,768.266
            });
            it('should have a price of one at maturity', () => {
                const result = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken out
                (0, chai_1.expect)(calcPrice(result, fyToken, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
                // when c grew
                const result2 = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g2, decimals, cGreater, mu);
                (0, chai_1.expect)(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken out
                (0, chai_1.expect)(calcPrice(result2, fyToken, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
            });
            it('should mirror buyBaseShares (fyTokenInForSharesOut)', () => {
                const sharesOut = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
                // plug the shares out from above into mirror swap function
                const fyTokenIn = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, sharesOut, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(fyTokenIn).to.be.closeTo(fyToken, comparePrecision);
            });
        });
        describe('buyBaseShares (fyTokenInForSharesOut)', () => {
            it('should be more fyToken in than shares out', () => {
                const result = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.gt(base);
            });
            it('should output a specific number with a specific input', () => {
                const result = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('110206.353', decimals), comparePrecision); // 110,206.353
            });
            it('should have a price of one at maturity', () => {
                const result = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g2, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken in
                (0, chai_1.expect)(calcPrice(base, result, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
                // when c grew
                const result2 = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g2, decimals, cGreater, mu);
                (0, chai_1.expect)(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken in
                (0, chai_1.expect)(calcPrice(base, result2, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
            });
            it('should mirror sellFYTokenShares (sharesOutForFYTokenIn)', () => {
                const fyTokenIn = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
                // plug the fyToken in from above into mirror swap function
                const sharesOut = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyTokenIn, timeTillMaturity, ts, g2, decimals, c, mu);
                (0, chai_1.expect)(sharesOut).to.be.closeTo(base, comparePrecision);
            });
        });
        describe('buyFYTokenShares (sharesInForFYTokenOut)', () => {
            it('should be fewer shares in than fyToken out', () => {
                const result = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.lt(fyToken);
            });
            it('should output a specific number with a specific input', () => {
                const result = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('91306.706', decimals), comparePrecision); // 91,306.706
            });
            it('should have a price of one at maturity', () => {
                const result = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g1, decimals, c, mu);
                (0, chai_1.expect)(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken in
                (0, chai_1.expect)(calcPrice(result, fyToken, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
                // when c grew
                const result2 = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g1, decimals, cGreater, mu);
                (0, chai_1.expect)(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken in
                (0, chai_1.expect)(calcPrice(result2, fyToken, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
            });
            it('should mirror sellBaseShares (fyTokenOutForSharesIn)', () => {
                // shares in
                const sharesIn = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
                // plug the shares in from above into mirror swap function
                const fyTokensOut = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, sharesIn, timeTillMaturity, ts, g1, decimals, c, mu);
                (0, chai_1.expect)(fyTokensOut).to.be.closeTo(fyToken, comparePrecision);
            });
        });
    });
    describe('example pool from fork: USDC2209 rolled', () => {
        beforeEach(() => {
            decimals = 6;
            comparePrecision = parseUnits('.001', decimals); // how close the equality check should be within
            c = ethers_1.BigNumber.from('0x010400a7c5ac471b47');
            mu = ethers_1.BigNumber.from('0x010400a7c5ac471b47');
            // example usdc 2209 maturity
            sharesReserves = ethers_1.BigNumber.from('0x031c0f243bb4');
            fyTokenReserves = ethers_1.BigNumber.from('0x031c0f243bb4');
            timeTillMaturity = '9772165';
            g1 = ethers_1.BigNumber.from('0xc000000000000000');
            g2 = ethers_1.BigNumber.from('0x015555555555555555');
            ts = ethers_1.BigNumber.from('0x0571a826b3');
        });
        it('should match sellFyToken desmos', () => {
            const fyTokenIn = parseUnits('100000', decimals);
            const maturity = 1672412400;
            const sellFYTokenResult = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyTokenIn, timeTillMaturity, ts, g2, decimals, c, mu);
            const sellFYTokenResultDefault = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, fyTokenIn, timeTillMaturity, ts, g2, decimals);
            // desmos output
            (0, chai_1.expect)(sellFYTokenResult).to.be.closeTo(parseUnits('98438.611', decimals), comparePrecision); // 98,438.611
            (0, chai_1.expect)(sellFYTokenResultDefault).to.be.closeTo(parseUnits('99951.713', decimals), comparePrecision); // 99,951.713
            // calc apr and compare to current non-tv ui borrow rate
            // const apr = calculateAPR(floorDecimal(sellFYTokenResult), fyTokenIn, maturity);
            // expect(Number(apr)).to.be.closeTo(Number('3.45'), 0.1);
        });
        it('should match buyBase desmos', () => {
            const sharesOut = parseUnits('100000', decimals);
            const buyBaseResult = (0, index_1.buyBase)(sharesReserves, fyTokenReserves, sharesOut, timeTillMaturity, ts, g2, decimals, c, mu);
            // desmos output
            (0, chai_1.expect)(buyBaseResult).to.be.closeTo(parseUnits('101586.928', decimals), comparePrecision); // 101,586.928
        });
        it('should match sellBase desmos', () => {
            const sharesIn = parseUnits('100000', decimals);
            const sellBaseResult = (0, index_1.sellBase)(sharesReserves, fyTokenReserves, sharesIn, timeTillMaturity, ts, g1, decimals, c, mu);
            // desmos output
            (0, chai_1.expect)(sellBaseResult).to.be.closeTo(parseUnits('101521.058', decimals), comparePrecision); // 101,521.058
        });
        it('should match buyFyToken desmos', () => {
            const fyTokenOut = parseUnits('100000', decimals);
            const buyFyTokenResult = (0, index_1.buyFYToken)(sharesReserves, fyTokenReserves, fyTokenOut, timeTillMaturity, ts, g1, decimals, c, mu);
            // desmos output
            (0, chai_1.expect)(buyFyTokenResult).to.be.closeTo(parseUnits('98501.328', decimals), comparePrecision); // 98,501.328
        });
        it('should match maxBaseIn desmos', () => {
            const maxSharesIn = (0, index_1.maxBaseIn)(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals, c, mu);
            // desmos output
            (0, chai_1.expect)(maxSharesIn).to.be.closeTo(parseUnits('-26317.890', decimals), comparePrecision); // −26,317.8905585
        });
        it('should match maxFyTokenIn desmos', () => {
            const _maxFyTokenIn = (0, index_1.maxFyTokenIn)(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c, mu);
            // desmos output
            (0, chai_1.expect)(_maxFyTokenIn).to.be.closeTo(parseUnits('3553185.917', decimals), comparePrecision); // 3,553,185.917
        });
        it('should match maxFyTokenOut desmos', () => {
            const _maxFyTokenOut = (0, index_1.maxFyTokenOut)(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals, c, mu);
            // desmos output
            (0, chai_1.expect)(_maxFyTokenOut).to.be.closeTo(parseUnits('-26727.444', decimals), comparePrecision); // -26,727.4447095
        });
        it('should match maxBaseOut desmos', () => {
            const _maxBaseOut = (0, index_1.maxBaseOut)(sharesReserves);
            // plugging in maxBaseOut result
            const _maxFyTokenIn = (0, index_1.maxFyTokenIn)(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c, mu);
            const sellFYTokenResult = (0, index_1.sellFYToken)(sharesReserves, fyTokenReserves, _maxFyTokenIn, timeTillMaturity, ts, g2, decimals, c, mu);
            // desmos output
            // expect(_maxBaseOut).to.be.closeTo(sellFYTokenResult, decimals), comparePrecision);
            (0, chai_1.expect)(sellFYTokenResult).to.be.closeTo(parseUnits('3419048', decimals), comparePrecision); // 3,419,048
        });
    });
    describe('burn with a totalSupply of zero', () => {
        it('should return [0, 0] when total supply is zero', () => {
            const ZERO_BN = ethers_1.BigNumber.from('0');
            const lpTokens = ethers_1.BigNumber.from('4000');
            sharesReserves = ethers_1.BigNumber.from('1000');
            fyTokenReserves = ethers_1.BigNumber.from('2000');
            totalSupply = ZERO_BN;
            const [z, y] = (0, index_1.burn)(sharesReserves, fyTokenReserves, totalSupply, lpTokens);
            (0, chai_1.expect)(z.toString()).to.equal(ZERO_BN);
            (0, chai_1.expect)(y.toString()).to.equal(ZERO_BN);
        });
    });
});
//# sourceMappingURL=yieldMath.test.js.map
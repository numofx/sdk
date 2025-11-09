import { TokenType } from '../types';


export interface IAssetInfo {

  tokenType: TokenType;

  /* from ISignable for clarity */ 
  name: string;

  address: string;
  symbol: string;

  version: string;
  decimals: number;

  /* required fields + ISignable */
  joinAddress: string;

  /**
   * Optionals 
   *  */
  isYieldBase?: boolean; // used as a yield base ( borrowable ) asset 
  tokenIdentifier?: number | string; // used for identifying tokens in a multitoken contract

  hideToken?: boolean; // Display/hide the token on the UI [ default: true ]

  digitFormat?: number; // this is the 'reasonable' number of digits to show. accuracy equivalent to +- 1 us cent. [ default : 6 ] 
  displaySymbol?: string; // override for symbol display [default: token symbol]
  limitToSeries?: string[];

  wrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the corresponding wrap handler address 
  unwrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the correpsonding unwrap handler address
  proxyId?: string;

}


export const UNKNOWN = '0x000000000000';
export const WETH = '0x303000000000';
export const DAI = '0x303100000000';
export const USDC = '0x303200000000';
export const WBTC = '0x303300000000';
export const stETH = '0x303500000000';
export const wstETH = '0x303400000000';
export const LINK = '0x303600000000';
export const ENS = '0x303700000000';
export const UNI = '0x313000000000';
export const yvUSDC = '0x303900000000';
export const MKR = '0x313100000000';
export const FRAX = '0x313800000000';

/* Notional fCash assets */
export const FDAI2203 = '0x313200000000';
export const FUSDC2203 = '0x313300000000';
export const FDAI2206 = '0x313400000000';
export const FUSDC2206 = '0x313500000000';
export const FDAI2209 = '0x313600000000';
export const FUSDC2209 = '0x313700000000';

/* Convex Curve LP token assets */
export const CVX3CRV = '0x313900000000';

/* Celo assets */
export const cKES = '0x404000000000';
export const USDT_CELO = '0x404100000000';

export const CONVEX_BASED_ASSETS = [
  'CVX3CRV',
  CVX3CRV,
  'CVX3CRV MOCK',
  'Curve.fi DAI/USDC/USDT Convex Deposit Mock',
  'cvx3Crv',
];
export const ETH_BASED_ASSETS = ['WETH', 'ETH', WETH];
export const IGNORE_BASE_ASSETS = ['ENS'];

/* Initiate the ASSET maps */
export const ASSETS_42161 = new Map<string, IAssetInfo>();
export const ASSETS_1 = new Map<string, IAssetInfo>();
export const ASSETS_42220 = new Map<string, IAssetInfo>();

ASSETS_1.set(DAI, {
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  joinAddress: '0x4fE92119CDf873Cf8826F4E6EcfD4E578E3D44Dc',

  version: '1',
  name: 'Dai stable coin',
  decimals: 18,
  symbol: 'DAI',

  digitFormat: 2,
  tokenType: TokenType.ERC20_DaiPermit,
  isYieldBase: true,
});

ASSETS_1.set(USDC, {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  joinAddress: '0x0d9A1A773be5a83eEbda23bf98efB8585C3ae4f4',

  version: '1',
  name: 'USDC Stable coin',
  decimals: 18,
  symbol: 'USDC',

  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,
  isYieldBase: true,
});

ASSETS_1.set(WBTC, {
  address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  joinAddress: '0x00De0AEFcd3069d88f85b4F18b144222eaAb92Af',
  version: '1',
  name: 'Wrapped Bitcoin',
  decimals: 18,
  symbol: 'WBTC',

  digitFormat: 6,
  tokenType: TokenType.ERC20,
});

ASSETS_1.set(ENS, {
  address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
  joinAddress: '0x5AAfd8F0bfe3e1e6bAE781A6641096317D762969',
  version: '1',
  name: 'Ethereum Naming Service',
  decimals: 18,
  symbol: 'ENS',

  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,
});

ASSETS_1.set(WETH, {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  joinAddress: '0x3bDb887Dc46ec0E964Df89fFE2980db0121f0fD0',
  version: '1',
  name: 'Wrapped Ether',
  decimals: 18,
  symbol: 'WETH',
  displaySymbol: 'ETH',

  digitFormat: 6,
  tokenType: TokenType.ERC20,
  isYieldBase: true,
});

ASSETS_1.set(wstETH, {
  address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  joinAddress: '0x5364d336c2d2391717bD366b29B6F351842D7F82',
  version: '1',
  name: 'Wrapped Staked Ether',
  decimals: 18,
  symbol: 'wstETH',
  displaySymbol: 'wstETH',

  digitFormat: 6,
  tokenType: TokenType.ERC20_Permit,
  wrapHandlerAddresses: new Map([]),
  unwrapHandlerAddresses: new Map([
    [1, '0x491aB93faa921C8E634F891F96512Be14fD3DbB1'],
    [4, '0x64BA0F1D2E5479BF132936328e8c533c95646fE8'],
    [5, '0x9f65A6c2b2F12117573323443C8C2290f4C1e675'],
  ]),
});

ASSETS_1.set(stETH, {
  address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  joinAddress: '0x5364d336c2d2391717bD366b29B6F351842D7F82',
  version: '1',
  name: 'Staked Eth',
  decimals: 18,
  symbol: 'stETH',

  digitFormat: 6,
  tokenType: TokenType.ERC20_Permit,
  wrapHandlerAddresses: new Map([[1, '0x491aB93faa921C8E634F891F96512Be14fD3DbB1']]),
  unwrapHandlerAddresses: new Map([]),
  proxyId: wstETH,

  hideToken: true,
});

ASSETS_1.set(LINK, {
  address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  joinAddress: '0xbDaBb91cDbDc252CBfF3A707819C5f7Ec2B92833',

  version: '1',
  name: 'ChainLink',
  decimals: 18,
  symbol: 'LINK',

  digitFormat: 2,
  tokenType: TokenType.ERC20,
});

ASSETS_1.set(yvUSDC, {
  address: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
  joinAddress: '0x403ae7384E89b086Ea2935d5fAFed07465242B38',

  version: '1',
  name: 'Yearn Vault USDC',
  decimals: 18,
  symbol: 'yvUSDC',

  digitFormat: 2,
  tokenType: TokenType.ERC20,
  limitToSeries: ['0x303230350000', '0x303230360000', '0x303230370000', '0x303230380000', '0x303230390000'],
});

ASSETS_1.set(UNI, {
  address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  joinAddress: '0x41567f6A109f5bdE283Eb5501F21e3A0bEcbB779',

  version: '1',
  name: 'Uniswap token',
  decimals: 18,
  symbol: 'UNI',

  digitFormat: 4,
  tokenType: TokenType.ERC20_Permit,
});

ASSETS_1.set(FDAI2203, {
  address: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0xb8d37d6Fcbc6882480633aBF3682b1D4ae2aB124',

  version: '1',
  name: 'fDAI2203',
  decimals: 8,
  symbol: 'FDAI2203',
 
  digitFormat: 2,
  tokenType: TokenType.ERC1155,
  tokenIdentifier: 563371972493313,
  limitToSeries: ['0x303130350000'],

  wrapHandlerAddresses: new Map([]),
  unwrapHandlerAddresses: new Map([]),

  hideToken: true,
});

ASSETS_1.set(FUSDC2203, {
  address: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x4970B046565BEE1DE8308E41BD22d0061A251911',

  version: '1',
  name: 'fUSDC2203',
  decimals: 8,
  symbol: 'FUSDC2203',
  
  digitFormat: 2,
  tokenType: TokenType.ERC1155,
  tokenIdentifier: 844846949203969,
  limitToSeries: ['0x303230350000'],

  hideToken: true,
});

ASSETS_1.set(FDAI2206, {
  address: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x9f41f9eE1A7B24b6B016a7e61a4161A0CFCf5987',

  version: '1',
  name: 'fDAI2206',
  decimals: 8,
  symbol: 'FDAI2206',
 
  digitFormat: 2,
  tokenType: TokenType.ERC1155,
  tokenIdentifier: 563373963149313,
  limitToSeries: ['0x303130360000'],

  hideToken: true,
});

ASSETS_1.set(FUSDC2206, {
  address: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x62DdD41F8A65B03746656D85b6B2539aE42e23e8',

  version: '1',
  name: 'fUSDC2206',
  decimals: 8,
  symbol: 'FUSDC2206',

  digitFormat: 2,
  tokenType: TokenType.ERC1155,
  tokenIdentifier: 844848939859969,
  limitToSeries: ['0x303230360000'],
});

ASSETS_1.set(FDAI2209, {
  address: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x399bA81A1f1Ed0221c39179C50d4d4Bc85C3F3Ab',

  version: '1',
  name: 'fDAI2209',
  decimals: 8,
  symbol: 'FDAI2209',

  digitFormat: 2,
  tokenType: TokenType.ERC1155,
  tokenIdentifier: 563375953805313,
  limitToSeries: ['0x303130370000'],
});

ASSETS_1.set(FUSDC2209, {
  address: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x0Bfd3B8570A4247157c5468861d37dA55AAb9B4b',

  version: '1',
  name: 'fUSDC2209',
  decimals: 8,
  symbol: 'FUSDC2209',

  digitFormat: 2,
  tokenType: TokenType.ERC1155,
  tokenIdentifier: 844850930515969,
  limitToSeries: ['0x303230370000'],
});

ASSETS_1.set(FRAX, {
  address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
  joinAddress: '0x5655A973A49e1F9c1408bb9A617Fd0DBD0352464',

  version: '1',
  name: 'frax',
  decimals: 18,
  symbol: 'FRAX',

  digitFormat: 2,
  tokenType: TokenType.ERC20,
  limitToSeries: [],

  isYieldBase: true,
});

// ASSETS_1.set(CVX3CRV, {

//   address: '',
//   joinAddress: '',
//   version: '1',
//   name: 'cvx3crv',
//   decimals: 18,
//   symbol: 'cvx3crv',
//   digitFormat: 2,
//   tokenType: TokenType.ERC20_,
//   limitToSeries: [
//     '0x303130360000', // june dai
//     '0x303130370000', // sept dai
//     '0x303230370000', // sept usdc
//     '0x303230360000', // june usdc
//   ],
// });

ASSETS_42161.set(DAI, {
  version: '2',
  name: 'Dai stable coin',
  decimals: 18,
  symbol: 'DAI',

  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,

  address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  joinAddress: '0xc31cce4fFA203d8F8D865b6cfaa4F36AD77E9810',
  isYieldBase: true,
});

ASSETS_42161.set(USDC, {
  version: '1',
  name: 'USDC Stable coin',
  decimals: 18,
  symbol: 'USDC',

  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,

  address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  joinAddress: '0x1229C71482E458fa2cd51d13eB157Bd2b5D5d1Ee',
  isYieldBase: true,
});

ASSETS_42161.set(WETH, {
  version: '1',
  name: 'Wrapped Ether',
  decimals: 18,
  symbol: 'WETH',

  displaySymbol: 'ETH',

  digitFormat: 6,
  tokenType: TokenType.ERC20,

  address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  joinAddress: '0xaf93a04d5D8D85F69AF65ED66A9717DB0796fB10',
  isYieldBase: true,
});

/* Celo Mainnet Assets (Chain ID: 42220) */
ASSETS_42220.set(cKES, {
  version: '1',
  name: 'Celo Kenyan Shilling',
  decimals: 18,
  symbol: 'cKES',
  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,
  address: '0x456a3D042C0DbD3db53D5489e98dFb038553B0d0',
  joinAddress: '0x0000000000000000000000000000000000000000', // Not used - pools only
  isYieldBase: true,
});

ASSETS_42220.set(USDT_CELO, {
  version: '1',
  name: 'Tether USD',
  decimals: 6,
  symbol: 'USDT',
  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,
  address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
  joinAddress: '0x0000000000000000000000000000000000000000', // Not used - pools only
  isYieldBase: true,
});

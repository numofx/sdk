export interface BaseAddresses {
    Cauldron: string;
    Ladle: string;
    Witch: string;
  }

export const baseAddresses: Map<number,BaseAddresses> = new Map([
    [
      1,
      {
        Cauldron: '0xc88191F8cb8e6D4a668B047c1C8503432c3Ca867',
        Ladle: '0x6cB18fF2A33e981D1e38A663Ca056c0a5265066A',
        Witch: '0x53C3760670f6091E1eC76B4dd27f73ba4CAd5061',
      },
    ],
    [
      42161,
      {
        Cauldron: '0x23cc87FBEBDD67ccE167Fa9Ec6Ad3b7fE3892E30',
        Ladle: '0x16E25cf364CeCC305590128335B8f327975d0560',
        Witch: '0x08173D0885B00BDD640aaE57D05AbB74cd00d669',
      },
    ],
    [
      42220,
      {
        Cauldron: '0x0000000000000000000000000000000000000000', // Not deployed - pools only
        Ladle: '0x0000000000000000000000000000000000000000', // Not deployed - pools only
        Witch: '0x0000000000000000000000000000000000000000', // Not deployed - pools only
      },
    ],
  ]);
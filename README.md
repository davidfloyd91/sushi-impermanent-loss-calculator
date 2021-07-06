# Sushi impermanent loss calculator

... is a work in progress. Meaning, the title's a bit of an exaggeration: it only supports the WETH-WBTC pool for now.

See what proportion of Sushi pool tokens you deposited and what proportions you would get if you withdrew rn, eg:

```
{
  WBTC: {
    initialAmount: 714361,
    currentAmount: 692903.5174629388,
    change: -21457.48253706121,
    percentChange: '-3.00%'
  },
  WETH: {
    initialAmount: 99849753162625630,
    currentAmount: 103615694331215730,
    change: 3765941168590096,
    percentChange: '3.77%'
  },
  liquidityBalance: 11043719742
}
```

You need `ETH_ADDRESS` (the address you want to check the IL for) and `WEB3_INFURA_PROJECT_ID` in your env. Run like:

```
ETH_ADDRESS=0x92ac69308B8794ecECFfa804278b252DC77982C0 node go.js
```

That address is just some rando's. Apologies rando.

### TODO:

- wrap all the calls in try-catch blocks
- more pools
- fiat conversions (for the unshriven)

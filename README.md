# 🌊 Stream Staker

Dollar cost average into yield-earniung staked ETH. Stream `USDC` on Base Mainnet and get `cbETH`. Powered by Superfluid Subscriptions and Uniswap v3, Built on Base.

## Try it Now on Base

1. Goto to https://streamstaker.finance and connect your wallet (_You need some `USDC` on Base Mainnet_)
2. Hit the [Setup] button to get started (approve transaction)
3. Hit the [Stream] button to use Superfluid Subscriptions to start streaming.
4. Watch `cbETH` accumulate in your wallet over time.

![stream staking](https://streamstaker.finance/images/stream-staking.png)

## How it Works: Setup, Stream, and Stake

*Setup*: Stream Staker deploys a (minimal clone) contract for each user. This `StreamStaker.sol` contract is deployed by the user when they hit the [Setup] button. By using a minimal [clone](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones) on the Base L2, these contracts are deployed using only 122,000 gas and cost approx $0.02 to deploy (example: https://basescan.org/tx/0x909c3a013349c14ea151c195705252d48ad53ee96b560fe61f812e771e83b7e7). The user is the owner of the deployed Staker contract.

*Stream*: After hitting the [Stream] button, the user can use SuperFluid Subscriptions to start streaming to their Staker contract. The user should have `USDC` or `USDCx` in their Base wallet. The Superfluid Subscriptions widget walks them through the required transactions to start the stream. _After the stream has started, no further action is required by the user -- Dollar cost averaging into yield-earning staked ETH has never been so easy_.

*Stake*: Periodically calling the `stake()` function will swap the `USDC` accumulated in the contract for `cbETH` ([Coinbase Staked ETH](https://www.coinbase.com/cbeth)) using Uniswap v3. The `cbETH` _goes directly to user's wallet_ -- it is not held by the Staker contract. While the user can call `stake()` themself, a server-based automation is automatically setup to do this at least once every 24 hours, as long as the acculated balance is greater than 100 `USDCx` (these parameters may change over time, in response to gas prices). A fee of 0.5% is deducted for this automation service.

### Contracts

Two contracts were created for Stream Staker:

- `StreamStakerFactory.sol` is a factory contract that is used to deploy minimal clones of the StreamStaker contract described below. Deployed on Base Mainnet at `0xa7320C8f9a80009Eb2461eA4d7175F8E5bFF546c` [#](https://basescan.org/address/0xa7320c8f9a80009eb2461ea4d7175f8e5bff546c)
- `StreamStaker.sol` is designed to be a narrowly focused contract, with one deployed for each user, that receives the stream of `USDCx`, which periodically is converted to `cbETH` via the `stake()` function, which sends the `cbETH` to user's wallet. The `stake()` function first unwraps the `USDSCx` to `USDC` and then uses Uniswap v3 on Base to swap first to `WETH`, and then to `cbETH` (the lowest cost route, which each pool having a 0.05% fee). Uniswap sends the resulting `cbETH` to the user's wallet -- the Staker contract never holds any token apart from the accumulating `USDCx`. An example contract that was deployed by the factory can be found at `0xB228aa76b32b5DF03DA7680559e9f0833d0342C4` [#](https://basescan.org/address/0xb228aa76b32b5df03da7680559e9f0833d0342c4)

![stake transaction](https://streamstaker.finance/images/stake-txn.png)

#### Why deploy one contract for each user?

On Ethereum Mainnet, the gas cost to deploy a dedicated contract for each user would be prohibitive. But on an L2 like Base, the gas cost is (currently) 2 cents! As such, the low deployment cost on Base makes this an option. Aside from cost, why? The same end goal could have been achieved using a single contract shared by all users, with each user sending their own stream to the contract. But this would require signifcantly more complexity, as the contract would need to keep track of each user's `share` of the accumulating `USDCx` -- requiring that contract be a [Super App](https://docs.superfluid.finance/superfluid/developers/super-apps) and likely requiring that swapped `cbETH` remain in the contract until a user claimed their share via a `withraw()` function. Yes, there would be gas savings by doing batch swaps, especially for users with very small streams. It is a trade-off between complexity, convenience, and transaction costs. Considering these in the context of the low gas context of Base L2, I decided to create a per-user narrowly focused contract (73 lines of Solidity code) that provided the convenience of starting a stream and automatically getting staked ETH in your wallet, with no further intervention required, with no need to claim/withdraw/unwrap. You can set it and forget it.

### Automation

Since Base Mainnet is not yet supported by [Gelato Automate](https://docs.gelato.network/developer-services/automate), a server-based automation was created, powered by Google Firebase. Three serverless functions were created:

- `indexer`: the indexer function indexes new staker contracts that are deployed from the factory contract.
- `automate`: the automate function checks each staker contract and executes a `stake()` transaction when certain conditions are met. These conditions -- which may change in future -- are 1) at least 24 hours have past since the previous automated `stake()` call, and 2) the contract has a balance of at least 100 `USDCx`. 
- `api`: a simple API with two endpoints. `GET /api/staker` will return the staker address for a given `owner` address (if the owner has deployed one). `POST /api/widget` generates a hosted Superfluid Subscriptions widget that can be used to start or modify a stream to the staker contract.

## Future

Possible next steps include:
- enhanced front-end that displays `stake()` transaction history
- documentation!
- support for other LSD tokens, perhaps on multiple L2 networks





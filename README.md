<div align="center">

![CheckSig](./public/logo.svg)

<h1>CheckSig Token Explorer</h1>

**A light, real-time block explorer for CheckSig's Cosmos SDK chains.**

</div>

## About

`CheckSig Token Explorer` is a light explorer for Cosmos-based blockchains. It fetches
data **directly** from each chain's public LCD (REST) / RPC endpoints in the browser —
there is no backend, database, or caching layer. Everything shown in the UI is a live
request against the configured node.

This project is a fork of [ping.pub / explorer](https://github.com/ping-pub/explorer),
maintained by CheckSig. It is distributed under the same GNU GPL-2.0 license as the
upstream project (see [LICENSE](./LICENSE)).

## Development

Package manager is **yarn**.

```sh
yarn --ignore-engines    # install
yarn dev                 # vite dev server
yarn build               # type-check + production build
yarn preview             # preview the production build
yarn format              # prettier --write .
```

## Chain configuration

Chain configs live in `chains/mainnet/*.json` and `chains/testnet/*.json`, loaded at
build time. Which folder is loaded depends on the browser hostname: if it contains the
substring `testnet`, only `chains/testnet/*` is loaded; otherwise `chains/mainnet/*`.
See [`chains/README.md`](./chains/README.md) for the JSON schema.

## Credits

Built on the excellent [Ping Dashboard](https://ping.pub) by
[@liangping](https://github.com/liangping) and [@dingyiming](https://github.com/dingyiming).

## License

[GNU GPL-2.0](./LICENSE) — inherited from the upstream ping.pub/explorer project.
</content>
</invoke>

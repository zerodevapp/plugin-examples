# Session Key Examples

Examples of using session keys.  Please refer to [this doc](https://docs.zerodev.app/use-wallets/use-session-keys) to learn more about session keys.

## Setup

- Create a project for Polygon Mumbai
- Set up environment variables

```bash
export PROJECT_ID="<the mumbai project ID>"
export PRIVATE_KEY=`node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"`
```

## Examples

There are three examples in this directory.

- Creating a session key locally

```bash
node session-key.js
```

- Creating and sending a session key over the network
  - This involves transmitting a private key over a network

```bash
node send-session-key-over-network.js
```

- Registering a session key over the network
  - This is the more secure flow since it doesn't transmite private keys over the network.

```bash
node register-session-key-over-network.js
```

## License

MIT
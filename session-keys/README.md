# Session Keys

Please refer to [this doc](https://docs.zerodev.app/use-wallets/use-session-keys) to learn more about session keys and these examples.

## Setup

- Create a project for Polygon Mumbai
- Set up environment variables

```bash
export PROJECT_ID="<the mumbai project ID>"
export PRIVATE_KEY=`node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"`
```

- Install dependencies

```bash
npm i
```

## Examples

There are three examples in this directory.  Each example is a standalone script that can be run with `node <script-name>.js`.

- [Creating a session key locally](https://github.com/zerodevapp/session-key-examples/blob/main/session-keys/session-key.js)
- [Server creating a session key and sending it to the client](https://github.com/zerodevapp/session-key-examples/blob/main/session-keys/server-creating-session-key.js).
- [Client creating a session key and registering it with the server](https://github.com/zerodevapp/session-key-examples/blob/main/session-keys/client-creating-and-registering-session-key.js).

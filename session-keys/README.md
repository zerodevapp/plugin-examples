# Session Keys

Please refer to [this doc](https://docs.zerodev.app/use-wallets/use-session-keys) to learn more about session keys and these examples.

## Setup

- [Create a project](https://dashboard.zerodev.app/) for Polygon Mumbai
- Set up environment variables

```bash
export PROJECT_ID="<the mumbai project ID>"
export PRIVATE_KEY=`node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"`
```

- Install dependencies

Run this in the root directory:

```bash
npm i
```

## Examples

There are three examples in this directory.  Each example is a standalone script that can be run with `node <script-name>.js`.

- [Creating a session key locally](https://github.com/zerodevapp/session-key-examples/blob/main/session-keys/session-key.js)
- [Owner creating a session key and sending it to the agent](https://github.com/zerodevapp/session-key-examples/blob/main/session-keys/owner-creating-session-key.js).
- [Agent creating a session key and registering it with the owner](https://github.com/zerodevapp/session-key-examples/blob/main/session-keys/agent-registering-session-key.js).

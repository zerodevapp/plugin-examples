const { ECDSAProvider, SessionKeyProvider, EmptyAccountSigner, Operation, ParamCondition, constants } = require('@zerodev/sdk')
const { LocalAccountSigner } = require("@alchemy/aa-core")
const { encodeFunctionData, parseAbi, createPublicClient, http, getFunctionSelector, pad, zeroAddress, getAddress } = require('viem')
const { polygonMumbai } = require('viem/chains')
const { generatePrivateKey } = require('viem/accounts')

// ZeroDev Project ID
const projectId = process.env.PROJECT_ID

// The "owner" of the AA wallet, which in this case is a private key
const owner = LocalAccountSigner.privateKeyToAccountSigner(process.env.PRIVATE_KEY)

// The NFT contract we will be interacting with
const contractAddress = '0x34bE7f35132E97915633BC1fc020364EA5134863'
const contractABI = parseAbi([
  'function mint(address _to) public',
  'function balanceOf(address owner) external view returns (uint256 balance)'
])
const publicClient = createPublicClient({
  chain: polygonMumbai,
  // the API is rate limited and for demo purposes only
  // in production, replace this with your own node provider (e.g. Infura/Alchemy)
  transport: http('https://polygon-mumbai.infura.io/v3/f36f7f706a58477884ce6fe89165666c'),
})

const server = async (sessionPublicKey) => {
  // Create the AA wallet
  const ecdsaProvider = await ECDSAProvider.init({
    projectId,
    owner,
  })
  const address = await ecdsaProvider.getAddress()
  console.log('My address:', address)

  // "Register" the session key
  const sessionKey = new EmptyAccountSigner(sessionPublicKey)

  // Each permission can be considered a "rule" for interacting with a particular
  // contract/function.  To create a key that can interact with multiple
  // contracts/functions, set up one permission for each.
  const permissions = [
    {
      // Target contract to interact with
      target: contractAddress,
      // Maximum value that can be transferred.  In this case we
      // set it to zero so that no value transfer is possible.
      valueLimit: 0,
      // The function (as specified with a selector) that can be called on
      sig: getFunctionSelector(
        "mint(address)"
      ),
      // Whether you'd like to call this function via CALL or DELEGATECALL.
      // DELEGATECALL is dangerous -- don't use it unless you know what you
      // are doing.
      operation: Operation.Call,
      // Each "rule" is a condition on a parameter.  In this case, we only
      // allow for minting NFTs to our own account.
      rules: [
        {
          // The condition in this case is "EQUAL"
          condition: ParamCondition.EQUAL,
          // The offset of the parameter is 0 since it's the first parameter.
          // We will simplify this later.
          offset: 0,
          // We pad the address to be the correct size.
          // We will simplify this later.
          param: pad(address, { size: 32 }),
        },
      ],
    },
  ]

  const sessionKeyProvider = await SessionKeyProvider.init({
    // ZeroDev project ID
    projectId,
    // Pass the ECDSAProvider as default provider
    defaultProvider: ecdsaProvider,
    // the session key (private key)
    sessionKey,
    // session key parameters
    sessionKeyData: {
      // The UNIX timestamp at which the session key becomes valid
      validAfter: 0,
      // The UNIX timestamp at which the session key becomes invalid
      validUntil: 0,
      // The permissions
      permissions,
      // The "paymaster" param specifies whether the session key needs to
      // be used with a specific paymaster.
      // Without it, the holder of the session key can drain ETH from the
      // account by spamming transactions and wasting gas, so it's recommended
      // that you specify a trusted paymaster.
      // 
      // address(0) means it's going to work with or without paymaster
      // address(1) works only with paymaster
      // address(paymaster) works only with the specified paymaster
      paymaster: constants.oneAddress,
    }
  })

  // Serialize the session key
  return await sessionKeyProvider.serializeSessionKeyParams()
}

const sessionPrivateKey = generatePrivateKey()
const sessionKey = LocalAccountSigner.privateKeyToAccountSigner(sessionPrivateKey)

const clientGenerateKey = async () => {
  return await sessionKey.getAddress()
}

const client = async (serializedSessionKey) => {
  const sessionKeyParams = {
    ...SessionKeyProvider.deserializeSessionKeyParams(serializedSessionKey),
    sessionPrivateKey,
  }

  const sessionKeyProvider = await SessionKeyProvider.fromSessionKeyParams({
    projectId,
    sessionKeyParams,
  })
  const address = await sessionKeyProvider.getAddress()

  // Send the transaction
  const { hash } = await sessionKeyProvider.sendUserOperation({
    target: contractAddress,
    data: encodeFunctionData({
      abi: contractABI,
      functionName: "mint",
      args: [address],
    }),
  })

  await sessionKeyProvider.waitForUserOperationTransaction(hash)

  // Check how many NFTs we have
  const balanceOf = await publicClient.readContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'balanceOf',
    args: [address],
  })
  console.log(`NFT balance: ${balanceOf}`)
}

const main = async () => {
  const sessionPublicKey = await clientGenerateKey()
  const serializedSessionKey = await server(sessionPublicKey)
  await client(serializedSessionKey)
}

main().then(() => process.exit(0))
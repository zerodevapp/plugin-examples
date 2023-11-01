const { ECDSAProvider, SessionKeyProvider, Operation, ParamOperator, constants, getPermissionFromABI } = require('@zerodev/sdk')
const { LocalAccountSigner } = require("@alchemy/aa-core")
const { encodeFunctionData, parseAbi, createPublicClient, http, zeroAddress, getAddress } = require('viem')
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

const main = async () => {
  // Create the AA wallet
  const ecdsaProvider = await ECDSAProvider.init({
    projectId,
    owner,
  })
  const address = await ecdsaProvider.getAddress()
  console.log('My address:', address)

  // Generate a private key to use as the session key
  const sessionKey = LocalAccountSigner.privateKeyToAccountSigner(generatePrivateKey())

  // Each permission can be considered a "rule" for interacting with a particular
  // contract/function.  To create a key that can interact with multiple
  // contracts/functions, set up one permission for each.
  const permissions = [
    getPermissionFromABI({
      // Target contract to interact with
      target: contractAddress,
      // Maximum value that can be transferred.  In this case we
      // set it to zero so that no value transfer is possible.
      valueLimit: 0,
      // Whether you'd like to call this function via CALL or DELEGATECALL.
      // DELEGATECALL is dangerous -- don't use it unless you know what you
      // are doing.
      operation: Operation.Call,
      // abi
      abi: contractABI,
      // function name
      functionName: 'mint',
      // arguments
      args: [
        {
          // In this case, we are saying that the address must be equal
          // to the given value.
          operator: ParamOperator.EQUAL,
          value: address,
        }
      ],
    }),
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

main().then(() => process.exit(0))
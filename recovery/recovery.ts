import { ECDSAProvider, RecoveryProvider } from '@zerodev/sdk'
import { LocalAccountSigner, Hex } from "@alchemy/aa-core"
import { generatePrivateKey } from 'viem/accounts'

const projectId = process.env.PROJECT_ID!

const getRandomAccount = () => {
  return LocalAccountSigner.privateKeyToAccountSigner(generatePrivateKey())
}

const oldOwner = getRandomAccount()
const newOwner = getRandomAccount()

const guardian1 = getRandomAccount()
const guardian2 = getRandomAccount()

const main = async () => {
  // Create the AA wallet
  const ecdsaProvider = await ECDSAProvider.init({
    projectId,
    owner: oldOwner,
  })
  const address = await ecdsaProvider.getAddress()
  console.log('My address:', address)

  // Set up recovery for the account
  //
  // In this example, we set it up so that either one of the guardians
  // can recover the account for the user.
  const recoveryData = {
    // Guardian addresses with their weights
    guardians: {
      [await guardian1.getAddress()]: 1,
      [await guardian2.getAddress()]: 1,
    },
    threshold: 1,
    delaySeconds: 0,
  }

  const recoveryProvider = await RecoveryProvider.init({
    projectId,
    defaultProvider: ecdsaProvider,
    opts: {
      validatorConfig: {
        ...recoveryData,
      },
    },
  })

  let result = await recoveryProvider.enableRecovery();
  await recoveryProvider.waitForUserOperationTransaction(result.hash as Hex)

  console.log('Recovery enabled')

  // Initiate a recovery request
  const requesterRecoveryProvider = await RecoveryProvider.init({
    projectId,
    opts: {
      accountConfig: {
        accountAddress: address,
      },
    },
  })
  const recoveryId = await requesterRecoveryProvider.initiateRecovery(await newOwner.getAddress())

  console.log('Recovery initiated')

  // Ask a guardian to sign the recovery request
  const guardianRecoveryProvider = await RecoveryProvider.init({
    projectId,
    recoveryId,
    opts: {
      validatorConfig: {
        accountSigner: guardian1,
      },
    },
  })

  await guardianRecoveryProvider.signRecovery()

  console.log('Guardian signed recovery')

  // Once enough guardians have signed (in this case only 1 is needed),
  // anyone can submit the recovery to complte the recovery, as long as
  // they know the recoveryId.
  const submitterRecoveryProvider = await RecoveryProvider.init({
    projectId,
    recoveryId,
  })

  result = await submitterRecoveryProvider.submitRecovery();
  await submitterRecoveryProvider.waitForUserOperationTransaction(
    result.hash as Hex
  )

  console.log('Recovery submitted')
}

main()
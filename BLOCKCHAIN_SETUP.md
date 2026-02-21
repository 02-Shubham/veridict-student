# Blockchain Integration Guide

The agent is currently running in **simulation mode**, which successfully mimics the blockchain transaction flow. To transition to a real blockchain network (like Ethereum Mainnet, Polygon, or a testnet like Sepolia), you need to provision three variables.

## 1. `BLOCKCHAIN_RPC_URL` (The Access Node)
This is your gateway to the chosen blockchain network.

**How to get it:**
1. Go to an Infrastructure Provider like [Alchemy](https://www.alchemy.com/), [Infura](https://www.infura.io/), or [QuickNode](https://www.quicknode.com/).
2. Create a free account.
3. Click **Create New App/API Key**.
4. Select your target network (e.g., *Ethereum Sepolia* for testing, or *Polygon Mainnet* for cheap production transactions).
5. Copy the **HTTPS URL** provided.
   - Example: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

## 2. `BLOCKCHAIN_PRIVATE_KEY` (The Operator Wallet)
This wallet will pay the "gas" fees to store the submission hashes on the chain.

**How to get it:**
1. Download a reliable wallet like [MetaMask](https://metamask.io/) in your browser.
2. Create a new wallet specifically for this agent (do **NOT** use your personal wallet for security).
3. Fund the wallet with some cryptocurrency on your chosen network (e.g., get testnet ETH from a [Sepolia Faucet](https://sepoliafaucet.com/) for testing, or send real MATIC/ETH for production).
4. In MetaMask, click the three dots `⋮` -> **Account Details** -> **Show Private Key**.
5. Copy the 64-character string (without the `0x` prefix if it has one).
   - **SECURITY WARNING:** Treat this key securely! Putting it in `.env.local` is correct. NEVER commit it to GitHub.

## 3. `SMART_CONTRACT_ADDRESS` (The Storage Vault)
You need to deploy a Smart Contract onto the blockchain network you selected so your agent possesses a place to call the `storeSubmissionHash` method.

**How to get it:**
1. Go to [Remix IDE](https://remix.ethereum.org/).
2. Create a new file called `SubmissionStore.sol` and paste the following baseline code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SubmissionStore {
    // Event emitted when a new hash is stored (useful for later querying the blockchain)
    event HashStored(string examId, string submissionHash, uint256 timestamp);

    // Function matching what the agent calls
    function storeSubmissionHash(string memory examId, string memory submissionHash) public {
        emit HashStored(examId, submissionHash, block.timestamp);
    }
}
```

3. Go to the **Solidity Compiler** tab on the left and click **Compile SubmissionStore.sol**.
4. Go to the **Deploy & Run Transactions** tab.
5. In the "Environment" dropdown, select **Injected Provider - MetaMask**. (MetaMask will ask to connect, make sure you are selected on the correct network).
6. Click **Deploy** and confirm the transaction in MetaMask.
7. Once confirmed, you will see your contract under "Deployed Contracts" at the bottom.
8. Click the `Copy` icon next to the contract name to copy the `0x...` **Smart Contract Address**.

---

### Final Steps: Unlocking the Agent
Once you have all three:
1. Open `.env.local`.
2. Populate the real values:
```env
BLOCKCHAIN_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/..."
BLOCKCHAIN_PRIVATE_KEY="your_64_char_private_key"
SMART_CONTRACT_ADDRESS="0xYourDeployedContractAddress"
```
3. Restart the agent: `npm run agent:blockchain`. The system will automatically exit simulation mode and start hammering hashes permanently onto the real blockchain!

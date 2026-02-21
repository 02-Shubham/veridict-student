import { ethers } from 'ethers';
import solc from 'solc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
    console.log('Compiling contract...');

    const contractPath = path.join(__dirname, '..', 'contracts', 'SubmissionStore.sol');
    const sourceCode = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'SubmissionStore.sol': {
                content: sourceCode,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contract = output.contracts['SubmissionStore.sol']['SubmissionStore'];

    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    console.log('Contract compiled successfully!');
    console.log('Connecting to blockchain...');

    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);

    console.log(`Deploying from account: ${wallet.address}`);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    console.log('Sending deployment transaction...');
    const contractInstance = await factory.deploy();

    console.log('Waiting for block confirmation...');
    await contractInstance.waitForDeployment();

    const address = await contractInstance.getAddress();

    console.log(`\n✅ Success! Contract deployed to: ${address}`);
    console.log(`\nCopy the address above and paste it as your SMART_CONTRACT_ADDRESS in .env.local!`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

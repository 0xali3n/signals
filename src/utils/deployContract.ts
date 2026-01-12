// Contract deployment utility for Linera

import { useWalletStore } from "../store/walletStore";
import { CONTRACT_CONFIG } from "../config/contract";

/**
 * Deploy contract using Linera Web Client
 * Note: This requires WASM files to be built first
 * 
 * @param contractWasmPath - Path to contract WASM file
 * @param serviceWasmPath - Path to service WASM file
 * @param initArgument - Initialization argument (JSON string)
 */
export async function deployContract(
  contractWasmPath: string,
  serviceWasmPath: string,
  initArgument: string = "{}"
): Promise<string> {
  const { wallet, lineraWalletInstance } = useWalletStore.getState();

  if (!wallet || !wallet.chainId || !lineraWalletInstance) {
    throw new Error("Wallet not connected. Please create a wallet first.");
  }

  try {
    // Note: Linera Web Client doesn't directly support publish-and-create
    // You'll need to use the CLI or implement via service API
    // This is a placeholder for the deployment flow

    // For now, deployment should be done via CLI:
    // linera publish-and-create contract.wasm service.wasm --json-argument '{}'

    throw new Error(
      "Contract deployment via Web Client not yet implemented. Please use Linera CLI:\n" +
        `linera publish-and-create ${contractWasmPath} ${serviceWasmPath} --json-argument '${initArgument}'`
    );
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

/**
 * Check if contract is deployed
 */
export function isContractDeployed(): boolean {
  return CONTRACT_CONFIG.APPLICATION_ID !== "YOUR_APPLICATION_ID_HERE";
}

/**
 * Get deployment instructions
 */
export function getDeploymentInstructions(): string {
  return `
# Deploy Contract

1. Build contract:
   cd contract
   cargo build --release --target wasm32-unknown-unknown
   cd ..

2. Deploy using Linera CLI:
   linera publish-and-create \\
     contract/target/wasm32-unknown-unknown/release/signals_contract.wasm \\
     contract/target/wasm32-unknown-unknown/release/signals_service.wasm \\
     --json-argument '{}'

3. Copy the Application ID from output

4. Update src/config/contract.ts:
   APPLICATION_ID: 'YOUR_APPLICATION_ID_HERE'
`;
}

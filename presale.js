let provider;
let signer;
let userAddress;

const presaleContractAddress = "0xe627DDEBa14cb730EAbB4852c67674Ae7F7113Ae";
const presaleAbi = [
    "function buyTokens(uint256 sdaAmount) external payable",
    "function remainingPresaleSupply() external view returns (uint256)"
];

let presaleContract;

// Sidra Chain details
const SIDRA_CHAIN_ID = 97453;
const SIDRA_RPC_URL = "https://node.sidrachain.com";
const SIDRA_CHAIN_NAME = "Sidra Chain";
const SIDRA_CHAIN_SYMBOL = "SDA";
const SIDRA_BLOCK_EXPLORER = "https://ledger.sidrachain.com";

async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed.");
        return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    try {
        await provider.send("eth_requestAccounts", []);
        userAddress = await signer.getAddress();
        document.getElementById("wallet-address").textContent = `Connected: ${userAddress}`;

        const currentChainId = await provider.getNetwork().then(net => net.chainId);
        if (currentChainId !== SIDRA_CHAIN_ID) {
            try {
                await provider.send("wallet_switchEthereumChain", [{
                    chainId: ethers.utils.hexValue(SIDRA_CHAIN_ID)
                }]);
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await provider.send("wallet_addEthereumChain", [{
                        chainId: ethers.utils.hexValue(SIDRA_CHAIN_ID),
                        chainName: SIDRA_CHAIN_NAME,
                        rpcUrls: [SIDRA_RPC_URL],
                        nativeCurrency: {
                            name: SIDRA_CHAIN_SYMBOL,
                            symbol: SIDRA_CHAIN_SYMBOL,
                            decimals: 18
                        },
                        blockExplorerUrls: [SIDRA_BLOCK_EXPLORER]
                    }]);
                } else {
                    alert("Please switch to the Sidra Chain manually.");
                    return;
                }
            }
        }

        presaleContract = new ethers.Contract(presaleContractAddress, presaleAbi, signer);
        updateRemainingSupply();
    } catch (err) {
        console.error("Wallet connection failed:", err);
        alert("Failed to connect wallet.");
    }
}

async function updateRemainingSupply() {
    try {
        const supply = await presaleContract.remainingPresaleSupply();
        const formatted = ethers.utils.formatUnits(supply, 18);
        document.getElementById("remaining-supply").textContent = `${formatted} NOOR`;
    } catch (err) {
        console.error("Error fetching supply:", err);
        document.getElementById("remaining-supply").textContent = "N/A";
    }
}

function calculateNoor() {
    const sdaInput = document.getElementById("sda-amount").value.trim();
    const noorOutput = document.getElementById("noor-amount");
    const sdaValue = parseFloat(sdaInput);

    if (!isNaN(sdaValue) && sdaValue > 0) {
        const noorAmount = sdaValue / 0.002; // 1 NOOR = 0.002 SDA
        noorOutput.textContent = `${noorAmount.toFixed(2)} NOOR`;
    } else {
        noorOutput.textContent = "0 NOOR";
    }
}

async function buyTokens() {
    const sdaInput = document.getElementById("sda-amount").value.trim();
    const status = document.getElementById("status");

    if (!sdaInput || isNaN(sdaInput) || parseFloat(sdaInput) <= 0) {
        alert("Enter a valid SDA amount.");
        return;
    }

    const sdaAmountInWei = ethers.utils.parseEther(sdaInput);

    try {
        const tx = await presaleContract.buyTokens(sdaAmountInWei, {
            value: sdaAmountInWei
        });
        status.textContent = "Transaction pending...";
        await tx.wait();
        status.textContent = "🎉 Purchase successful!";
        updateRemainingSupply();
    } catch (err) {
        console.error("Transaction failed:", err);
        status.textContent = "❌ Transaction failed.";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
}

window.onload = () => {
    document.getElementById("connect-btn").addEventListener("click", connectWallet);
    document.getElementById("sda-amount").addEventListener("input", calculateNoor);
    document.getElementById("buy-btn").addEventListener("click", buyTokens);
    document.body.classList.add("light"); // default to light mode
};

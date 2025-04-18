const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;
let userAddress;

const presaleContractAddress = "0xe627DDEBa14cb730EAbB4852c67674Ae7F7113Ae";
const presaleAbi = [
    "function buyTokens(uint256 sdaAmount) external payable",
    "function remainingPresaleSupply() external view returns (uint256)"
];

let presaleContract;

async function connectWallet() {
    try {
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        document.getElementById("wallet-address").textContent = `Connected: ${userAddress}`;
        presaleContract = new ethers.Contract(presaleContractAddress, presaleAbi, signer);
        updateRemainingSupply();
    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert("Failed to connect wallet. Please try again.");
    }
}

async function updateRemainingSupply() {
    try {
        const supply = await presaleContract.remainingPresaleSupply();
        const formatted = ethers.utils.formatUnits(supply, 18);
        document.getElementById("remaining-supply").textContent = `${formatted} NOOR`;
    } catch (error) {
        console.error("Error fetching remaining supply:", error);
        document.getElementById("remaining-supply").textContent = "N/A";
    }
}

function calculateNoor() {
    const sdaInput = document.getElementById("sda-amount").value;
    const noorOutput = document.getElementById("noor-amount");
    if (!isNaN(sdaInput) && parseFloat(sdaInput) > 0) {
        const noorAmount = parseFloat(sdaInput) / 0.002; // 1 NOOR = 0.002 SDA
        noorOutput.textContent = `${noorAmount.toLocaleString()} NOOR`;
    } else {
        noorOutput.textContent = "0 NOOR";
    }
}

async function buyTokens() {
    const sdaInput = document.getElementById("sda-amount").value;
    if (!sdaInput || isNaN(sdaInput) || parseFloat(sdaInput) <= 0) {
        alert("Enter a valid SDA amount.");
        return;
    }

    const sdaAmountInWei = ethers.utils.parseEther(sdaInput);

    try {
        const tx = await presaleContract.buyTokens(sdaAmountInWei, {
            value: sdaAmountInWei
        });
        document.getElementById("status").textContent = "Transaction pending...";
        await tx.wait();
        document.getElementById("status").textContent = "🎉 Purchase successful!";
        updateRemainingSupply();
    } catch (error) {
        console.error("Transaction failed:", error);
        document.getElementById("status").textContent = "❌ Transaction failed.";
    }
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle("dark");
    body.classList.toggle("light");
}

window.onload = () => {
    document.getElementById("connect-btn").addEventListener("click", connectWallet);
    document.getElementById("sda-amount").addEventListener("input", calculateNoor);
    document.getElementById("buy-btn").addEventListener("click", buyTokens);
};

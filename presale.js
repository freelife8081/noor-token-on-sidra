// Setting up ethers.js and contract details
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const presaleContractAddress = "0xe627DDEBa14cb730EAbB4852c67674Ae7F7113Ae"; // Updated presale contract address
const walletAddress = "0x67F3a324c45761D7CE9748914F1414f50325E29B"; // Developer wallet address
const presaleAbi = [
    "function buyTokens(uint256 sdaAmount) external payable",
    "function remainingPresaleSupply() external view returns (uint256)"
];

const presaleContract = new ethers.Contract(presaleContractAddress, presaleAbi, signer);
const TOKEN_PRICE = 0.002; // Price of 1 NOOR in SDA

// Initialize wallet connection
async function connectWallet() {
    try {
        await provider.send("eth_requestAccounts", []);
        const address = await signer.getAddress();
        document.getElementById("wallet-address").textContent = address;
        updateRemainingSupply();
    } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Please connect your wallet.");
    }
}

// Show remaining presale supply
async function updateRemainingSupply() {
    try {
        const remainingSupply = await presaleContract.remainingPresaleSupply();
        document.getElementById("remaining-supply").textContent = ethers.utils.formatUnits(remainingSupply, 18);
    } catch (error) {
        console.error("Error fetching remaining supply:", error);
        document.getElementById("remaining-supply").textContent = "Error loading supply.";
    }
}

// Calculate NOOR tokens dynamically
function calculateNoorAmount() {
    const sdaAmount = parseFloat(document.getElementById("sda-amount").value);
    
    // Handle invalid or empty input
    if (isNaN(sdaAmount) || sdaAmount <= 0) {
        document.getElementById("noor-amount").textContent = "0";
        return;
    }

    const noorAmount = sdaAmount / TOKEN_PRICE; // Calculate NOOR tokens
    document.getElementById("noor-amount").textContent = noorAmount.toFixed(2); // Update calculated amount
}

// Buy NOOR tokens
async function buyTokens() {
    const sdaAmount = document.getElementById("sda-amount").value;
    if (!sdaAmount || sdaAmount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const sdaAmountInWei = ethers.utils.parseEther(sdaAmount);

    try {
        const tx = await presaleContract.buyTokens(sdaAmountInWei, { value: sdaAmountInWei });
        document.getElementById("status-message").textContent = "Transaction in progress...";
        await tx.wait();
        document.getElementById("status-message").textContent = "Tokens purchased successfully!";
    } catch (error) {
        console.error("Transaction failed:", error);
        document.getElementById("status-message").textContent = "Transaction failed. Please try again.";
    }
}

// Animate header background colors
function animateHeaderBackground() {
    const header = document.querySelector("header");
    let colors = ["#4CAF50", "#ff9800", "#2196F3"];
    let currentIndex = 0;

    setInterval(() => {
        header.style.backgroundColor = colors[currentIndex];
        currentIndex = (currentIndex + 1) % colors.length;
    }, 3000); // Change color every 3 seconds
}

// Initialize the page
window.onload = () => {
    // Animate header background color
    animateHeaderBackground();

    // Allow the user to connect their wallet via button
    const walletConnectButton = document.getElementById("connect-wallet");
    if (walletConnectButton) {
        walletConnectButton.onclick = connectWallet;
    }

    // Connect wallet on page load
    connectWallet();
};

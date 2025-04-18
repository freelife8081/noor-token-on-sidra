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

// Initialize wallet connection
async function connectWallet() {
    try {
        await provider.send("eth_requestAccounts", []);
        const address = await signer.getAddress();
        document.getElementById("wallet-address").textContent = address;
        updateRemainingSupply();
    } catch (error) {
        console.error(error);
        alert("Please connect your wallet.");
    }
}

// Show remaining presale supply
async function updateRemainingSupply() {
    try {
        const remainingSupply = await presaleContract.remainingPresaleSupply();
        document.getElementById("remaining-supply").textContent = ethers.utils.formatUnits(remainingSupply, 18);
    } catch (error) {
        console.error(error);
        document.getElementById("remaining-supply").textContent = "Error loading supply.";
    }
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
        console.error(error);
        document.getElementById("status-message").textContent = "Transaction failed. Please try again.";
    }
}

// Initialize the page
window.onload = () => {
    // Connect wallet on page load
    connectWallet();

    // Allow the user to connect their wallet via button
    const walletConnectButton = document.createElement("button");
    walletConnectButton.textContent = "Connect Wallet";
    walletConnectButton.onclick = connectWallet;
    document.body.prepend(walletConnectButton);
};

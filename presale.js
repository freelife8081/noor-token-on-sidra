// Import the Ethers.js library and initialize provider
const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
let signer;
let userAddress;

// Presale Contract Details
const presaleContractAddress = "0xe627DDEBa14cb730EAbB4852c67674Ae7F7113Ae";
const presaleAbi = [
  "function buyTokens(uint256 sdaAmount) external payable",
  "function remainingPresaleSupply() public view returns (uint256)"
];

let presaleContract;
const totalPresaleSupply = ethers.utils.parseUnits("1000000", 18); // Total supply in wei (18 decimals)

// Function to connect wallet
async function connectWallet() {
  // Check if Ethereum wallet is installed
  if (!window.ethereum) {
    alert("No wallet found. Please install MetaMask or another wallet.");
    return;
  }

  try {
    // Request access to wallet
    await provider.send("eth_requestAccounts", []);

    // Get signer and user address
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    // Update wallet connection status
    document.getElementById("wallet-address").textContent = `Connected: ${userAddress}`;

    // Initialize contract instance
    presaleContract = new ethers.Contract(presaleContractAddress, presaleAbi, signer);

    // Update the remaining supply on the UI
    updateRemainingSupply();
  } catch (error) {
    console.error("Wallet connection error:", error);
    alert("Failed to connect wallet. Please try again.");
  }
}

// Function to fetch and update remaining presale supply
async function updateRemainingSupply() {
  try {
    const remaining = await presaleContract.remainingPresaleSupply();
    const formatted = ethers.utils.formatUnits(remaining, 18); // Convert to human-readable format
    document.getElementById("remaining-supply").textContent = `${formatted} NOOR`;

    // Update progress bar and chart
    updateProgress(remaining);
    updateChart(remaining);
  } catch (error) {
    console.error("Failed to fetch supply:", error);
    document.getElementById("remaining-supply").textContent = "N/A";
    alert("Failed to fetch remaining supply. Please ensure you're connected to the correct network.");
  }
}

// Function to calculate NOOR tokens based on SDA amount entered
function calculateNoor() {
  const sdaValue = parseFloat(document.getElementById("sda-amount").value);
  const output = document.getElementById("noor-amount");
  if (!isNaN(sdaValue) && sdaValue > 0) {
    const noor = sdaValue / 0.002; // Conversion rate
    output.textContent = `${noor.toFixed(2)} NOOR`;
  } else {
    output.textContent = "0 NOOR";
  }
}

// Function to handle token purchase
async function buyTokens() {
  const sdaValue = document.getElementById("sda-amount").value;
  const status = document.getElementById("status");

  // Validate input
  if (!sdaValue || isNaN(sdaValue) || sdaValue <= 0 || sdaValue > 100) {
    alert("Enter a valid SDA amount (max 100)");
    return;
  }

  try {
    // Send transaction to buy tokens
    const sdaAmount = ethers.utils.parseEther(sdaValue); // Convert SDA value to wei
    const tx = await presaleContract.buyTokens(sdaAmount, { value: sdaAmount });
    status.textContent = "Transaction pending...";
    await tx.wait(); // Wait for transaction confirmation
    status.textContent = "✅ Purchase successful!";

    // Update UI after successful purchase
    updateRemainingSupply();
  } catch (error) {
    console.error("Buy failed:", error);
    status.textContent = "❌ Transaction failed. Check your wallet and ensure sufficient funds.";
    alert("Transaction failed: " + error.message);
  }
}

// Function to update the progress bar
function updateProgress(remaining) {
  const sold = totalPresaleSupply.sub(remaining); // Calculate sold tokens
  const percentage = sold.mul(100).div(totalPresaleSupply).toNumber(); // Calculate percentage sold
  document.getElementById("presale-progress").value = percentage;
  document.getElementById("progress-label").textContent = `${percentage}% sold`;
}

// Function to update the presale chart
let chart;
function updateChart(remaining) {
  const sold = totalPresaleSupply.sub(remaining);
  const soldNoor = parseFloat(ethers.utils.formatUnits(sold, 18)); // Convert sold to human-readable format
  const remainingNoor = parseFloat(ethers.utils.formatUnits(remaining, 18)); // Convert remaining to human-readable format

  // Get chart context and create/update chart
  const ctx = document.getElementById("presaleChart").getContext("2d");
  if (chart) chart.destroy(); // Destroy previous chart instance if it exists

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Sold', 'Remaining'],
      datasets: [{
        data: [soldNoor, remainingNoor],
        backgroundColor: ['#00b8d4', '#ccc']
      }]
    },
    options: {
      responsive: true
    }
  });
}

// Initialize event listeners on page load
window.onload = () => {
  document.getElementById("connect-btn").addEventListener("click", connectWallet);
  document.getElementById("sda-amount").addEventListener("input", calculateNoor);
  document.getElementById("buy-btn").addEventListener("click", buyTokens);
};

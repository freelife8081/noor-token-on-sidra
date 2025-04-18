let provider;
let signer;
let userAddress;

const presaleContractAddress = "0xe627DDEBa14cb730EAbB4852c67674Ae7F7113Ae";
const presaleAbi = [
  "function buyTokens(uint256 sdaAmount) external payable",
  "function remainingPresaleSupply() external view returns (uint256)",
  "function getUserSpent(address user) external view returns (uint256)"
];

let presaleContract;

async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  document.getElementById("wallet-address").textContent = `Connected: ${userAddress}`;

  presaleContract = new ethers.Contract(presaleContractAddress, presaleAbi, signer);
  updateRemainingSupply();
  updateUserStats();
}

async function updateRemainingSupply() {
  try {
    const supply = await presaleContract.remainingPresaleSupply();
    document.getElementById("remaining-supply").textContent =
      `${ethers.utils.formatEther(supply)} NOOR`;
  } catch (err) {
    console.error("Error fetching supply:", err);
    document.getElementById("remaining-supply").textContent = "N/A";
  }
}

async function updateUserStats() {
  try {
    const spent = await presaleContract.getUserSpent(userAddress);
    const spentInSDA = ethers.utils.formatEther(spent);
    document.getElementById("user-spent").textContent = `${spentInSDA} SDA`;
  } catch (err) {
    console.error("Error fetching user stats:", err);
    document.getElementById("user-spent").textContent = "N/A";
  }
}

function calculateNoor() {
  const sdaAmount = parseFloat(document.getElementById("sda-amount").value);
  const noorAmount = isNaN(sdaAmount) ? 0 : sdaAmount / 0.002;
  document.getElementById("noor-amount").textContent = `${noorAmount.toFixed(2)} NOOR`;
}

async function buyTokens() {
  const inputField = document.getElementById("sda-amount");
  const sdaInput = inputField.value.trim();
  const status = document.getElementById("status");

  if (!sdaInput || isNaN(sdaInput) || parseFloat(sdaInput) <= 0) {
    alert("Enter a valid SDA amount.");
    return;
  }

  if (parseFloat(sdaInput) > 100) {
    alert("Maximum purchase limit is 100 SDA.");
    inputField.value = "100";
    calculateNoor();
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
    updateUserStats();
  } catch (err) {
    console.error("Transaction failed:", err);
    status.textContent = "❌ Transaction failed.";
  }
}

function startCountdown(endDate) {
  const timerEl = document.getElementById("timer");

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = endDate - now;

    if (distance <= 0) {
      timerEl.textContent = "Presale Ended";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hrs = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((distance % (1000 * 60)) / 1000);

    timerEl.textContent = `${days}d ${hrs}h ${mins}m ${secs}s`;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

window.onload = () => {
  document.getElementById("connect-btn").addEventListener("click", connectWallet);
  document.getElementById("sda-amount").addEventListener("input", calculateNoor);
  document.getElementById("buy-btn").addEventListener("click", buyTokens);

  // Set your presale end date here (YYYY-MM-DDTHH:MM:SSZ format)
  const endDate = new Date("2025-05-01T23:59:59Z").getTime();
  startCountdown(endDate);
};

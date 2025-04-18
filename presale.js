const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
let signer;
let userAddress;

const presaleContractAddress = "0xe627DDEBa14cb730EAbB4852c67674Ae7F7113Ae";
const presaleAbi = [
  "function buyTokens(uint256 sdaAmount) external payable",
  "function remainingPresaleSupply() public view returns (uint256)"
];

let presaleContract;
const totalPresaleSupply = ethers.utils.parseUnits("1000000", 18);

async function connectWallet() {
  try {
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    document.getElementById("wallet-address").textContent = `Connected: ${userAddress}`;
    presaleContract = new ethers.Contract(presaleContractAddress, presaleAbi, signer);
    updateRemainingSupply();
  } catch (error) {
    console.error("Wallet connection error:", error);
    alert("Make sure your wallet is installed and accessible.");
  }
}

async function updateRemainingSupply() {
  try {
    const remaining = await presaleContract.remainingPresaleSupply();
    const formatted = ethers.utils.formatUnits(remaining, 18);
    document.getElementById("remaining-supply").textContent = `${formatted} NOOR`;
    updateProgress(remaining);
    updateChart(remaining);
  } catch (error) {
    console.error("Failed to fetch supply:", error);
    document.getElementById("remaining-supply").textContent = "N/A";
  }
}

function calculateNoor() {
  const sdaValue = parseFloat(document.getElementById("sda-amount").value);
  const output = document.getElementById("noor-amount");
  if (!isNaN(sdaValue) && sdaValue > 0) {
    const noor = sdaValue / 0.002;
    output.textContent = `${noor.toFixed(2)} NOOR`;
  } else {
    output.textContent = "0 NOOR";
  }
}

async function buyTokens() {
  const sdaValue = document.getElementById("sda-amount").value;
  const status = document.getElementById("status");

  if (!sdaValue || isNaN(sdaValue) || sdaValue <= 0 || sdaValue > 100) {
    alert("Enter a valid SDA amount (max 100)");
    return;
  }

  try {
    const sdaAmount = ethers.utils.parseEther(sdaValue);
    const tx = await presaleContract.buyTokens(sdaAmount, { value: sdaAmount });
    status.textContent = "Transaction pending...";
    await tx.wait();
    status.textContent = "✅ Purchase successful!";
    updateRemainingSupply();
  } catch (error) {
    console.error("Buy failed:", error);
    status.textContent = "❌ Transaction failed.";
  }
}

function updateProgress(remaining) {
  const sold = totalPresaleSupply.sub(remaining);
  const percentage = sold.mul(100).div(totalPresaleSupply).toNumber();
  document.getElementById("presale-progress").value = percentage;
  document.getElementById("progress-label").textContent = `${percentage}% sold`;
}

let chart;

function updateChart(remaining) {
  const sold = totalPresaleSupply.sub(remaining);
  const soldNoor = parseFloat(ethers.utils.formatUnits(sold, 18));
  const remainingNoor = parseFloat(ethers.utils.formatUnits(remaining, 18));

  const ctx = document.getElementById("presaleChart").getContext("2d");
  if (chart) chart.destroy();

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

window.onload = () => {
  document.getElementById("connect-btn").addEventListener("click", connectWallet);
  document.getElementById("sda-amount").addEventListener("input", calculateNoor);
  document.getElementById("buy-btn").addEventListener("click", buyTokens);
};

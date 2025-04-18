const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;
let userAddress;

const presaleContractAddress = "0xe627DDEBa14cb730EAbB4852c67674Ae7F7113Ae";
const presaleAbi = [
  "function buyTokens(uint256 sdaAmount) external payable",
  "function remainingPresaleSupply() external view returns (uint256)"
];

let presaleContract;
const TOTAL_PRESALE = ethers.utils.parseUnits("10000000000", 18); // 10B NOOR

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
    alert("Failed to connect wallet.");
  }
}

async function updateRemainingSupply() {
  try {
    const remaining = await presaleContract.remainingPresaleSupply();
    const remainingFormatted = ethers.utils.formatUnits(remaining, 18);
    document.getElementById("remaining-supply").textContent = `${remainingFormatted} NOOR`;

    const sold = TOTAL_PRESALE.sub(remaining);
    const soldPercent = (sold.mul(100).div(TOTAL_PRESALE)).toNumber();

    // Update progress bar
    document.getElementById("progress-bar").style.width = `${soldPercent}%`;

    // Update chart
    renderChart(
      parseFloat(ethers.utils.formatUnits(sold, 18)),
      parseFloat(remainingFormatted)
    );
  } catch (error) {
    console.error("Failed to fetch remaining supply:", error);
    document.getElementById("remaining-supply").textContent = "N/A";
  }
}

function calculateNoor() {
  const sdaInput = document.getElementById("sda-amount").value;
  const noorOutput = document.getElementById("noor-amount");
  const sda = parseFloat(sdaInput);
  if (!isNaN(sda) && sda > 0 && sda <= 100) {
    const noor = sda / 0.002;
    noorOutput.textContent = `${noor.toFixed(2)} NOOR`;
  } else {
    noorOutput.textContent = "0 NOOR";
  }
}

async function buyTokens() {
  const sdaInput = document.getElementById("sda-amount").value;
  const sda = parseFloat(sdaInput);
  if (!sda || isNaN(sda) || sda <= 0 || sda > 100) {
    alert("Enter a valid SDA amount (1 - 100).");
    return;
  }

  const sdaAmountInWei = ethers.utils.parseEther(sdaInput);

  try {
    const tx = await presaleContract.buyTokens(sdaAmountInWei, {
      value: sdaAmountInWei
    });
    document.getElementById("status").textContent = "⏳ Transaction pending...";
    await tx.wait();
    document.getElementById("status").textContent = "✅ Purchase successful!";
    updateRemainingSupply();
  } catch (error) {
    console.error("Buy failed:", error);
    document.getElementById("status").textContent = "❌ Transaction failed.";
  }
}

function renderChart(sold, remaining) {
  const ctx = document.getElementById("presale-chart").getContext("2d");
  if (window.chartInstance) {
    window.chartInstance.destroy();
  }

  window.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Sold NOOR', 'Remaining NOOR'],
      datasets: [{
        data: [sold, remaining],
        backgroundColor: ['#00b8d4', '#ddd']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

window.onload = () => {
  document.getElementById("connect-btn").addEventListener("click", connectWallet);
  document.getElementById("sda-amount").addEventListener("input", calculateNoor);
  document.getElementById("buy-btn").addEventListener("click", buyTokens);
};

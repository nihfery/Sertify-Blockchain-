let web3;
let contract;
let userAccount;

const contractABI = [{
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "author",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "fileHash",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "fileSize",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "fileExtension",
          "type": "string"
        }
      ],
      "name": "FileCertified",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "fileSize",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "fileHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "fileExtension",
          "type": "string"
        }
      ],
      "name": "certifyFile",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "internalType": "string",
          "name": "fileHash",
          "type": "string"
        }
      ],
      "name": "verifyFile",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    } ];
const contractAddress = '0x0f9B0A5E7B71d442A3e82Ceb3c177781c84E65B4'; // dari hasil deploy di Ganache

window.addEventListener('load', async () => {
  console.log("[Init] Halaman dimuat");

  if (window.ethereum) {
    try {
      web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log("[MetaMask] Izin diberikan");

      const accounts = await web3.eth.getAccounts();
      userAccount = accounts[0];
      console.log("[MetaMask] Akun aktif:", userAccount);

      contract = new web3.eth.Contract(contractABI, contractAddress);
      console.log("[SmartContract] Terhubung ke kontrak:", contractAddress);
    } catch (err) {
      console.error("[ERROR] Gagal inisialisasi web3/MetaMask:", err);
      alert("Gagal koneksi ke MetaMask.");
    }
  } else {
    alert("MetaMask tidak terdeteksi!");
    console.warn("[MetaMask] Tidak ditemukan");
  }
});

async function uploadCertificate() {
  const file = document.getElementById('pdfFile').files[0];
  if (!file) {
    alert('Pilih file terlebih dahulu.');
    console.warn("[Upload] Tidak ada file dipilih.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
  try {
    const buffer = new Uint8Array(reader.result);
    const hexString = "0x" + [...buffer].map(x => x.toString(16).padStart(2, '0')).join('');
    const hash = web3.utils.sha3(hexString);

    const timestamp = Math.floor(Date.now() / 1000);
    const fileSize = file.size;
    const extension = file.name.split('.').pop();

    console.log("[Upload] Hash:", hash);
    console.log("[Upload] Timestamp:", timestamp);
    console.log("[Upload] Size:", fileSize);
    console.log("[Upload] Ext:", extension);

    await contract.methods.certifyFile(fileSize, hash, extension)
      .send({ from: userAccount, value: web3.utils.toWei("0.001", "ether") })
      .on('transactionHash', async function(txHash) {
        document.getElementById('uploadStatus').innerText = `Upload sukses! TX Hash: ${txHash}`;

        // Simpan ke backend
        await fetch('http://localhost:3000/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hash: hash,
            author: userAccount,
            timestamp: timestamp,
            txHash: txHash,
            fileSize: fileSize,
            fileExtension: extension
          })
        });
      });

  } catch (err) {
    console.error("[Upload] Gagal proses upload:", err);
    alert("Terjadi kesalahan saat upload.");
  }
};


  reader.onerror = function (err) {
    console.error("[FileReader] Error:", err);
    alert("Gagal membaca file.");
  };

  reader.readAsArrayBuffer(file);
}

async function validateCertificate() {
  const inputHash = document.getElementById('hashInput').value;
  if (!inputHash) {
    alert("Silakan isi hash terlebih dahulu.");
    return;
  }

  try {
    console.log("[Validasi] Memeriksa hash:", inputHash);

    const result = await contract.methods.verifyFile(inputHash).call();

    // result = [author, fileExtension, timestamp, fileSize, originalExtension]
    if (result[0] === '0x0000000000000000000000000000000000000000') {
      document.getElementById('validateResult').innerText = '❌ Sertifikat tidak ditemukan.';
    } else {
      const readableTime = new Date(result[2] * 1000).toLocaleString();
      document.getElementById('validateResult').innerText = `
✅ Valid!
👤 Author: ${result[0]}
📁 Tipe File: ${result[1]}
📅 Waktu Upload: ${readableTime}
📦 Ukuran: ${result[3]} byte
📌 Ekstensi: ${result[4]}
      `;
    }
  } catch (err) {
    console.error("[Validasi] Gagal memvalidasi:", err);
    alert("Terjadi kesalahan saat validasi.");
  }
}

async function validateByTxHash() {
  const txHash = document.getElementById('hashInput').value;
  if (!txHash) {
    alert("Masukkan Tx Hash terlebih dahulu.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/verify-by-tx/${txHash}`);
    if (!response.ok) {
      document.getElementById('validateResult').innerText = '❌ Tidak ditemukan di database.';
      return;
    }
    const data = await response.json();

    document.getElementById('validateResult').innerText = `
✅ Valid (dari Database)
👤 Author: ${data.author}
📁 Tipe File: ${data.fileExtension}
📅 Waktu: ${new Date(data.timestamp * 1000).toLocaleString()}
📦 Ukuran: ${data.fileSize} byte
🧾 File Hash: ${data.hash}
    `;
  } catch (err) {
    console.error("[Validasi TxHash] Error:", err);
    alert("Gagal memvalidasi dari database.");
  }
}

async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      userAccount = accounts[0];
      const shortAddress = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);

      document.getElementById('walletButton').innerText = shortAddress;

      contract = new web3.eth.Contract(contractABI, contractAddress);

      // Toggle dropdown saat tombol wallet diklik
      document.getElementById('walletButton').onclick = toggleWalletDropdown;
    } catch (error) {
      console.error("User rejected connection:", error);
    }
  } else {
    alert("MetaMask tidak ditemukan!");
  }
}

function toggleWalletDropdown() {
  const dropdown = document.getElementById('walletDropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function logoutWallet() {
  userAccount = null;
  document.getElementById('walletButton').innerText = "Connect Wallet";
  document.getElementById('walletButton').onclick = connectWallet;
  document.getElementById('walletDropdown').style.display = 'none';
}

window.addEventListener('click', function (e) {
  const dropdown = document.getElementById('walletDropdown');
  const button = document.getElementById('walletButton');
  if (!button.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});




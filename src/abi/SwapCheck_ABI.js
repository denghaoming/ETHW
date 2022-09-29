export const SwapCheck_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "MAX",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "router",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "pairOther",
        "type": "address"
      }
    ],
    "name": "_checkEthBuyToken",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "calBuyAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "realBuyAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "router",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "pairOther",
        "type": "address"
      }
    ],
    "name": "_checkSellForEth",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "calSellAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "realSellAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "router",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "others",
        "type": "address[]"
      }
    ],
    "name": "checkETHSwap",
    "outputs": [
      {
        "internalType": "address",
        "name": "pairOther",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "calBuyAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "realBuyAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "calSellAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "realSellAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "router",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "others",
        "type": "address[]"
      }
    ],
    "name": "checkSwapForEth",
    "outputs": [
      {
        "internalType": "address",
        "name": "pairOther",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "calSellAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "realSellAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "claimETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "claimToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "router",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "others",
        "type": "address[]"
      }
    ],
    "name": "findPairOther",
    "outputs": [
      {
        "internalType": "address",
        "name": "pairOther",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
]
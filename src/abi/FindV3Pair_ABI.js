export const FindV3Pair_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
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
				"name": "nft",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "start",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "length",
				"type": "uint256"
			}
		],
		"name": "getPairInfos",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "returnLen",
				"type": "uint256"
			},
			{
				"internalType": "uint256[]",
				"name": "token0Decimals",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "token1Decimals",
				"type": "uint256[]"
			},
			{
				"internalType": "string[]",
				"name": "token0Symbols",
				"type": "string[]"
			},
			{
				"internalType": "string[]",
				"name": "token1Symbols",
				"type": "string[]"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "nft",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "start",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "length",
				"type": "uint256"
			}
		],
		"name": "getPairList",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "returnLen",
				"type": "uint256"
			},
			{
				"internalType": "address[]",
				"name": "token0s",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "token0Amounts",
				"type": "uint256[]"
			},
			{
				"internalType": "address[]",
				"name": "token1s",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "token1Amounts",
				"type": "uint256[]"
			},
			{
				"internalType": "address[]",
				"name": "pools",
				"type": "address[]"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"name": "getTokenDecimals",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
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
				"name": "token",
				"type": "address"
			}
		],
		"name": "getTokenSymbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
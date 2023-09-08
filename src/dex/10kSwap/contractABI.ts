export const contractABI = [
    {
      "members": [
        {
          "name": "low",
          "offset": 0,
          "type": "felt"
        },
        {
          "name": "high",
          "offset": 1,
          "type": "felt"
        }
      ],
      "name": "Uint256",
      "size": 2,
      "type": "struct"
    },
    {
      "inputs": [
        {
          "name": "factory",
          "type": "felt"
        },
        {
          "name": "pairClass",
          "type": "felt"
        }
      ],
      "name": "constructor",
      "outputs": [],
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "factory",
      "outputs": [
        {
          "name": "factory",
          "type": "felt"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "amountA",
          "type": "Uint256"
        },
        {
          "name": "reserveA",
          "type": "felt"
        },
        {
          "name": "reserveB",
          "type": "felt"
        }
      ],
      "name": "quote",
      "outputs": [
        {
          "name": "amountB",
          "type": "Uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "amountIn",
          "type": "Uint256"
        },
        {
          "name": "reserveIn",
          "type": "felt"
        },
        {
          "name": "reserveOut",
          "type": "felt"
        }
      ],
      "name": "getAmountOut",
      "outputs": [
        {
          "name": "amountOut",
          "type": "Uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "amountOut",
          "type": "Uint256"
        },
        {
          "name": "reserveIn",
          "type": "felt"
        },
        {
          "name": "reserveOut",
          "type": "felt"
        }
      ],
      "name": "getAmountIn",
      "outputs": [
        {
          "name": "amountIn",
          "type": "Uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "amountIn",
          "type": "Uint256"
        },
        {
          "name": "path_len",
          "type": "felt"
        },
        {
          "name": "path",
          "type": "felt*"
        }
      ],
      "name": "getAmountsOut",
      "outputs": [
        {
          "name": "amounts_len",
          "type": "felt"
        },
        {
          "name": "amounts",
          "type": "Uint256*"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "amountOut",
          "type": "Uint256"
        },
        {
          "name": "path_len",
          "type": "felt"
        },
        {
          "name": "path",
          "type": "felt*"
        }
      ],
      "name": "getAmountsIn",
      "outputs": [
        {
          "name": "amounts_len",
          "type": "felt"
        },
        {
          "name": "amounts",
          "type": "Uint256*"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "tokenA",
          "type": "felt"
        },
        {
          "name": "tokenB",
          "type": "felt"
        },
        {
          "name": "amountADesired",
          "type": "Uint256"
        },
        {
          "name": "amountBDesired",
          "type": "Uint256"
        },
        {
          "name": "amountAMin",
          "type": "Uint256"
        },
        {
          "name": "amountBMin",
          "type": "Uint256"
        },
        {
          "name": "to",
          "type": "felt"
        },
        {
          "name": "deadline",
          "type": "felt"
        }
      ],
      "name": "addLiquidity",
      "outputs": [
        {
          "name": "amountA",
          "type": "Uint256"
        },
        {
          "name": "amountB",
          "type": "Uint256"
        },
        {
          "name": "liquidity",
          "type": "Uint256"
        }
      ],
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "tokenA",
          "type": "felt"
        },
        {
          "name": "tokenB",
          "type": "felt"
        },
        {
          "name": "liquidity",
          "type": "Uint256"
        },
        {
          "name": "amountAMin",
          "type": "Uint256"
        },
        {
          "name": "amountBMin",
          "type": "Uint256"
        },
        {
          "name": "to",
          "type": "felt"
        },
        {
          "name": "deadline",
          "type": "felt"
        }
      ],
      "name": "removeLiquidity",
      "outputs": [
        {
          "name": "amountA",
          "type": "Uint256"
        },
        {
          "name": "amountB",
          "type": "Uint256"
        }
      ],
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "amountIn",
          "type": "Uint256"
        },
        {
          "name": "amountOutMin",
          "type": "Uint256"
        },
        {
          "name": "path_len",
          "type": "felt"
        },
        {
          "name": "path",
          "type": "felt*"
        },
        {
          "name": "to",
          "type": "felt"
        },
        {
          "name": "deadline",
          "type": "felt"
        }
      ],
      "name": "swapExactTokensForTokens",
      "outputs": [
        {
          "name": "amounts_len",
          "type": "felt"
        },
        {
          "name": "amounts",
          "type": "Uint256*"
        }
      ],
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "amountOut",
          "type": "Uint256"
        },
        {
          "name": "amountInMax",
          "type": "Uint256"
        },
        {
          "name": "path_len",
          "type": "felt"
        },
        {
          "name": "path",
          "type": "felt*"
        },
        {
          "name": "to",
          "type": "felt"
        },
        {
          "name": "deadline",
          "type": "felt"
        }
      ],
      "name": "swapTokensForExactTokens",
      "outputs": [
        {
          "name": "amounts_len",
          "type": "felt"
        },
        {
          "name": "amounts",
          "type": "Uint256*"
        }
      ],
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "amountIn",
          "type": "Uint256"
        },
        {
          "name": "amountOutMin",
          "type": "Uint256"
        },
        {
          "name": "path_len",
          "type": "felt"
        },
        {
          "name": "path",
          "type": "felt*"
        },
        {
          "name": "to",
          "type": "felt"
        },
        {
          "name": "deadline",
          "type": "felt"
        }
      ],
      "name": "swapExactTokensForTokensSupportingFeeOnTransferTokens",
      "outputs": [],
      "type": "function"
    }
  ]
export const typing_game_abi = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalLetters",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalWords",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256"
        }
      ],
      "name": "GameCompleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "GameStarted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes1",
          "name": "letter",
          "type": "bytes1"
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
          "name": "gameSession",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "blockNumber",
          "type": "uint256"
        }
      ],
      "name": "LetterTyped",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newPosition",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalLetters",
          "type": "uint256"
        }
      ],
      "name": "ScoreboardUpdated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "totalLetters",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalWords",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        }
      ],
      "name": "completeGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes1",
          "name": "letter",
          "type": "bytes1"
        },
        {
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        }
      ],
      "name": "submitLetter",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "currentGameSession",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "gameSessionWords",
      "outputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "word",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "blockNumber",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "gameSessions",
      "outputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "endTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "finalScore",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "completed",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getContractStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalLetters",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalWords",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalGames",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "currentSession",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        }
      ],
      "name": "getGameSession",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "startTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "endTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "finalScore",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "completed",
              "type": "bool"
            }
          ],
          "internalType": "struct TypingSpeedGame.GameSession",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        }
      ],
      "name": "getGameSessionWordCount",
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
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        }
      ],
      "name": "getGameSessionWords",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "word",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "blockNumber",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "gameSession",
              "type": "uint256"
            }
          ],
          "internalType": "struct TypingSpeedGame.WordEntry[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        }
      ],
      "name": "getPlayerScore",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "totalLetters",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalWords",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "bestLettersPerGame",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "gamesPlayed",
              "type": "uint256"
            }
          ],
          "internalType": "struct TypingSpeedGame.PlayerScore",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        }
      ],
      "name": "getLeaderboard",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "players",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "totalLetters",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        }
      ],
      "name": "getPlayerLeaderboardPosition",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "position",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        }
      ],
      "name": "getRecentWords",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "word",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "blockNumber",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "gameSession",
              "type": "uint256"
            }
          ],
          "internalType": "struct TypingSpeedGame.WordEntry[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "playerBestScores",
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
      "inputs": [],
      "name": "startGame",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "word",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "gameSession",
          "type": "uint256"
        }
      ],
      "name": "submitWord",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalGamesPlayed",
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
      "inputs": [],
      "name": "totalWordsSubmitted",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const

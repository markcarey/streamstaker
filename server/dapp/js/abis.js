const factoryAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_template",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "clone",
          "type": "address"
        }
      ],
      "name": "StreamStakerCreated",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "create",
      "outputs": [
        {
          "internalType": "address",
          "name": "clone",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "template",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
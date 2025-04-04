/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../common";
import type { RBAC, RBACInterface } from "../RBAC";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "InvalidShortString",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "str",
        type: "string",
      },
    ],
    name: "StringTooLong",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [],
    name: "EIP712DomainChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    inputs: [],
    name: "ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "CERTIFIER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "DID_MANAGER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "KEY_MANAGER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "REGISTRAR_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "ROLE_GRANT_TYPEHASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "ROLE_REVOKE_TYPEHASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "version",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "getRoleMember",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleMemberCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "grantRoleWithSignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "revokeRoleWithSignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32[]",
        name: "roles",
        type: "bytes32[]",
      },
    ],
    name: "hasAnyRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantDIDManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeDIDManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantKeyManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeKeyManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x6101606040523480156200001257600080fd5b50604080518082018252600a8152695242414353797374656d60b01b602080830191909152825180840190935260018352603160f81b90830152906200005a8260026200011f565b610120526200006b8160036200011f565b61014052815160208084019190912060e052815190820120610100524660a052620000f960e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a082015260009060c00160405160208183030381529060405280519060200120905090565b60805250503060c0526200010c62000158565b6200011960003362000262565b6200061a565b60006020835110156200013f5762000137836200028d565b905062000152565b816200014c8482620004d9565b5060ff90505b92915050565b620001937fd6b769dbdbf190871759edfb79bd17eda0005e1b8c3b6b3f5b480b5604ad501460008051602062001ffd833981519152620002d9565b620001ce7fd646ae07eb0d0f77457502a65e7407930dff4cd4fd99abc6aac87a753f4c8a4260008051602062001ffd833981519152620002d9565b620001ea60008051602062001ffd8339815191526000620002d9565b620002257f5b5f9f5a74b1c493b5f0ad8f24f12c57d21e0107f7066ad60235ab43d0ca700f60008051602062001ffd833981519152620002d9565b620002607fa46bce5b02f01e523d035933245f19b95101e60756cb86626d3a468790878ddb60008051602062001ffd833981519152620002d9565b565b6200026e828262000324565b6000828152600160205260409020620002889082620003c5565b505050565b600080829050601f81511115620002c4578260405163305a27a960e01b8152600401620002bb9190620005a5565b60405180910390fd5b8051620002d182620005f5565b179392505050565b600082815260208190526040808220600101805490849055905190918391839186917fbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff9190a4505050565b6000828152602081815260408083206001600160a01b038516845290915290205460ff16620003c1576000828152602081815260408083206001600160a01b03851684529091529020805460ff19166001179055620003803390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45b5050565b6000620003dc836001600160a01b038416620003e3565b9392505050565b60008181526001830160205260408120546200042c5750815460018181018455600084815260208082209093018490558454848252828601909352604090209190915562000152565b50600062000152565b634e487b7160e01b600052604160045260246000fd5b600181811c908216806200046057607f821691505b6020821081036200048157634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156200028857600081815260208120601f850160051c81016020861015620004b05750805b601f850160051c820191505b81811015620004d157828155600101620004bc565b505050505050565b81516001600160401b03811115620004f557620004f562000435565b6200050d816200050684546200044b565b8462000487565b602080601f8311600181146200054557600084156200052c5750858301515b600019600386901b1c1916600185901b178555620004d1565b600085815260208120601f198616915b82811015620005765788860151825594840194600190910190840162000555565b5085821015620005955787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b600060208083528351808285015260005b81811015620005d457858101830151858201604001528201620005b6565b506000604082860101526040601f19601f8301168501019250505092915050565b80516020808301519190811015620004815760001960209190910360031b1b16919050565b60805160a05160c05160e0516101005161012051610140516119886200067560003960006106b50152600061068a015260006111f6015260006111ce01526000611129015260006111530152600061117d01526119886000f3fe608060405234801561001057600080fd5b50600436106101735760003560e01c8063839eb7c4116100de578063a217fddf11610097578063ca15c87311610071578063ca15c873146103c4578063d547741f146103d7578063f4b9cd84146103ea578063f68e9553146103fd57600080fd5b8063a217fddf14610382578063b1224f121461038a578063b86575311461039d57600080fd5b8063839eb7c4146102dc57806384b0196e146102ef5780638a00a7361461030a5780639010d07c1461033157806391d148541461035c578063968dba0a1461036f57600080fd5b806361a02b0d1161013057806361a02b0d1461023357806368ca78f91461024657806369d0b5171461025957806375b238fc146102805780637bd532d4146102955780637ecebe00146102bc57600080fd5b806301ffc9a7146101785780630270a1c1146101a05780630cb85cce146101d5578063248a9ca3146101ea5780632f2ff15d1461020d57806336568abe14610220575b600080fd5b61018b61018636600461149f565b610424565b60405190151581526020015b60405180910390f35b6101c77f5066f3d41f0cd3195d5f9a07dc7fa17896c2808cd09861a8e25b465bd3ed8cbb81565b604051908152602001610197565b6101e86101e33660046114e5565b61044f565b005b6101c76101f8366004611500565b60009081526020819052604090206001015490565b6101e861021b366004611519565b6104ca565b6101e861022e366004611519565b6104f4565b6101e86102413660046114e5565b610572565b61018b610254366004611545565b6105e1565b6101c77fd646ae07eb0d0f77457502a65e7407930dff4cd4fd99abc6aac87a753f4c8a4281565b6101c760008051602061193383398151915281565b6101c77f191e04c8fde67b71afb4d57e0072191e9df8d1e4725fda71165d07fe4dfd1d4881565b6101c76102ca3660046114e5565b60046020526000908152604090205481565b6101e86102ea3660046115cb565b61063d565b6102f761067c565b60405161019797969594939291906116af565b6101c77fa46bce5b02f01e523d035933245f19b95101e60756cb86626d3a468790878ddb81565b61034461033f366004611745565b610705565b6040516001600160a01b039091168152602001610197565b61018b61036a366004611519565b61071d565b6101e861037d3660046114e5565b610746565b6101c7600081565b6101e86103983660046115cb565b6107b5565b6101c77f5b5f9f5a74b1c493b5f0ad8f24f12c57d21e0107f7066ad60235ab43d0ca700f81565b6101c76103d2366004611500565b6107ed565b6101e86103e5366004611519565b610804565b6101e86103f83660046114e5565b610829565b6101c77fd6b769dbdbf190871759edfb79bd17eda0005e1b8c3b6b3f5b480b5604ad501481565b60006001600160e01b03198216635a05180f60e01b1480610449575061044982610898565b92915050565b6104676000805160206119338339815191523361071d565b80610478575061047860003361071d565b61049d5760405162461bcd60e51b815260040161049490611767565b60405180910390fd5b6104c77f5b5f9f5a74b1c493b5f0ad8f24f12c57d21e0107f7066ad60235ab43d0ca700f826108cd565b50565b6000828152602081905260409020600101546104e5816108ef565b6104ef83836108f9565b505050565b6001600160a01b03811633146105645760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201526e103937b632b9903337b91039b2b63360891b6064820152608401610494565b61056e82826108cd565b5050565b61058a6000805160206119338339815191523361071d565b8061059b575061059b60003361071d565b6105b75760405162461bcd60e51b815260040161049490611767565b6104c77f5b5f9f5a74b1c493b5f0ad8f24f12c57d21e0107f7066ad60235ab43d0ca700f826108f9565b6000805b828110156106305761060f84848381811061060257610602611795565b905060200201358661071d565b1561061e576001915050610636565b80610628816117c1565b9150506105e5565b50600090505b9392505050565b61066b85858585857f191e04c8fde67b71afb4d57e0072191e9df8d1e4725fda71165d07fe4dfd1d4861091b565b61067585856108f9565b5050505050565b6000606080828080836106b07f00000000000000000000000000000000000000000000000000000000000000006002610ac8565b6106db7f00000000000000000000000000000000000000000000000000000000000000006003610ac8565b60408051600080825260208201909252600f60f81b9b939a50919850469750309650945092509050565b60008281526001602052604081206106369083610b73565b6000918252602082815260408084206001600160a01b0393909316845291905290205460ff1690565b61075e6000805160206119338339815191523361071d565b8061076f575061076f60003361071d565b61078b5760405162461bcd60e51b815260040161049490611767565b6104c77fa46bce5b02f01e523d035933245f19b95101e60756cb86626d3a468790878ddb826108f9565b6107e385858585857f5066f3d41f0cd3195d5f9a07dc7fa17896c2808cd09861a8e25b465bd3ed8cbb61091b565b61067585856108cd565b600081815260016020526040812061044990610b7f565b60008281526020819052604090206001015461081f816108ef565b6104ef83836108cd565b6108416000805160206119338339815191523361071d565b80610852575061085260003361071d565b61086e5760405162461bcd60e51b815260040161049490611767565b6104c77fa46bce5b02f01e523d035933245f19b95101e60756cb86626d3a468790878ddb826108cd565b60006001600160e01b03198216637965db0b60e01b148061044957506301ffc9a760e01b6001600160e01b0319831614610449565b6108d78282610b89565b60008281526001602052604090206104ef9082610bee565b6104c78133610c03565b6109038282610c5c565b60008281526001602052604090206104ef9082610ce0565b8342111561095b5760405162461bcd60e51b815260206004820152600d60248201526c14909050ce88115e1c1a5c9959609a1b6044820152606401610494565b856109a85760405162461bcd60e51b815260206004820152601a60248201527f524241433a2041646d696e20726f6c652070726f7465637465640000000000006044820152606401610494565b6001600160a01b03851660008181526004602090815260408083205481519283018690529082018a905260608201939093526080810183905260a08101879052610a0c9060c001604051602081830303815290604052805190602001208686610cf5565b9050806001600160a01b0316876001600160a01b03161480610a455750600088815260208190526040902060010154610a45908261071d565b80610a565750610a5660008261071d565b610a975760405162461bcd60e51b815260206004820152601260248201527114909050ce88155b985d5d1a1bdc9a5e995960721b6044820152606401610494565b610aa28260016117f0565b6001600160a01b0390971660009081526004602052604090209690965550505050505050565b606060ff8314610ae257610adb83610d4a565b9050610449565b818054610aee90611803565b80601f0160208091040260200160405190810160405280929190818152602001828054610b1a90611803565b8015610b675780601f10610b3c57610100808354040283529160200191610b67565b820191906000526020600020905b815481529060010190602001808311610b4a57829003601f168201915b50505050509050610449565b60006106368383610d89565b6000610449825490565b610b93828261071d565b1561056e576000828152602081815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b6000610636836001600160a01b038416610db3565b610c0d828261071d565b61056e57610c1a81610ea6565b610c25836020610eb8565b604051602001610c3692919061183d565b60408051601f198184030181529082905262461bcd60e51b8252610494916004016118b2565b610c66828261071d565b61056e576000828152602081815260408083206001600160a01b03851684529091529020805460ff19166001179055610c9c3390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b6000610636836001600160a01b038416611054565b6000610d4283838080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250610d3c92508891506110a39050565b906110d0565b949350505050565b60606000610d57836110f4565b604080516020808252818301909252919250600091906020820181803683375050509182525060208101929092525090565b6000826000018281548110610da057610da0611795565b9060005260206000200154905092915050565b60008181526001830160205260408120548015610e9c576000610dd76001836118c5565b8554909150600090610deb906001906118c5565b9050818114610e50576000866000018281548110610e0b57610e0b611795565b9060005260206000200154905080876000018481548110610e2e57610e2e611795565b6000918252602080832090910192909255918252600188019052604090208390555b8554869080610e6157610e616118d8565b600190038181906000526020600020016000905590558560010160008681526020019081526020016000206000905560019350505050610449565b6000915050610449565b60606104496001600160a01b03831660145b60606000610ec78360026118ee565b610ed29060026117f0565b67ffffffffffffffff811115610eea57610eea6117da565b6040519080825280601f01601f191660200182016040528015610f14576020820181803683370190505b509050600360fc1b81600081518110610f2f57610f2f611795565b60200101906001600160f81b031916908160001a905350600f60fb1b81600181518110610f5e57610f5e611795565b60200101906001600160f81b031916908160001a9053506000610f828460026118ee565b610f8d9060016117f0565b90505b6001811115611005576f181899199a1a9b1b9c1cb0b131b232b360811b85600f1660108110610fc157610fc1611795565b1a60f81b828281518110610fd757610fd7611795565b60200101906001600160f81b031916908160001a90535060049490941c93610ffe81611905565b9050610f90565b5083156106365760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610494565b600081815260018301602052604081205461109b57508154600181810184556000848152602080822090930184905584548482528286019093526040902091909155610449565b506000610449565b60006104496110b061111c565b8360405161190160f01b8152600281019290925260228201526042902090565b60008060006110df858561124c565b915091506110ec81611291565b509392505050565b600060ff8216601f81111561044957604051632cd44ac360e21b815260040160405180910390fd5b6000306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614801561117557507f000000000000000000000000000000000000000000000000000000000000000046145b1561119f57507f000000000000000000000000000000000000000000000000000000000000000090565b611247604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260009060c00160405160208183030381529060405280519060200120905090565b905090565b60008082516041036112825760208301516040840151606085015160001a611276878285856113db565b9450945050505061128a565b506000905060025b9250929050565b60008160048111156112a5576112a561191c565b036112ad5750565b60018160048111156112c1576112c161191c565b0361130e5760405162461bcd60e51b815260206004820152601860248201527f45434453413a20696e76616c6964207369676e617475726500000000000000006044820152606401610494565b60028160048111156113225761132261191c565b0361136f5760405162461bcd60e51b815260206004820152601f60248201527f45434453413a20696e76616c6964207369676e6174757265206c656e677468006044820152606401610494565b60038160048111156113835761138361191c565b036104c75760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202773272076616c604482015261756560f01b6064820152608401610494565b6000807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08311156114125750600090506003611496565b6040805160008082526020820180845289905260ff881692820192909252606081018690526080810185905260019060a0016020604051602081039080840390855afa158015611466573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b03811661148f57600060019250925050611496565b9150600090505b94509492505050565b6000602082840312156114b157600080fd5b81356001600160e01b03198116811461063657600080fd5b80356001600160a01b03811681146114e057600080fd5b919050565b6000602082840312156114f757600080fd5b610636826114c9565b60006020828403121561151257600080fd5b5035919050565b6000806040838503121561152c57600080fd5b8235915061153c602084016114c9565b90509250929050565b60008060006040848603121561155a57600080fd5b611563846114c9565b9250602084013567ffffffffffffffff8082111561158057600080fd5b818601915086601f83011261159457600080fd5b8135818111156115a357600080fd5b8760208260051b85010111156115b857600080fd5b6020830194508093505050509250925092565b6000806000806000608086880312156115e357600080fd5b853594506115f3602087016114c9565b935060408601359250606086013567ffffffffffffffff8082111561161757600080fd5b818801915088601f83011261162b57600080fd5b81358181111561163a57600080fd5b89602082850101111561164c57600080fd5b9699959850939650602001949392505050565b60005b8381101561167a578181015183820152602001611662565b50506000910152565b6000815180845261169b81602086016020860161165f565b601f01601f19169290920160200192915050565b60ff60f81b881681526000602060e0818401526116cf60e084018a611683565b83810360408501526116e1818a611683565b606085018990526001600160a01b038816608086015260a0850187905284810360c0860152855180825283870192509083019060005b8181101561173357835183529284019291840191600101611717565b50909c9b505050505050505050505050565b6000806040838503121561175857600080fd5b50508035926020909101359150565b602080825260149082015273292120a19d102932b8bab4b932b99030b236b4b760611b604082015260600190565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b6000600182016117d3576117d36117ab565b5060010190565b634e487b7160e01b600052604160045260246000fd5b80820180821115610449576104496117ab565b600181811c9082168061181757607f821691505b60208210810361183757634e487b7160e01b600052602260045260246000fd5b50919050565b7f416363657373436f6e74726f6c3a206163636f756e742000000000000000000081526000835161187581601785016020880161165f565b7001034b99036b4b9b9b4b733903937b6329607d1b60179184019182015283516118a681602884016020880161165f565b01602801949350505050565b6020815260006106366020830184611683565b81810381811115610449576104496117ab565b634e487b7160e01b600052603160045260246000fd5b8082028115828204841417610449576104496117ab565b600081611914576119146117ab565b506000190190565b634e487b7160e01b600052602160045260246000fdfedf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42a26469706673582212206cb5caa01dea40bb3b821da6b1fbac016354fb4297b41b33843b1c4cc32564ea64736f6c63430008130033df8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42";

type RBACConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: RBACConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class RBAC__factory extends ContractFactory {
  constructor(...args: RBACConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      RBAC & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): RBAC__factory {
    return super.connect(runner) as RBAC__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): RBACInterface {
    return new Interface(_abi) as RBACInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): RBAC {
    return new Contract(address, _abi, runner) as unknown as RBAC;
  }
}

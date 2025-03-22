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
import type { DIDRegistry, DIDRegistryInterface } from "../DIDRegistry";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "docHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "DIDCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "DIDDeactivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "newDocHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "DIDUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newScore",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "delta",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "ReputationUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "StakeWithdrawn",
    type: "event",
  },
  {
    inputs: [],
    name: "INITIAL_REPUTATION",
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
    inputs: [],
    name: "MAX_REPUTATION",
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
    inputs: [],
    name: "MIN_REPUTATION",
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
    inputs: [],
    name: "STAKE_AMOUNT",
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
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "dids",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "docHash",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "created",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reputation",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "owner",
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
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "reputationHistory",
    outputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "int256",
        name: "delta",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "reason",
        type: "string",
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
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "isDIDActive",
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
        name: "user",
        type: "address",
      },
    ],
    name: "getDIDDetails",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "docHash",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "created",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reputation",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "active",
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
        name: "docHash",
        type: "bytes32",
      },
    ],
    name: "createDID",
    outputs: [],
    stateMutability: "payable",
    type: "function",
    payable: true,
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "newDocHash",
        type: "bytes32",
      },
    ],
    name: "updateDID",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "int256",
        name: "delta",
        type: "int256",
      },
      {
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "updateReputation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "hash",
        type: "bytes32",
      },
    ],
    name: "verifyDID",
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
        name: "user",
        type: "address",
      },
    ],
    name: "getReputationHistory",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
          {
            internalType: "int256",
            name: "delta",
            type: "int256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        internalType: "struct DIDRegistry.ReputationChange[]",
        name: "",
        type: "tuple[]",
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
        name: "docHash",
        type: "bytes32",
      },
    ],
    name: "getDID",
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
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b5061001a33610023565b60018055610073565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b61138b806100826000396000f3fe6080604052600436106101095760003560e01c80637b05725811610095578063bb32a7bd11610064578063bb32a7bd14610386578063bed9d861146103b6578063d213c0f2146103cb578063f2fde38b146103e1578063faf5625f1461040157600080fd5b80637b057258146102f25780637be768b7146103075780638da5cb5b14610355578063945ffb0e1461037357600080fd5b806352c764a5116100dc57806352c764a51461020d578063697c60451461026a57806371422e5d1461028d578063715018a6146102bd57806375ac73fc146102d257600080fd5b806326593d711461010e5780633593f81b1461013057806348bb0fe4146101c05780634e7ce73f146101ed575b600080fd5b34801561011a57600080fd5b5061012e610129366004610f67565b61041c565b005b34801561013c57600080fd5b5061018761014b366004610f9c565b6002602081905260009182526040909120805460018201549282015460038301546004909301546001600160a01b039092169392909160ff1685565b604080516001600160a01b03909616865260208601949094529284019190915260608301521515608082015260a0015b60405180910390f35b3480156101cc57600080fd5b506101e06101db366004610f9c565b610554565b6040516101b79190610ffd565b3480156101f957600080fd5b5061012e610208366004611091565b610686565b34801561021957600080fd5b50610187610228366004610f9c565b6001600160a01b03908116600090815260026020819052604090912080546001820154928201546003830154600490930154919094169492939260ff90911690565b34801561027657600080fd5b5061027f600081565b6040519081526020016101b7565b34801561029957600080fd5b506102ad6102a8366004610f9c565b610911565b60405190151581526020016101b7565b3480156102c957600080fd5b5061012e610932565b3480156102de57600080fd5b506102ad6102ed366004611118565b610946565b3480156102fe57600080fd5b5061027f606481565b34801561031357600080fd5b5061033d610322366004610f67565b6000908152600360205260409020546001600160a01b031690565b6040516001600160a01b0390911681526020016101b7565b34801561036157600080fd5b506000546001600160a01b031661033d565b61012e610381366004610f67565b61097e565b34801561039257600080fd5b506103a66103a1366004611118565b610b59565b6040516101b79493929190611142565b3480156103c257600080fd5b5061012e610c35565b3480156103d757600080fd5b5061027f6103e881565b3480156103ed57600080fd5b5061012e6103fc366004610f9c565b610dee565b34801561040d57600080fd5b5061027f662386f26fc1000081565b3360009081526002602052604090206004015460ff166104745760405162461bcd60e51b815260206004820152600e60248201526d444944206e6f742061637469766560901b60448201526064015b60405180910390fd5b3360009081526002602090815260408083208484526003909252909120546001600160a01b0316156104dc5760405162461bcd60e51b815260206004820152601160248201527012185cda08185b1c9958591e481d5cd959607a1b604482015260640161046b565b600181018054600090815260036020908152604080832080546001600160a01b03199081169091559386905585835291829020805433941684179055815185815242918101919091527f942166ce0a952bcc358ca2f20b77aad6239c20c99e0a6a8d12ed384053d9c139910160405180910390a25050565b6001600160a01b0381166000908152600460209081526040808320805482518185028101850190935280835260609492939192909184015b8282101561067b576000848152602090819020604080516080810182526004860290920180546001600160a01b031683526001810154938301939093526002830154908201526003820180549192916060840191906105ea90611179565b80601f016020809104026020016040519081016040528092919081815260200182805461061690611179565b80156106635780601f1061063857610100808354040283529160200191610663565b820191906000526020600020905b81548152906001019060200180831161064657829003601f168201915b5050505050815250508152602001906001019061058c565b505050509050919050565b82806000036106ce5760405162461bcd60e51b815260206004820152601460248201527344656c74612063616e6e6f74206265207a65726f60601b604482015260640161046b565b6000546001600160a01b03163314806106f957503360009081526002602052604090206003015460c8105b6107455760405162461bcd60e51b815260206004820152601760248201527f496e73756666696369656e742070726976696c65676573000000000000000000604482015260640161046b565b61074e85610911565b6107925760405162461bcd60e51b815260206004820152601560248201527454617267657420444944206e6f742061637469766560581b604482015260640161046b565b6001600160a01b038516600090815260026020526040812060038101549091906107bd9087906111b3565b905060006103e882136107df57600082126107d857816107e3565b60006107e3565b6103e85b600384018190556001600160a01b03891660009081526004602090815260409182902082516080810184523381528083018c905242818501528351601f8b01849004840281018401909452898452939450929160608301918a908a90819084018382808284376000920182905250939094525050835460018082018655948252602091829020845160049092020180546001600160a01b0319166001600160a01b0390921691909117815590830151938101939093555060408101516002830155606081015190919060038201906108bb908261124e565b505050876001600160a01b03167f1be0503616f93de4ed26f62c92db231facba576993a0a02e284ce505188072eb82898989426040516108ff95949392919061130e565b60405180910390a25050505050505050565b6001600160a01b031660009081526002602052604090206004015460ff1690565b61093a610e64565b6109446000610ebe565b565b600061095183610911565b801561097757506001600160a01b03831660009081526002602052604090206001015482145b9392505050565b610986610f0e565b662386f26fc1000034146109ce5760405162461bcd60e51b815260206004820152600f60248201526e496e636f7272656374207374616b6560881b604482015260640161046b565b6000818152600360205260409020546001600160a01b031615610a275760405162461bcd60e51b815260206004820152601160248201527012185cda08185b1c9958591e481d5cd959607a1b604482015260640161046b565b610a3033610911565b15610a725760405162461bcd60e51b815260206004820152601260248201527144494420616c72656164792065786973747360701b604482015260640161046b565b60008181526003602081815260408084208054336001600160a01b03199182168117909255825160a08101845282815280850188815242828601818152606460608501908152600160808601818152888d526002808c529c8a9020965187549098166001600160a01b0390981697909717865593519385019390935551988301989098555195810195909555516004909401805460ff19169415159490941790935580518581529182019390935290917f6446facd022fe06a503de5f2908e123c908732795969775fc9b070e2607d5b06910160405180910390a2610b5660018055565b50565b60046020528160005260406000208181548110610b7557600080fd5b600091825260209091206004909102018054600182015460028301546003840180546001600160a01b0390941696509194509291610bb290611179565b80601f0160208091040260200160405190810160405280929190818152602001828054610bde90611179565b8015610c2b5780601f10610c0057610100808354040283529160200191610c2b565b820191906000526020600020905b815481529060010190602001808311610c0e57829003601f168201915b5050505050905084565b3360009081526002602052604090206004015460ff16610c885760405162461bcd60e51b815260206004820152600e60248201526d444944206e6f742061637469766560901b604482015260640161046b565b610c90610f0e565b336000908152600260205260409020600381015460321115610ce95760405162461bcd60e51b815260206004820152601260248201527152657075746174696f6e20746f6f206c6f7760701b604482015260640161046b565b60048101805460ff19169055600181015460009081526003602052604080822080546001600160a01b031916905551662386f26fc100009190339083908381818185875af1925050503d8060008114610d5e576040519150601f19603f3d011682016040523d82523d6000602084013e610d63565b606091505b5050905080610da85760405162461bcd60e51b815260206004820152601160248201527015da5d1a191c985dd85b0819985a5b1959607a1b604482015260640161046b565b6040805183815242602082015233917f933735aa8de6d7547d0126171b2f31b9c34dd00f3ecd4be85a0ba047db4fafef910160405180910390a250505061094460018055565b610df6610e64565b6001600160a01b038116610e5b5760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b606482015260840161046b565b610b5681610ebe565b6000546001600160a01b031633146109445760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640161046b565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b600260015403610f605760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c00604482015260640161046b565b6002600155565b600060208284031215610f7957600080fd5b5035919050565b80356001600160a01b0381168114610f9757600080fd5b919050565b600060208284031215610fae57600080fd5b61097782610f80565b6000815180845260005b81811015610fdd57602081850181015186830182015201610fc1565b506000602082860101526020601f19601f83011685010191505092915050565b60006020808301818452808551808352604092508286019150828160051b87010184880160005b8381101561108357888303603f19018552815180516001600160a01b031684528781015188850152868101518785015260609081015160809185018290529061106f81860183610fb7565b968901969450505090860190600101611024565b509098975050505050505050565b600080600080606085870312156110a757600080fd5b6110b085610f80565b935060208501359250604085013567ffffffffffffffff808211156110d457600080fd5b818701915087601f8301126110e857600080fd5b8135818111156110f757600080fd5b88602082850101111561110957600080fd5b95989497505060200194505050565b6000806040838503121561112b57600080fd5b61113483610f80565b946020939093013593505050565b60018060a01b038516815283602082015282604082015260806060820152600061116f6080830184610fb7565b9695505050505050565b600181811c9082168061118d57607f821691505b6020821081036111ad57634e487b7160e01b600052602260045260246000fd5b50919050565b80820182811260008312801582168215821617156111e157634e487b7160e01b600052601160045260246000fd5b505092915050565b634e487b7160e01b600052604160045260246000fd5b601f82111561124957600081815260208120601f850160051c810160208610156112265750805b601f850160051c820191505b8181101561124557828155600101611232565b5050505b505050565b815167ffffffffffffffff811115611268576112686111e9565b61127c816112768454611179565b846111ff565b602080601f8311600181146112b157600084156112995750858301515b600019600386901b1c1916600185901b178555611245565b600085815260208120601f198616915b828110156112e0578886015182559484019460019091019084016112c1565b50858210156112fe5787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b85815284602082015260806040820152826080820152828460a0830137600060a08483010152600060a0601f19601f8601168301019050826060830152969550505050505056fea264697066735822122056eb4a1498a15e41398506f657c6e776144744af4c6df6376ed0d270d63bdb0a64736f6c63430008130033";

type DIDRegistryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: DIDRegistryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class DIDRegistry__factory extends ContractFactory {
  constructor(...args: DIDRegistryConstructorParams) {
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
      DIDRegistry & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): DIDRegistry__factory {
    return super.connect(runner) as DIDRegistry__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DIDRegistryInterface {
    return new Interface(_abi) as DIDRegistryInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): DIDRegistry {
    return new Contract(address, _abi, runner) as unknown as DIDRegistry;
  }
}

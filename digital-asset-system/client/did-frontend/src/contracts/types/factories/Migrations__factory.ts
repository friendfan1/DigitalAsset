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
import type { Migrations, MigrationsInterface } from "../Migrations";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "last_completed_migration",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
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
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "completed",
        type: "uint256",
      },
    ],
    name: "setCompleted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "new_address",
        type: "address",
      },
    ],
    name: "upgrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50600080546001600160a01b03191633179055610252806100326000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80630900f01014610051578063445df0ac146100665780638da5cb5b14610082578063fdacd576146100ad575b600080fd5b61006461005f3660046101d3565b6100c0565b005b61006f60015481565b6040519081526020015b60405180910390f35b600054610095906001600160a01b031681565b6040516001600160a01b039091168152602001610079565b6100646100bb366004610203565b61017e565b6000546001600160a01b031633146101155760405162461bcd60e51b81526020600482015260136024820152722932b9ba3934b1ba32b2103a379037bbb732b960691b60448201526064015b60405180910390fd5b600154604051637ed66abb60e11b815282916001600160a01b0383169163fdacd576916101489160040190815260200190565b600060405180830381600087803b15801561016257600080fd5b505af1158015610176573d6000803e3d6000fd5b505050505050565b6000546001600160a01b031633146101ce5760405162461bcd60e51b81526020600482015260136024820152722932b9ba3934b1ba32b2103a379037bbb732b960691b604482015260640161010c565b600155565b6000602082840312156101e557600080fd5b81356001600160a01b03811681146101fc57600080fd5b9392505050565b60006020828403121561021557600080fd5b503591905056fea264697066735822122011194d180a9d2da2c057b91b42b3aacdda56977d649f7faa90d53c7b7d2703a064736f6c63430008130033";

type MigrationsConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MigrationsConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Migrations__factory extends ContractFactory {
  constructor(...args: MigrationsConstructorParams) {
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
      Migrations & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): Migrations__factory {
    return super.connect(runner) as Migrations__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MigrationsInterface {
    return new Interface(_abi) as MigrationsInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Migrations {
    return new Contract(address, _abi, runner) as unknown as Migrations;
  }
}

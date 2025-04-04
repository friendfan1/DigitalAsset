/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "./common";

export interface DIDRegistryInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "CREATE_TYPEHASH"
      | "INITIAL_REPUTATION"
      | "MAX_REPUTATION"
      | "MIN_REPUTATION"
      | "REPUTATION_TYPEHASH"
      | "SIGNATURE_VALIDITY"
      | "STAKE_AMOUNT"
      | "UPDATE_DID_TYPEHASH"
      | "WITHDRAW_TYPEHASH"
      | "acceptOwnership"
      | "eip712Domain"
      | "nonces"
      | "owner"
      | "pendingOwner"
      | "renounceOwnership"
      | "transferOwnership"
      | "createDID"
      | "updateDID"
      | "getDID"
      | "isDIDActive"
      | "getDocHashOwner"
      | "getReputationHistory"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "DIDDeactivated"
      | "DIDRegistered"
      | "DIDUpdated"
      | "EIP712DomainChanged"
      | "OwnershipTransferStarted"
      | "OwnershipTransferred"
      | "ReputationChanged"
      | "StakeWithdrawn"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "CREATE_TYPEHASH",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "INITIAL_REPUTATION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MAX_REPUTATION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MIN_REPUTATION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "REPUTATION_TYPEHASH",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "SIGNATURE_VALIDITY",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "STAKE_AMOUNT",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "UPDATE_DID_TYPEHASH",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "WITHDRAW_TYPEHASH",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "acceptOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "eip712Domain",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "nonces", values: [AddressLike]): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "pendingOwner",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "createDID",
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "updateDID",
    values: [BytesLike, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "getDID", values: [AddressLike]): string;
  encodeFunctionData(
    functionFragment: "isDIDActive",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getDocHashOwner",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getReputationHistory",
    values: [AddressLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "CREATE_TYPEHASH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "INITIAL_REPUTATION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MAX_REPUTATION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MIN_REPUTATION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "REPUTATION_TYPEHASH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "SIGNATURE_VALIDITY",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "STAKE_AMOUNT",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "UPDATE_DID_TYPEHASH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "WITHDRAW_TYPEHASH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "acceptOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "eip712Domain",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "nonces", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "pendingOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "createDID", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "updateDID", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getDID", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isDIDActive",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDocHashOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getReputationHistory",
    data: BytesLike
  ): Result;
}

export namespace DIDDeactivatedEvent {
  export type InputTuple = [owner: AddressLike];
  export type OutputTuple = [owner: string];
  export interface OutputObject {
    owner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DIDRegisteredEvent {
  export type InputTuple = [owner: AddressLike, docHash: BytesLike];
  export type OutputTuple = [owner: string, docHash: string];
  export interface OutputObject {
    owner: string;
    docHash: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DIDUpdatedEvent {
  export type InputTuple = [owner: AddressLike, newDocHash: BytesLike];
  export type OutputTuple = [owner: string, newDocHash: string];
  export interface OutputObject {
    owner: string;
    newDocHash: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace EIP712DomainChangedEvent {
  export type InputTuple = [];
  export type OutputTuple = [];
  export interface OutputObject {}
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace OwnershipTransferStartedEvent {
  export type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
  export type OutputTuple = [previousOwner: string, newOwner: string];
  export interface OutputObject {
    previousOwner: string;
    newOwner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace OwnershipTransferredEvent {
  export type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
  export type OutputTuple = [previousOwner: string, newOwner: string];
  export interface OutputObject {
    previousOwner: string;
    newOwner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ReputationChangedEvent {
  export type InputTuple = [
    target: AddressLike,
    operator: AddressLike,
    newScore: BigNumberish,
    delta: BigNumberish
  ];
  export type OutputTuple = [
    target: string,
    operator: string,
    newScore: bigint,
    delta: bigint
  ];
  export interface OutputObject {
    target: string;
    operator: string;
    newScore: bigint;
    delta: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace StakeWithdrawnEvent {
  export type InputTuple = [owner: AddressLike, amount: BigNumberish];
  export type OutputTuple = [owner: string, amount: bigint];
  export interface OutputObject {
    owner: string;
    amount: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface DIDRegistry extends BaseContract {
  connect(runner?: ContractRunner | null): DIDRegistry;
  waitForDeployment(): Promise<this>;

  interface: DIDRegistryInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  CREATE_TYPEHASH: TypedContractMethod<[], [string], "view">;

  INITIAL_REPUTATION: TypedContractMethod<[], [bigint], "view">;

  MAX_REPUTATION: TypedContractMethod<[], [bigint], "view">;

  MIN_REPUTATION: TypedContractMethod<[], [bigint], "view">;

  REPUTATION_TYPEHASH: TypedContractMethod<[], [string], "view">;

  SIGNATURE_VALIDITY: TypedContractMethod<[], [bigint], "view">;

  STAKE_AMOUNT: TypedContractMethod<[], [bigint], "view">;

  UPDATE_DID_TYPEHASH: TypedContractMethod<[], [string], "view">;

  WITHDRAW_TYPEHASH: TypedContractMethod<[], [string], "view">;

  /**
   * The new owner accepts the ownership transfer.
   */
  acceptOwnership: TypedContractMethod<[], [void], "nonpayable">;

  /**
   * See {EIP-5267}. _Available since v4.9._
   */
  eip712Domain: TypedContractMethod<
    [],
    [
      [string, string, string, bigint, string, string, bigint[]] & {
        fields: string;
        name: string;
        version: string;
        chainId: bigint;
        verifyingContract: string;
        salt: string;
        extensions: bigint[];
      }
    ],
    "view"
  >;

  nonces: TypedContractMethod<[arg0: AddressLike], [bigint], "view">;

  /**
   * Returns the address of the current owner.
   */
  owner: TypedContractMethod<[], [string], "view">;

  /**
   * Returns the address of the pending owner.
   */
  pendingOwner: TypedContractMethod<[], [string], "view">;

  /**
   * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.
   */
  renounceOwnership: TypedContractMethod<[], [void], "nonpayable">;

  /**
   * Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one. Can only be called by the current owner.
   */
  transferOwnership: TypedContractMethod<
    [newOwner: AddressLike],
    [void],
    "nonpayable"
  >;

  createDID: TypedContractMethod<
    [docHash: BytesLike, signature: BytesLike],
    [void],
    "payable"
  >;

  updateDID: TypedContractMethod<
    [newDocHash: BytesLike, deadline: BigNumberish, signature: BytesLike],
    [void],
    "nonpayable"
  >;

  getDID: TypedContractMethod<
    [user: AddressLike],
    [
      [string, bigint, bigint, boolean, string] & {
        docHash: string;
        created: bigint;
        reputation: bigint;
        active: boolean;
        controller: string;
      }
    ],
    "view"
  >;

  isDIDActive: TypedContractMethod<[user: AddressLike], [boolean], "view">;

  getDocHashOwner: TypedContractMethod<[docHash: BytesLike], [string], "view">;

  getReputationHistory: TypedContractMethod<
    [user: AddressLike],
    [
      [string[], bigint[], bigint[], string[]] & {
        operators: string[];
        deltas: bigint[];
        timestamps: bigint[];
        reasons: string[];
      }
    ],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "CREATE_TYPEHASH"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "INITIAL_REPUTATION"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "MAX_REPUTATION"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "MIN_REPUTATION"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "REPUTATION_TYPEHASH"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "SIGNATURE_VALIDITY"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "STAKE_AMOUNT"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "UPDATE_DID_TYPEHASH"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "WITHDRAW_TYPEHASH"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "acceptOwnership"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "eip712Domain"
  ): TypedContractMethod<
    [],
    [
      [string, string, string, bigint, string, string, bigint[]] & {
        fields: string;
        name: string;
        version: string;
        chainId: bigint;
        verifyingContract: string;
        salt: string;
        extensions: bigint[];
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "nonces"
  ): TypedContractMethod<[arg0: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "pendingOwner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "renounceOwnership"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "transferOwnership"
  ): TypedContractMethod<[newOwner: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "createDID"
  ): TypedContractMethod<
    [docHash: BytesLike, signature: BytesLike],
    [void],
    "payable"
  >;
  getFunction(
    nameOrSignature: "updateDID"
  ): TypedContractMethod<
    [newDocHash: BytesLike, deadline: BigNumberish, signature: BytesLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "getDID"
  ): TypedContractMethod<
    [user: AddressLike],
    [
      [string, bigint, bigint, boolean, string] & {
        docHash: string;
        created: bigint;
        reputation: bigint;
        active: boolean;
        controller: string;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "isDIDActive"
  ): TypedContractMethod<[user: AddressLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "getDocHashOwner"
  ): TypedContractMethod<[docHash: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "getReputationHistory"
  ): TypedContractMethod<
    [user: AddressLike],
    [
      [string[], bigint[], bigint[], string[]] & {
        operators: string[];
        deltas: bigint[];
        timestamps: bigint[];
        reasons: string[];
      }
    ],
    "view"
  >;

  getEvent(
    key: "DIDDeactivated"
  ): TypedContractEvent<
    DIDDeactivatedEvent.InputTuple,
    DIDDeactivatedEvent.OutputTuple,
    DIDDeactivatedEvent.OutputObject
  >;
  getEvent(
    key: "DIDRegistered"
  ): TypedContractEvent<
    DIDRegisteredEvent.InputTuple,
    DIDRegisteredEvent.OutputTuple,
    DIDRegisteredEvent.OutputObject
  >;
  getEvent(
    key: "DIDUpdated"
  ): TypedContractEvent<
    DIDUpdatedEvent.InputTuple,
    DIDUpdatedEvent.OutputTuple,
    DIDUpdatedEvent.OutputObject
  >;
  getEvent(
    key: "EIP712DomainChanged"
  ): TypedContractEvent<
    EIP712DomainChangedEvent.InputTuple,
    EIP712DomainChangedEvent.OutputTuple,
    EIP712DomainChangedEvent.OutputObject
  >;
  getEvent(
    key: "OwnershipTransferStarted"
  ): TypedContractEvent<
    OwnershipTransferStartedEvent.InputTuple,
    OwnershipTransferStartedEvent.OutputTuple,
    OwnershipTransferStartedEvent.OutputObject
  >;
  getEvent(
    key: "OwnershipTransferred"
  ): TypedContractEvent<
    OwnershipTransferredEvent.InputTuple,
    OwnershipTransferredEvent.OutputTuple,
    OwnershipTransferredEvent.OutputObject
  >;
  getEvent(
    key: "ReputationChanged"
  ): TypedContractEvent<
    ReputationChangedEvent.InputTuple,
    ReputationChangedEvent.OutputTuple,
    ReputationChangedEvent.OutputObject
  >;
  getEvent(
    key: "StakeWithdrawn"
  ): TypedContractEvent<
    StakeWithdrawnEvent.InputTuple,
    StakeWithdrawnEvent.OutputTuple,
    StakeWithdrawnEvent.OutputObject
  >;

  filters: {
    "DIDDeactivated(address)": TypedContractEvent<
      DIDDeactivatedEvent.InputTuple,
      DIDDeactivatedEvent.OutputTuple,
      DIDDeactivatedEvent.OutputObject
    >;
    DIDDeactivated: TypedContractEvent<
      DIDDeactivatedEvent.InputTuple,
      DIDDeactivatedEvent.OutputTuple,
      DIDDeactivatedEvent.OutputObject
    >;

    "DIDRegistered(address,bytes32)": TypedContractEvent<
      DIDRegisteredEvent.InputTuple,
      DIDRegisteredEvent.OutputTuple,
      DIDRegisteredEvent.OutputObject
    >;
    DIDRegistered: TypedContractEvent<
      DIDRegisteredEvent.InputTuple,
      DIDRegisteredEvent.OutputTuple,
      DIDRegisteredEvent.OutputObject
    >;

    "DIDUpdated(address,bytes32)": TypedContractEvent<
      DIDUpdatedEvent.InputTuple,
      DIDUpdatedEvent.OutputTuple,
      DIDUpdatedEvent.OutputObject
    >;
    DIDUpdated: TypedContractEvent<
      DIDUpdatedEvent.InputTuple,
      DIDUpdatedEvent.OutputTuple,
      DIDUpdatedEvent.OutputObject
    >;

    "EIP712DomainChanged()": TypedContractEvent<
      EIP712DomainChangedEvent.InputTuple,
      EIP712DomainChangedEvent.OutputTuple,
      EIP712DomainChangedEvent.OutputObject
    >;
    EIP712DomainChanged: TypedContractEvent<
      EIP712DomainChangedEvent.InputTuple,
      EIP712DomainChangedEvent.OutputTuple,
      EIP712DomainChangedEvent.OutputObject
    >;

    "OwnershipTransferStarted(address,address)": TypedContractEvent<
      OwnershipTransferStartedEvent.InputTuple,
      OwnershipTransferStartedEvent.OutputTuple,
      OwnershipTransferStartedEvent.OutputObject
    >;
    OwnershipTransferStarted: TypedContractEvent<
      OwnershipTransferStartedEvent.InputTuple,
      OwnershipTransferStartedEvent.OutputTuple,
      OwnershipTransferStartedEvent.OutputObject
    >;

    "OwnershipTransferred(address,address)": TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;
    OwnershipTransferred: TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;

    "ReputationChanged(address,address,uint256,int256)": TypedContractEvent<
      ReputationChangedEvent.InputTuple,
      ReputationChangedEvent.OutputTuple,
      ReputationChangedEvent.OutputObject
    >;
    ReputationChanged: TypedContractEvent<
      ReputationChangedEvent.InputTuple,
      ReputationChangedEvent.OutputTuple,
      ReputationChangedEvent.OutputObject
    >;

    "StakeWithdrawn(address,uint256)": TypedContractEvent<
      StakeWithdrawnEvent.InputTuple,
      StakeWithdrawnEvent.OutputTuple,
      StakeWithdrawnEvent.OutputObject
    >;
    StakeWithdrawn: TypedContractEvent<
      StakeWithdrawnEvent.InputTuple,
      StakeWithdrawnEvent.OutputTuple,
      StakeWithdrawnEvent.OutputObject
    >;
  };
}

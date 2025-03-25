#!/bin/bash

# 设置Web3j版本
WEB3J_VERSION=4.10.3

# 设置合约目录
CONTRACT_DIR=src/main/resources/contracts
OUTPUT_DIR=src/main/java

# 下载Web3j CLI
curl -L get.web3j.io | sh

# 生成Java包装类
web3j generate solidity \
    -a $CONTRACT_DIR/DigitalAsset.sol \
    -b $CONTRACT_DIR/build \
    -o $OUTPUT_DIR \
    -p com.wpf.DigitalAsset.contracts 
import { ethers } from "ethers";

// utils/hashUtils.ts
export const generateStableHash = (obj: object) => {
    const sortedObj = JSON.stringify(obj, Object.keys(obj).sort());
    return ethers.keccak256(ethers.toUtf8Bytes(sortedObj));
  };
  
// src/utils/address.ts
export function shortenAddress(address: string, chars = 4): string {
    // 检查地址是否符合基本格式要求
    if (!address) {
        return "";
    }
    // 截取地址的前几个字符和后几个字符，中间用省略号连接
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
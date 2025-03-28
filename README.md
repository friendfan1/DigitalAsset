# 数字资产管理系统

## 项目简介

这是一个基于区块链技术的数字资产管理系统，支持数字资产的注册、认证、交易和管理。系统采用前后端分离架构，前端使用Vue 3 + Element Plus构建，后端使用Spring Boot，智能合约使用Solidity编写。

## 主要功能

- 用户管理

  - 用户注册与登录
  - 企业认证
  - 钱包绑定
  - 权限管理
- 资产管理

  - 数字资产上传与注册
  - 资产认证
  - 资产交易
  - 资产存证
- 系统管理

  - 企业认证审核
  - 权限管理
  - 系统监控

## 技术栈

### 前端

- Vue 3
- TypeScript
- Element Plus
- Vite
- Vue Router
- Pinia
- Web3.js

### 后端

- Spring Boot
- Spring Security
- MySQL
- JPA/Hibernate
- JWT认证
- Web3j

### 区块链

- Solidity
- Truffle
- Web3.js
- MetaMask

## 项目结构

```
2025BlockAsset/
├── digital-asset-system/    # 前端和智能合约
│   ├── client/             # 前端代码
│   │   ├── src/
│   │   │   ├── components/ # 组件
│   │   │   ├── views/      # 页面
│   │   │   ├── stores/     # 状态管理
│   │   │   ├── utils/      # 工具函数
│   │   │   └── router/     # 路由配置
│   ├── contracts/          # 智能合约
│   ├── migrations/         # 数据库迁移
│   └── test/              # 测试文件
└── DigitalAsset/          # 后端代码
    └── DigitalAsset/
        ├── src/
        │   ├── main/
        │   │   ├── java/   # Java源代码
        │   │   └── resources/  # 配置文件
        └── pom.xml        # Maven配置文件
```

## 安装和运行

### 环境要求

- Node.js >= 16
- Java >= 17
- MySQL >= 8.0
- Maven >= 3.8
- MetaMask 浏览器插件

### 安装步骤

1. 克隆项目

```bash
git clone https://github.com/friendfan1/2025BlockAsset.git
cd 2025BlockAsset
```

2. 安装前端依赖

```bash
cd digital-asset-system/client
npm install
```

3. 安装后端依赖

```bash
cd ../../DigitalAsset/DigitalAsset
mvn clean install
```

4. 配置环境变量

- 前端：复制 `digital-asset-system/client/.env.example` 为 `.env`
- 后端：修改 `DigitalAsset/DigitalAsset/src/main/resources/application.yml`

5. 启动服务

```bash
# 启动后端服务
cd DigitalAsset/DigitalAsset
mvn spring-boot:run

# 启动前端服务
cd ../../digital-asset-system/client
npm run dev

# 部署智能合约
cd ../contracts
truffle migrate
```

## 使用说明

1. 访问系统

- 打开浏览器访问 `http://localhost:5173`
- 确保已安装并解锁 MetaMask

2. 用户注册

- 点击"注册"按钮
- 填写企业信息
- 等待管理员审核

3. 资产管理

- 登录后进入资产管理页面
- 上传数字资产
- 设置资产属性
- 提交认证申请

4. 资产认证

- 认证人审核资产
- 确认资产信息
- 完成认证

## 开发团队

- 前端开发：吴平凡
- 后端开发：吴平凡
- 智能合约开发：吴平凡

## 许可证

MIT License

## 联系方式

- 邮箱：1911826283@qq.com
- 项目地址：https://github.com/friendfan1

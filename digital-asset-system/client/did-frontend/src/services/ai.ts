import axios from 'axios';

// 定义可用的模型列表
export const AVAILABLE_MODELS = [
  'Qwen/QwQ-32B',
  'deepseek-ai/DeepSeek-R1',
  'deepseek-ai/DeepSeek-V3',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
  'Pro/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  'Pro/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
  'deepseek-ai/DeepSeek-V2.5',
  'Qwen/Qwen2.5-72B-Instruct-128K',
  'Qwen/Qwen2.5-72B-Instruct',
  'Qwen/Qwen2.5-32B-Instruct',
  'Qwen/Qwen2.5-14B-Instruct',
  'Qwen/Qwen2.5-7B-Instruct',
  'Qwen/Qwen2.5-Coder-32B-Instruct',
  'Qwen/Qwen2.5-Coder-7B-Instruct',
  'Qwen/Qwen2-7B-Instruct',
  'Qwen/Qwen2-1.5B-Instruct',
  'Qwen/QwQ-32B-Preview',
  'TeleAI/TeleChat2',
  'THUDM/glm-4-9b-chat',
  'Vendor-A/Qwen/Qwen2.5-72B-Instruct',
  'internlm/internlm2_5-7b-chat',
  'internlm/internlm2_5-20b-chat',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

class AIService {
  private conversationHistory: Message[] = [];

  constructor() {
    this.conversationHistory.push({
      role: 'assistant',
      content: `您好！我是区块链数字资产管理系统的AI助手，很高兴为您服务。我可以帮助您解决以下方面的问题：

1. 资产管理
   - 数字资产上传与区块链注册
   - 资产查询与管理
   - 资产元数据更新
   - 资产完整性验证

2. 区块链认证
   - 资产认证申请与审核
   - 批量认证操作
   - 认证历史查询
   - 认证状态验证

3. 角色与权限
   - 注册员(REGISTRAR_ROLE)职责
   - 认证员(CERTIFIER_ROLE)工作流程
   - 管理员(ADMIN_ROLE)系统配置
   - 角色申请与分配

4. 技术支持
   - MetaMask钱包连接问题
   - IPFS存储与检索
   - 区块链交易确认
   - 加密资产访问

请直接告诉我您需要什么帮助，我会根据系统功能和最佳实践提供专业解答。`
    });
  }

  async chat(message: string, model: string = 'Qwen/QwQ-32B', onStream?: (text: string) => void): Promise<string> {
    try {
      // 添加用户消息到历史记录
      this.conversationHistory.push({
        role: 'user',
        content: message
      });

      const options = {
        model: model,
        messages: this.conversationHistory,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
        response_format: {
          type: "text"
        }
      };

      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + import.meta.env.VITE_SILICONFLOW_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                fullResponse += content;
                onStream?.(content);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // 添加AI回复到历史记录
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

      return fullResponse;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  }

  // 清除对话历史
  clearHistory() {
    this.conversationHistory = [{
      role: 'assistant',
      content: `您好！我是区块链数字资产管理系统的AI助手，很高兴为您服务。我可以帮助您解决以下方面的问题：

1. 资产管理
   - 数字资产上传与区块链注册
   - 资产查询与管理
   - 资产元数据更新
   - 资产完整性验证

2. 区块链认证
   - 资产认证申请与审核
   - 批量认证操作
   - 认证历史查询
   - 认证状态验证

3. 角色与权限
   - 注册员(REGISTRAR_ROLE)职责
   - 认证员(CERTIFIER_ROLE)工作流程
   - 管理员(ADMIN_ROLE)系统配置
   - 角色申请与分配

4. 技术支持
   - MetaMask钱包连接问题
   - IPFS存储与检索
   - 区块链交易确认
   - 加密资产访问

请直接告诉我您需要什么帮助，我会根据系统功能和最佳实践提供专业解答。`
    }];
  }
}

export const aiService = new AIService(); 
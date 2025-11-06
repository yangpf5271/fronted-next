import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

import { AgnoAgent } from "@ag-ui/agno"
import { NextRequest, NextResponse } from "next/server";

// 1. You can use any service adapter here for multi-agent support. We use
//    the empty adapter since we're only using one agent.
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime instance and utilize the Agno AG-UI
//    integration to setup the connection.
const runtime = new CopilotRuntime({
  agents: {
    // Our FastAPI endpoint URL
    "agno_agent": new AgnoAgent({url: "http://127.0.0.0:8815/agui"}),
  }
});

// 3. Build a Next.js API route that handles the CopilotKit runtime requests.
export const POST = async (req: NextRequest) => {
  // 添加调试日志
  try {
    const body = await req.clone().json();
    console.log('[CopilotRuntime] 接收到请求');
    console.log('[CopilotRuntime] 请求 URL:', req.url);

    // 检查是否包含 agent 信息
    if (body.context?.currentAgentId) {
      console.log('[CopilotRuntime] 检测到 Agent ID:', body.context.currentAgentId);
      console.log('[CopilotRuntime] Mode:', body.context.mode);
    } else {
      console.log('[CopilotRuntime] ⚠️ 未检测到 currentAgentId');
    }
  } catch (error) {
    console.log('[CopilotRuntime] 无法解析请求体:', error);
  }

  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    const response = await handleRequest(req);

    // 检查响应状态，如果是500错误，可能是后端服务不可用
    if (response.status === 500) {
      console.error('[CopilotRuntime] 后端服务可能不可用');
      return new NextResponse(
        JSON.stringify({
          error: 'Service Unavailable',
          message: '后端AI服务暂时不可用，请稍后再试'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return response;
  } catch (error: any) {
    console.error('[CopilotRuntime] 处理请求时发生错误:', error);

    // 根据错误类型返回不同的状态码
    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
      // 网络错误，后端服务不可达
      return new NextResponse(
        JSON.stringify({
          error: 'Service Unavailable',
          message: '后端AI服务暂时不可用，请检查服务连接'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      // 其他错误
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: '处理请求时发生错误'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};
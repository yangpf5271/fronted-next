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
    "agno_agent": new AgnoAgent({url: "http://10.0.0.87:7777/agui"}),
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

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
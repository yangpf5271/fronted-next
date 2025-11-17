import {
    CopilotRuntime,
    ExperimentalEmptyAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

import { AgnoAgent } from "@ag-ui/agno"
import { NextRequest, NextResponse } from "next/server";

// 全局错误处理：完全拦截 AbortError 的 unhandledRejection
// 防止 Next.js 输出大量错误日志
if (typeof process !== 'undefined') {
    // 移除 Next.js 默认的 unhandledRejection 处理器
    process.removeAllListeners('unhandledRejection');

    // 添加我们自己的处理器
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        // 检查是否是 AbortError
        if (reason?.name === 'AbortError' ||
            reason?.code === 20 ||
            (reason?.message && reason.message.includes('aborted'))) {
            // AbortError 是正常的用户操作，完全静默处理
            // 不输出任何内容，避免污染日志
            return;
        }
        // 其他错误仍然记录
        console.error('[Global] Unhandled Rejection:', reason);
        console.error('[Global] Promise:', promise);
    });
}

// 1. You can use any service adapter here for multi-agent support. We use
//    the empty adapter since we're only using one agent.
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. 创建 runtime 的工厂函数，避免状态污染
function createRuntime() {
    return new CopilotRuntime({
        agents: {
            // Our FastAPI endpoint URL
            "agno_agent": new AgnoAgent({ url: "http://localhost:8815/agui" }),
        }
    });
}

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
        // ⚠️ 重要：每次请求都创建新的 runtime 实例
        // 这避免了 AbortController 状态污染问题
        // 当用户点击停止后，旧的 runtime 可能保存了 aborted 的 controller
        // 使用新的 runtime 确保每次请求都有全新的状态
        const runtime = createRuntime();

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
        // 特殊处理：如果是 AbortError，说明客户端主动取消了请求
        // 这是正常行为，不应该记录为错误或返回错误响应
        if (error.name === 'AbortError' || error.code === 20 ||
            (error.message && error.message.includes('aborted'))) {
            console.log('[CopilotRuntime] 请求被客户端中断（正常行为）');
            // 返回一个空的成功响应，避免污染日志
            return new NextResponse(null, { status: 499 }); // 499 = Client Closed Request
        }

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
# 先进行构建
FROM 58.247.122.126:62185/library/node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 先复制 package.json 和 pnpm-lock.yaml，以提高缓存利用率
COPY package*.json pnpm-lock.yaml ./

# 复制源代码
COPY . .

# 构建项目
RUN npm config set registry https://registry.npmmirror.com \
    && npm install -g pnpm@10 \
    && CI=true pnpm install \
    && pnpm run build

# 使用 Node.js 运行时镜像（Next.js 需要 Node.js 运行时）
FROM 58.247.122.126:62185/library/node:20-alpine AS runner

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime \
    && echo "$TZ" > /etc/timezone

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8817
ENV HOSTNAME="0.0.0.0"

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 从构建阶段复制必要文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 设置文件所有者
RUN chown -R nextjs:nodejs /app

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 8817

# 启动应用
CMD ["node", "server.js"]
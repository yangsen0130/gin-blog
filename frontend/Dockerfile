# /Users/yangsen/Code/gin-blog/frontend/Dockerfile

# ---- Base Stage ----
# 使用一个包含 Node.js 的基础镜像。选择一个具体的 LTS 版本。
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies Stage ----
# 单独复制 package.json 和 package-lock.json (如果存在) 来利用 Docker 的层缓存
FROM base AS deps
COPY package.json ./
# 如果你有 package-lock.json, 也复制它
# COPY package-lock.json ./
RUN npm install --frozen-lockfile # 或者 yarn install --frozen-lockfile

# ---- Builder Stage ----
# 构建 Next.js 应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置构建时环境变量 (如果需要，但你的 .env.local 主要用于运行时)
# NEXT_PUBLIC_APP_API_BASE_URL 会在 K8s 中作为运行时环境变量注入
# GO_BACKEND_BASE_URL 也会在 K8s 中作为运行时环境变量注入

RUN npm run build

# ---- Runner Stage ----
# 创建一个最小的生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# 如果你的 Next.js 应用需要特定的端口，可以在这里设置，或者通过 K8s 传入
# ENV PORT=3000

# 从 builder 阶段复制 standalone 输出
# Next.js standalone 输出包含了必要的 node_modules
COPY --from=builder /app/.next/standalone ./
# 复制 public 文件夹和 .next/static 文件夹
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# 启动 Next.js 应用
# server.js 是 standalone 模式下的入口文件
CMD ["node", "server.js"]
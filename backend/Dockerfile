# /Users/yangsen/Code/gin-blog/backend/Dockerfile

# ---- Builder Stage ----
# 使用官方的 Go 镜像作为构建环境
FROM golang:1.22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 go.mod 和 go.sum 文件
COPY go.mod go.sum ./

# 下载依赖项
# 使用 -mod=readonly 确保 go.sum 是最新的
RUN go mod download && go mod verify

# 复制所有后端代码
COPY . .

# 构建 Go 应用
# -ldflags="-w -s" 用于减小二进制文件大小
# CGO_ENABLED=0 用于静态链接，避免依赖 C 库 (对于 Alpine 基础镜像很重要，特别是如果运行时镜像是 scratch)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/main ./main.go

# ---- Runner Stage ----
# 使用一个非常小的基础镜像，如 alpine
FROM alpine:latest

# 安装 ca-certificates 以便 Go 程序可以进行 HTTPS 调用 (如果需要)
# 同时，如果你的应用依赖时区数据 (例如，处理时间)，也需要 tzdata
RUN apk --no-cache add ca-certificates tzdata

# 设置工作目录
WORKDIR /app

# 从 builder 阶段复制编译好的二进制文件
COPY --from=builder /app/main .

# 复制 .env 文件 (在 K8s 中，我们会用 ConfigMap/Secrets 替代)
# 注意：对于生产环境，不建议将 .env 文件直接复制到镜像中。
# 这里为了本地测试方便可以暂时保留，但 K8s 部署时会覆盖这些值。
# COPY .env .

# SQLite 数据库文件将通过 Kubernetes Volume 挂载，所以不需要在这里复制

# 暴露 Go 应用监听的端口 (从 .env 文件或默认值)
EXPOSE 8080

# 运行应用
# CMD ["./main"]
# 为了能让环境变量（如PORT）从K8s传入并生效，我们可以这样启动：
# CMD sh -c "./main"
# 但更标准的做法是让Go程序直接读取环境变量，所以 "./main" 即可
CMD ["./main"]
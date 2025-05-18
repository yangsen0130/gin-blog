import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 重要提示：这允许生产构建成功完成，即使你的项目存在 ESLint 错误。
    // 建议在部署前确保代码质量。
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 重要提示：这将允许生产构建成功完成，即使你的项目存在 TypeScript 类型错误。
    // 强烈建议修复类型错误，而不是忽略它们，因为它们可能导致运行时问题。
    ignoreBuildErrors: true,
  }
};

export default nextConfig;

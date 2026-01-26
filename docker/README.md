### Docker构建

💡 公司Harbor没有SSL，需要在Docker守护进程的配置文件/etc/docker/daemon.json添加以下内容并重启
```json
{
  "insecure-registries": ["58.247.122.126:62185"]
}
```

>构建镜像
>```shell
>docker build -t ep-frontend-next:latest  -o type=docker  -f docker/Dockerfile .
>```

>推送至离线仓库
>
>**注意**: 如果遇到 `unsupported content type for manifest: application/vnd.oci.image.manifest.v1+json` 错误，说明 Harbor 版本较旧不支持 OCI 格式。需要联系管理员升级 Harbor 或启用 OCI 支持。
>
>```shell
>docker login 58.247.122.126:62185 -u share -p Share123
>docker tag ep-frontend-next:latest 58.247.122.126:62185/apex/ep-frontend-next:latest
>docker push 58.247.122.126:62185/apex/ep-frontend-next:latest
>```

>本地测试
>```shell
># 启动容器
>docker run -d --name ep-frontend-next -p 8817:8817 \
>  -e NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 \
>  ep-frontend-next:latest
>
># 查看日志
>docker logs -f ep-frontend-next
>
># 访问应用
>curl http://localhost:8817
>
># 停止容器
>docker stop ep-frontend-next && docker rm ep-frontend-next
>```

>部署更新（在 apex-docker-compose 目录）
>```shell
>cd D:\gitlab\apex-docker-compse
>docker-compose stop ep-frontend-next
>docker-compose rm ep-frontend-next
>docker-compose pull ep-frontend-next
>docker-compose up -d ep-frontend-next
>```

## 镜像信息

- 镜像名称: `ep-frontend-next`
- 镜像大小: ~301MB (压缩后 ~73MB)
- 基础镜像: `node:20-alpine`
- 运行端口: `8817`
- 运行用户: `nextjs` (非 root)

## 环境变量

- `NODE_ENV`: 生产环境 (production)
- `NEXT_PUBLIC_BACKEND_URL`: 后端 API 地址
- `PORT`: 应用端口 (8817)
- `HOSTNAME`: 监听地址 (0.0.0.0)

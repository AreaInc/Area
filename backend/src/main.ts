import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Express } from "express";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: [
      "http://localhost:5173", // Vite default dev port
      "http://localhost:3000", // Alternative dev port
      "http://localhost:8081", // Production frontend port (from docker-compose)
      process.env.FRONTEND_URL || "http://localhost:5173",
      process.env.MOBILE_URL || "area://mobile",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.set("trust proxy", true);

  // Add JSON body parser middleware
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: true }));

  const config = new DocumentBuilder()
    .setTitle("Area API")
    .setDescription("API documentation for Area - n8n-like automation platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  try {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT ?? 0),
        password: process.env.REDIS_PASS,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.log(
            `[Redis Microservice] Retrying connection (attempt ${times})...`,
          );
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      },
    });
  } catch (error) {
    console.error("[Redis Microservice] Failed to connect:", error);
    // Continue without microservice if Redis is unavailable
  }

  await app.listen(process.env.BACKEND_PORT ?? 8080, "0.0.0.0");
}
void bootstrap();

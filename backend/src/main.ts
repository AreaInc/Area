import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Express } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Enable CORS
  app.enableCors({
    origin: [
      "http://localhost:5173", // Vite default dev port
      "http://localhost:3000", // Alternative dev port
      "http://localhost:8081", // Production frontend port (from docker-compose)
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.set("trust proxy", true);

  const config = new DocumentBuilder()
    .setTitle("Area API")
    .setDescription("API documentation for Area - n8n-like automation platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT ?? 0),
      password: process.env.REDIS_PASS,
    },
  });

  await app.listen(process.env.BACKEND_PORT ?? 8080);
}
void bootstrap();

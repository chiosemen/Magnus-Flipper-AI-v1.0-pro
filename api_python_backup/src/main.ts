import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { initSentry } from "./sentry";

async function bootstrap() {
  initSentry();
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3000);
}

bootstrap();

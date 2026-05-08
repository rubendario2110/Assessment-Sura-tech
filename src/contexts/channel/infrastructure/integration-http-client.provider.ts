import type { Provider } from "@nestjs/common";
import { IntegrationHttpClient, createLogger, loadIntegrationConfig } from "@assessment/integration-framework";

export const integrationHttpClientProvider: Provider = {
  provide: IntegrationHttpClient,
  useFactory: (): IntegrationHttpClient => {
    const cfg = loadIntegrationConfig(process.env);
    const logger = createLogger({ serviceName: cfg.serviceName });
    return new IntegrationHttpClient(cfg, logger);
  },
};

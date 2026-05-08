import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { IntegrationHttpClient } from "@assessment/integration-framework";
import {
  GetIntegrationStatusQuery,
  type IntegrationStatusView,
} from "./get-integration-status.query.js";

@QueryHandler(GetIntegrationStatusQuery)
export class GetIntegrationStatusHandler
  implements IQueryHandler<GetIntegrationStatusQuery, IntegrationStatusView>
{
  constructor(private readonly client: IntegrationHttpClient) {}

  async execute(query: GetIntegrationStatusQuery): Promise<IntegrationStatusView> {
    return {
      dependencyId: query.dependencyId,
      breakerState: this.client.getBreakerState(query.dependencyId),
      opossum: this.client.getOpossumSettings(),
    };
  }
}

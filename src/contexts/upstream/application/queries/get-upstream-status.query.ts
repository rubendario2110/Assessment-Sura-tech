import { IQuery } from "@nestjs/cqrs";

export class GetUpstreamStatusQuery implements IQuery {}

export interface UpstreamStatusView {
  status: string;
  service: string;
  failureRate: number;
}

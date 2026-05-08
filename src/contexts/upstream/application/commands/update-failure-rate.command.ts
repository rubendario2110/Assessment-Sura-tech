import { ICommand } from "@nestjs/cqrs";
import type { FailureRate } from "../../domain/value-objects/failure-rate.vo.js";

export class UpdateFailureRateCommand implements ICommand {
  constructor(public readonly rate: FailureRate) {}
}

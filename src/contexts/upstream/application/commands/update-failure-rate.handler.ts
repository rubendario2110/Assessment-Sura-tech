import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateFailureRateCommand } from "./update-failure-rate.command.js";
import { FAILURE_RATE_REPOSITORY } from "../../infrastructure/tokens.js";
import type { FailureRateRepository } from "../../domain/failure-rate-repository.port.js";

@CommandHandler(UpdateFailureRateCommand)
export class UpdateFailureRateHandler implements ICommandHandler<UpdateFailureRateCommand, number> {
  constructor(
    @Inject(FAILURE_RATE_REPOSITORY) private readonly failureRates: FailureRateRepository,
  ) {}

  async execute(command: UpdateFailureRateCommand): Promise<number> {
    this.failureRates.set(command.rate);
    return this.failureRates.current().toNumber();
  }
}

import { Module } from "@nestjs/common";
import { ChannelModule } from "./channel.module.js";

@Module({
  imports: [ChannelModule],
})
export class AppModule {}

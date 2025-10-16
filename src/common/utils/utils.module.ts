import { Module } from "@nestjs/common";
import { UtilsService } from "./utils.service";
import { AwsS3Module } from "../aws-s3/aws-s3.module";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    imports: [AwsS3Module, PrismaModule],
    providers: [UtilsService],
    exports: [UtilsService],
})
export class UtilsModule {}
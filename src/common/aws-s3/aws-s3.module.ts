import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AWSS3Service } from "./aws-s3.service";

@Module({
    imports: [ConfigModule],
    providers: [AWSS3Service],
    exports: [AWSS3Service],
})
export class AwsS3Module {}
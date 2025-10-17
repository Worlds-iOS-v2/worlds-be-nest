import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { AwsS3Module } from 'src/common/aws-s3/aws-s3.module';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [PrismaModule, AwsS3Module, UserModule, UtilsModule],
  providers: [QuestionService],
  controllers: [QuestionController]
})
export class QuestionModule {}

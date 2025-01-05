import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './media.schema/media.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Media.name, schema: MediaSchema}
    ]), 
    UserModule
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService]
})
export class MediaModule {}

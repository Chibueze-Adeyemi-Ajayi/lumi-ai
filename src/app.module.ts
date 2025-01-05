import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './app/user/user.module';
import { ModelModule } from './app/model/model.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { MediaModule } from './app/media/media.module';
import { ChatModule } from './app/chat/chat.module';
import { ChatRagModule } from './app/chat-rag/chat-rag.module';

@Module({
  imports: [

     ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    }),

    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('DB_NAME')
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),

    UserModule, 
    ModelModule, MediaModule, ChatModule, ChatRagModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

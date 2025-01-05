import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema/user.schema';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Profile, ProfileSchema } from './user.schema/profile.schema';
import { JwtAuthGuard } from './user.guards/user.guards';
import { UserJwtStrategy } from './user.guards/user.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: User.name, schema: UserSchema},
      {name: Profile.name, schema: ProfileSchema},
    ]),
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '1000d' },
    }),
  ],
  providers: [UserService, JwtService, UserJwtStrategy, JwtAuthGuard],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}

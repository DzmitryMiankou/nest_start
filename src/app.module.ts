import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './authentication/authentication.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { LoginModule } from './login/login.module';
import { LoginEntity } from './login/entities/login.entity/login.entity';
import { GatewayModule } from './gateway/gateway.module';
import { AuthMiddleware } from './middleware/auth/auth.middleware';
import { AuthenticationModule } from './authentication/authentication.module';
import { SearchUserModule } from './search-user/search-user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>(`HOST_DB`),
        port: +configService.get<number>(`PORT_DB`),
        username: configService.get<string>(`USERNAME_DB`),
        password: configService.get<string>(`PASSWORD_DB`),
        database: configService.get<string>(`DATABASE_DB`),
        entities: [User, LoginEntity],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>(`MAIL_HOST`),
          port: +configService.get<number>(`MAIL_PORT`),
          ignoreTLS: false,
          secure: false,
          auth: {
            user: configService.get<string>(`MAIL_USER`),
            pass: configService.get<string>(`MAIL_PASSWORD`),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>(`MAIL_FROM`)}>`,
        },
        preview: true,
        template: {
          dir: join(__dirname, `views/email`),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    LoginModule,
    GatewayModule,
    AuthenticationModule,
    SearchUserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'app/allUsers/*', method: RequestMethod.GET });
  }
}

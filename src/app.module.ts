import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import databaseConfig from './config/database.config'
import { IndividualsModule } from './individuals/individuals.module'
import { DirectDebitsModule } from './direct-debits/direct-debits.module';

@Module({
  imports: [
    IndividualsModule,
    ConfigModule.forRoot({
      isGlobal: true, // Para no tener que importar ConfigModule en todos los módulos
      load: [databaseConfig] // Carga tu archivo con `registerAs`
    }),
    DirectDebitsModule
  ]
})
export class AppModule {}

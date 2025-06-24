import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import databaseConfig from './config/database.config'
import { IndividualsModule } from './individuals/individuals.module'

@Module({
  imports: [
    IndividualsModule,
    ConfigModule.forRoot({
      isGlobal: true, // Para no tener que importar ConfigModule en todos los módulos
      load: [databaseConfig] // Carga tu archivo con `registerAs`
    })
  ]
})
export class AppModule {}

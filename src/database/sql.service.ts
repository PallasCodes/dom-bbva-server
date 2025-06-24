import {
  Injectable,
  OnModuleDestroy,
  Logger,
  InternalServerErrorException,
  Inject
} from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import * as sql from 'mssql'
import databaseConfig from 'src/config/database.config'

@Injectable()
export class SqlService implements OnModuleDestroy {
  private pool: sql.ConnectionPool
  private readonly logger = new Logger(SqlService.name)

  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>
  ) {}

  async connect(): Promise<void> {
    if (this.pool) return

    try {
      this.pool = await sql.connect(this.dbConfig)
      this.logger.log('✅ Conectado a SQL Server')
    } catch (error) {
      this.logger.error('❌ Error al conectar a SQL Server', error)
      throw new InternalServerErrorException('No se pudo conectar a la base de datos')
    }
  }

  async query<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
    try {
      await this.connect()
      const request = this.pool.request()

      if (params) {
        for (const key in params) {
          request.input(key, params[key])
        }
      }

      const result = await request.query<T>(query)
      return result.recordset
    } catch (error) {
      this.logger.error('❌ Error al ejecutar query SQL', {
        query,
        params,
        error: error.message
      })
      throw new InternalServerErrorException(
        'Ocurrió un error al consultar la base de datos'
      )
    }
  }

  async onModuleDestroy() {
    try {
      if (this.pool) {
        await this.pool.close()
        this.logger.log('🔌 Conexión a SQL Server cerrada')
      }
    } catch (error) {
      this.logger.warn('⚠️ Error al cerrar la conexión a SQL Server', error)
    }
  }
}

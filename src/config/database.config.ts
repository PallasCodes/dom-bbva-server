import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: process.env.ENV === 'prod',
    requestTimeout: 120000, // tiempo en milisegundos (ej. 60s)
    connectionTimeout: 30000 // tiempo de espera para la conexión
  }
}))

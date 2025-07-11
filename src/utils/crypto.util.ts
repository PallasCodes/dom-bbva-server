import { publicEncrypt, privateDecrypt, createSign, createVerify } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

const KEY_PATH = join(__dirname, '..', '..', 'keys')

function getPublicKey(): string {
  return readFileSync(join(KEY_PATH, 'public_key.pem'), 'utf8')
}

function getPrivateKey(): string {
  return readFileSync(join(KEY_PATH, 'private_key.pem'), 'utf8')
}

/**
 * Cifra un texto usando la llave pública RSA
 */
export function encrypt(plainText: string): string {
  const publicKey = getPublicKey()
  const buffer = Buffer.from(plainText, 'utf8')
  const encrypted = publicEncrypt(publicKey, buffer)
  return encrypted.toString('base64')
}

/**
 * Descifra un texto cifrado usando la llave privada RSA
 */
export function decrypt(cipherText: string): string {
  const privateKey = getPrivateKey()
  const buffer = Buffer.from(cipherText, 'base64')
  const decrypted = privateDecrypt(privateKey, buffer)
  return decrypted.toString('utf8')
}

/**
 * Firma un mensaje con la llave privada usando SHA256+RSA
 */
export function sign(message: string): string {
  const privateKey = getPrivateKey()
  const signer = createSign('RSA-SHA256')
  signer.update(message)
  signer.end()
  const signature = signer.sign(privateKey)
  return signature.toString('base64')
}

/**
 * Verifica la firma de un mensaje con la llave pública
 */
export function verify(message: string, signature: string): boolean {
  const publicKey = getPublicKey()
  const verifier = createVerify('RSA-SHA256')
  verifier.update(message)
  verifier.end()
  return verifier.verify(publicKey, Buffer.from(signature, 'base64'))
}

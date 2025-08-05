export const generateCut = (): string => {
  if (process.env.ENV === 'dev') return '1505'

  const cut = Math.floor(Math.random() * 9000) + 1000
  return cut.toString()
}

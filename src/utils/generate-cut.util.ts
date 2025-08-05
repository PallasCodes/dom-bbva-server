export const generateCut = (): string => {
  const cut = Math.floor(Math.random() * 9000) + 1000
  return cut.toString()
}

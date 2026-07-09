const wordPattern = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;

export function countWords(text: string) {
  const matches = text.trim().match(wordPattern);

  return matches ? matches.length : 0;
}

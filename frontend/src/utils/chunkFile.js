export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export function createChunks(file) {
  const chunks = [];

  let index = 0;
  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    chunks.push({
      index,
      start,
      end: Math.min(start + CHUNK_SIZE, file.size),
      status: "PENDING"
    });
    index++;
  }

  return chunks;
}

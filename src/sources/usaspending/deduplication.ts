export class AwardDeduplicator {
  private readonly keys = new Set<string>();

  checkAndAdd(key: string): { key: string; isDuplicate: boolean } {
    const isDuplicate = this.keys.has(key);
    if (!isDuplicate) this.keys.add(key);
    return { key, isDuplicate };
  }

  get size(): number { return this.keys.size; }
}

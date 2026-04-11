export class UploadError extends Error {
  rollbackKeys: string[];

  constructor(message: string, rollbackKeys: string[]) {
    super(message);
    this.name = "UploadError";
    this.rollbackKeys = rollbackKeys;
  }
}

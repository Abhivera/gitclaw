export type PrFile = {
  filePath: string;
  patch: string;
};

export type CodeChunk = {
  /** Unique id per chunk, e.g. `pr-42--src/foo.ts--part-0` */
  id: string;
  /** Source file path this chunk came from */
  filePath: string;
  /** Raw diff/context text sent to the review model */
  text: string;
};

export type Source = {
  fetch(offset: number, length: number): Promise<ArrayBuffer>;
};

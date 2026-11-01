import { BASE } from './base';
import { PART_A } from './part-a';
import { PART_B } from './part-b';
import { PART_C } from './part-c';
export { DEFS, buildCover } from './shared';
export const COVERS = { ...BASE, ...PART_A, ...PART_B, ...PART_C };

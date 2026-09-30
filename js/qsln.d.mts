export declare function stringify(lists: Iterable<Iterable<string>>): string;
export declare function parse(qsln: string): string[][];
declare const QSLN: { stringify: typeof stringify, parse: typeof parse };
export default QSLN;

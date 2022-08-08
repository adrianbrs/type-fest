/**
 * Adds a `.` at the start of the given `Path` if it's not empty and the `ChildType` is not an array.
 */
type DotPrefix<ChildType, Path extends string> =
	| (Path extends ""
			? ""
			: ChildType extends readonly any[]
			? Path
			: `.${Path}`)
	| "";

/**
 * Returns the given `Depth` decremented by 1 until it reaches 0.
 *
 * Used 20 as maximum reasonable depth, the same depth used in `FlatArray` type of `es2019.array.d.ts`
 *
 * @example
 * ```
 * PrevDepth<1> //=> 0
 * PrevDepth<0> //=> never
 * PrevDepth<22> //=> never
 * ```
 */
type PrevDepth<Depth extends number> = Extract<
  [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][Depth],
  number
>;

/**
 * Extract union of valid index numbers from a tuple, or return `number` if no valid indices are found.
 *
 * @link https://github.com/microsoft/TypeScript/issues/32917#issuecomment-850998508
 */
type Indices<BaseType extends readonly any[]> = Extract<
	Exclude<Partial<BaseType>["length"], BaseType["length"]> &
		number extends infer N
		? [N] extends [never]
			? number
			: N
		: never,
	number
>;

/**
 * Escapes a object key if it contains one of the following characters: `.`, `[` or `]`
 */
type EscapeObjectKey<Key> = Key extends `${string}${"[" | "]" | "."}${string}`
	? `["${Key}"]`
	: Key;

// This works by extracting the keys of an object, or the indices of an array as a string, and recursively adding a `.` before a nested key,
// or enclosing the index in square brackets in the case of arrays. In the case of object keys, if it contains a `.`, `[` or `]` it is escaped
// by enclosing it with `["..."]`. To limit the recursion of types, especially in cases of types that refer to themselves, a depth number is
// kept that is decremented with each recursion, and when it reaches 0, `never` is returned to stop the recursion.
/**
Get deeply-nested keys from an object to use as a key path, like Lodash's `.get()` function input.

Use-cases:
- Type safe a function parameter to allow only valid key paths for any complex object.
- Autocomplete keypaths for complex objects.

@example
```
import type { KeyofDeep, Get } from 'type-fest';
import * as lodash from 'lodash';

const get = <BaseType, Path extends KeyofDeep<BaseType>>(object: BaseType, path: Path): Get<BaseType, Path> =>
  lodash.get(object, path);

interface ApiResponse {
  hits: {
    hits: Array<{
      _id: string
      _source: {
        name: Array<{
          given: string[]
          family: string
        }>
        birthDate: string
      }
    }>
  }
}

const getName = (apiResponse: ApiResponse) =>
  get(apiResponse, 'hits.hits[0]._source.name');
  //=> Array<{given: string[]; family: string}>

// Type error with invalid key path
const getInvalidKeyPath = (apiResponse: ApiResponse) =>
  get(apiResponse, 'hits.hits[0].name');
  //=> Argument of type '"hits.hits[0].name"' is not assignable to parameter of type '"hits" | ... | `hits.hits[${number}]._source.name`'

// Custom depth limit:
KeyofDeep<ApiResponse, 0> //=> 'hits'
KeyofDeep<ApiResponse, 1> //=> 'hits' | 'hits.hits'

// Tuples and autocomplete:
interface ColorResponse {
  rgb: [number, number, number];
  hex: string;
}

KeyofDeep<ColorResponse> //=> "rgb" | "hex" | "rgb[0]" | "rgb[1]" | "rgb[2]"
```

@category Object
@category Array
@category Template literal
*/
export type KeyofDeep<BaseType, Depth extends number = 10> = (
	[Depth] extends [never]
		? never
		: BaseType extends readonly any[]
		? {
				[Index in Indices<BaseType>]: `[${Index}]${DotPrefix<
					BaseType[Index],
					KeyofDeep<BaseType[Index], PrevDepth<Depth>>
				>}`;
		  }[Indices<BaseType>]
		: BaseType extends Record<any, any>
		? {
				[Key in Exclude<
					keyof BaseType,
					symbol
				>]: `${EscapeObjectKey<Key>}${DotPrefix<
					BaseType[Key],
					KeyofDeep<BaseType[Key], PrevDepth<Depth>>
				>}`;
		  }[Exclude<keyof BaseType, symbol>]
		: never
) extends infer D
	? Extract<D, string>
	: never;

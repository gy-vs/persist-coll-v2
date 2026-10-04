import { expect, test } from 'tstyche';
import { fromJS, Collection, List, Map, MapOf, Set } from 'immutable';

test('fromJS', () => {
  expect(fromJS({}, (a: any, b: any) => b)).type.toBe<
    Collection<unknown, unknown>
  >();

  expect(fromJS('abc')).type.toBeString();

  expect(fromJS([0, 1, 2])).type.toBe<List<number>>();

  expect(fromJS(List([0, 1, 2]))).type.toBe<List<number>>();

  expect(fromJS({ a: 0, b: 1, c: 2 })).type.toBe<
    Map<'b' | 'a' | 'c', number>
  >();

  expect(fromJS(Map({ a: 0, b: 1, c: 2 }))).type.toBe<
    MapOf<{ a: number; b: number; c: number }>
  >();

  expect(fromJS([{ a: 0 }])).type.toBe<List<Map<'a', number>>>();

  expect(fromJS({ a: [0] })).type.toBe<Map<'a', List<number>>>();

  expect(fromJS([[[0]]])).type.toBe<List<List<List<number>>>>();

  expect(fromJS({ a: { b: { c: 0 } } })).type.toBe<
    Map<'a', Map<'b', Map<'c', number>>>
  >();
});

test('fromJS in an array of function', () => {
  const create = [(data: any) => data, fromJS][1];

  expect(create({ a: 'A' })).type.toBeAny();

  const createConst = ([(data: any) => data, fromJS] as const)[1];

  expect(createConst({ a: 'A' })).type.toBe<Map<'a', string>>();
});

test('fromJS leaves primitive values as-is', () => {
  expect(fromJS(1)).type.toBe<number>();
  expect(fromJS(true)).type.toBe<boolean>();
  expect(fromJS(false)).type.toBe<boolean>();
  expect(fromJS(null)).type.toBeNull();
  expect(fromJS(undefined)).type.toBeUndefined();
});

test('fromJS leaves Date as-is', () => {
  expect(fromJS(new Date())).type.toBe<Date>();
});

test('fromJS converts a native Map to an Immutable Map preserving entries', () => {
  const m = fromJS(
    new globalThis.Map<string, { x: number }>([['a', { x: 1 }]])
  );
  expect(m).type.toBe<Map<string, { x: number }>>();
  expect(m.get('a')).type.toBe<{ x: number } | undefined>();
  expect(m.has('a')).type.toBeBoolean();
});

test('fromJS converts a native Set to an Immutable Set preserving values', () => {
  const s = fromJS(new globalThis.Set<number>([1, 2, 3]));
  expect(s).type.toBe<Set<number>>();
  expect(s.has(1)).type.toBeBoolean();
  expect(s.toArray()).type.toBe<number[]>();
});

test('fromJS nested native collections and pass-through fields', () => {
  const o = fromJS({
    set: new globalThis.Set<number>([1]),
    map: new globalThis.Map<string, number>([['k', 1]]),
    flag: true,
    when: new Date(),
  });
  // Plain objects convert to Map<K, V> with the union of converted field
  // types as V; the important part is that none of them collapse into a
  // method-name keyed Map anymore.
  expect(o).type.toBe<
    Map<
      'set' | 'map' | 'flag' | 'when',
      Set<number> | Map<string, number> | boolean | Date
    >
  >();
  const v = o.get('set');
  expect(v).type.toBe<
    Set<number> | Map<string, number> | boolean | Date | undefined
  >();
});

test('fromJS with native collections inside arrays', () => {
  const l = fromJS([
    new globalThis.Set<number>([1]),
    new globalThis.Map<string, boolean>([['k', true]]),
  ]);
  expect(l).type.toBe<List<Set<number> | Map<string, boolean>>>();
});

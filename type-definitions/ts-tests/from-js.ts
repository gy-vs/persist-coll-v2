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

test('fromJS with native JS types', () => {
  expect(fromJS(new globalThis.Map([['a', { x: 1 }]]))).type.toBe<
    Map<string, Map<'x', number>>
  >();

  expect(fromJS(new globalThis.Set([1, 2]))).type.toBe<Set<number>>();

  expect(fromJS(true)).type.toBe<boolean>();

  expect(fromJS(new Date())).type.toBe<Date>();

  expect(
    fromJS({ tags: new globalThis.Set(['x']), flag: true, when: new Date() })
  ).type.toBe<Map<'tags' | 'flag' | 'when', Set<string> | boolean | Date>>();
});

test('fromJS in an array of function', () => {
  const create = [(data: any) => data, fromJS][1];

  expect(create({ a: 'A' })).type.toBeAny();

  const createConst = ([(data: any) => data, fromJS] as const)[1];

  expect(createConst({ a: 'A' })).type.toBe<Map<'a', string>>();
});

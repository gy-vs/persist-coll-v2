import { runInNewContext } from 'vm';

import { List, Map, Set, isCollection, isKeyed, fromJS } from 'immutable';

describe('fromJS', () => {
  it('convert Array to Immutable.List', () => {
    const list = fromJS([1, 2, 3]);
    expect(List.isList(list)).toBe(true);
    expect(list.count()).toBe(3);
  });

  it('convert plain Object to Immutable.Map', () => {
    const map = fromJS({ a: 'A', b: 'B', c: 'C' });
    expect(Map.isMap(map)).toBe(true);
    expect(map.count()).toBe(3);
  });

  it('convert JS (global) Set to Immutable.Set', () => {
    const set = fromJS(new global.Set([1, 2, 3]));
    expect(Set.isSet(set)).toBe(true);
    expect(set.count()).toBe(3);
  });

  it('convert JS (global) Map to Immutable.Map', () => {
    const map = fromJS(
      new global.Map([
        ['a', 'A'],
        ['b', 'B'],
        ['c', 'C'],
      ])
    );
    expect(Map.isMap(map)).toBe(true);
    expect(map.count()).toBe(3);
  });

  it('convert iterable to Immutable collection', () => {
    function* values() {
      yield 1;
      yield 2;
      yield 3;
    }
    const result = fromJS(values());
    expect(List.isList(result)).toBe(true);
    expect(result.count()).toBe(3);
  });

  it('does not convert existing Immutable collections', () => {
    const orderedSet = Set(['a', 'b', 'c']);
    expect(fromJS(orderedSet)).toBe(orderedSet);
  });

  it('does not convert strings', () => {
    expect(fromJS('abc')).toBe('abc');
  });

  it('does not convert non-plain Objects', () => {
    class Test {}
    const result = fromJS(new Test());
    expect(isCollection(result)).toBe(false);
    expect(result instanceof Test).toBe(true);
  });

  it('provides the full key path to the reviver, including empty string keys', () => {
    const paths: Array<Array<string | number> | undefined> = [];
    fromJS(
      { x: { '': { deep: { v: 1 } }, after: { w: 2 } }, y: { z: 3 } },
      (key, value, path) => {
        paths.push(path);
        return isKeyed(value) ? value.toMap() : value.toList();
      }
    );
    expect(paths).toEqual([
      [],
      ['x'],
      ['x', ''],
      ['x', '', 'deep'],
      ['x', 'after'],
      ['y'],
    ]);
  });

  it('provides the full key path to the reviver when sequences are converted lazily', () => {
    const paths: Array<Array<string | number> | undefined> = [];
    const result = fromJS({ a: { b: { c: 1 } } }, (key, value, path) => {
      paths.push(path);
      return value;
    });
    result.toJS();
    expect(paths).toEqual([[], ['a'], ['a', 'b']]);
  });

  it('is iterable outside of a vm', () => {
    expect(isCollection(fromJS({}))).toBe(true);
  });

  it('is iterable inside of a vm', () => {
    runInNewContext(
      `
    expect(isCollection(fromJS({}))).toBe(true);
  `,
      {
        expect,
        isCollection,
        fromJS,
      },
      {}
    );
  });
});

import { runInNewContext } from 'vm';

import { List, Map, Set, isCollection, fromJS } from 'immutable';

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

  it('provides the full key path to the reviver, including empty string keys', () => {
    const paths: Array<Array<string | number>> = [];
    fromJS(
      {
        x: { '': { deep: { v: 1 } }, after: { w: 2 } },
        y: { z: 3 },
      },
      (key, sequence, path) => {
        paths.push(path!);
        return sequence.toMap();
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

  it('keeps empty string keys in paths alongside array indices', () => {
    const paths: Array<Array<string | number>> = [];
    fromJS({ '': [{ '': 1 }], list: [{ '': 2 }] }, (key, sequence, path) => {
      paths.push(path!);
      return sequence.toMap();
    });
    expect(paths).toEqual([[], [''], ['', 0], ['list'], ['list', 0]]);
  });

  it('provides the full key path when revivers defer sequence evaluation', () => {
    const paths: Array<Array<string | number>> = [];
    const result = fromJS({ a: { b: { c: 1 } } }, (key, sequence, path) => {
      paths.push(path!);
      // Do not materialize the sequence now; it is evaluated later via toJS.
      return sequence;
    });
    // Force the lazy mapping to evaluate after fromJS fully unwound.
    result.toJS();
    expect(paths).toEqual([[], ['a'], ['a', 'b']]);
  });

  it('reports correct paths when deferred evaluation happens asynchronously', done => {
    const paths: Array<Array<string | number>> = [];
    const result = fromJS({ a: { b: [{ c: 1 }] } }, (key, sequence, path) => {
      paths.push(path!);
      return sequence;
    });
    setImmediate(() => {
      result.toJS();
      expect(paths).toEqual([[], ['a'], ['a', 'b'], ['a', 'b', 0]]);
      done();
    });
  });

  it('passes independent path snapshots to each reviver call', () => {
    const paths: Array<Array<string | number>> = [];
    fromJS({ a: { b: { c: 1 } } }, (key, sequence, path) => {
      paths.push(path!);
      return sequence.toMap();
    });
    expect(paths[0]).toEqual([]);
    expect(paths[1]).toEqual(['a']);
    expect(paths[2]).toEqual(['a', 'b']);
    expect(paths[0]).not.toBe(paths[1]);
    expect(paths[1]).not.toBe(paths[2]);
  });
});

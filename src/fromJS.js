import { Seq } from './Seq';
import { hasIterator } from './Iterator';
import { isImmutable } from './predicates/isImmutable';
import { isIndexed } from './predicates/isIndexed';
import { isKeyed } from './predicates/isKeyed';
import isArrayLike from './utils/isArrayLike';
import isPlainObj from './utils/isPlainObj';

export function fromJS(value, converter) {
  // The root frame has no real parent, but the reviver receives the parent
  // value as `this` and looks up its own key ("") on it, so seed a sentinel
  // parent with the starting value. The same sentinel also marks the root
  // frame while building key paths, and is local per call so nested fromJS
  // invocations (for example from inside a reviver) cannot interfere.
  const rootParent = { '': value };
  return fromJSWith(
    [],
    converter || defaultConverter,
    value,
    '',
    converter && converter.length > 2 ? [] : undefined,
    rootParent,
    true
  );
}

function fromJSWith(
  stack,
  converter,
  value,
  key,
  keyPath,
  parentValue,
  isRoot
) {
  if (
    typeof value !== 'string' &&
    !isImmutable(value) &&
    (isArrayLike(value) || hasIterator(value) || isPlainObj(value))
  ) {
    if (~stack.indexOf(value)) {
      throw new TypeError('Cannot convert circular structure to Immutable');
    }
    stack.push(value);
    // Give every node its own key path snapshot. The Seq#map below is evaluated
    // lazily (possibly long after this frame returned), so a single shared
    // path array mutated with push/pop would report whichever frame happened
    // to be current when a nested node was finally iterated. Building a fresh
    // array per node also keeps falsy keys such as the empty string as a real
    // part of the path instead of being skipped.
    const nodeKeyPath = keyPath && (isRoot ? keyPath : keyPath.concat(key));
    const converted = converter.call(
      parentValue,
      key,
      Seq(value).map((v, k) =>
        fromJSWith(stack, converter, v, k, nodeKeyPath, value, false)
      ),
      nodeKeyPath && nodeKeyPath.slice()
    );
    stack.pop();
    return converted;
  }
  return value;
}

function defaultConverter(k, v) {
  // Effectively the opposite of "Collection.toSeq()"
  return isIndexed(v) ? v.toList() : isKeyed(v) ? v.toMap() : v.toSet();
}

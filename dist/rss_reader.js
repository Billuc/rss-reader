// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array4, tail) {
    let t = tail || new Empty();
    for (let i = array4.length - 1; i >= 0; --i) {
      t = new NonEmpty(array4[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length5 = 0;
    while (current) {
      current = current.tail;
      length5++;
    }
    return length5 - 1;
  }
};
function prepend(element4, tail) {
  return new NonEmpty(element4, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head: head2, tail } = this.#current;
      this.#current = tail;
      return { value: head2, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head2, tail) {
    super();
    this.head = head2;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index5) {
    if (index5 < 0 || index5 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index5);
  }
  /** @internal */
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a2 = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a2 !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a2 = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a2 >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index5) {
  if (bitOffset === 0) {
    return buffer[index5] ?? 0;
  } else {
    const a2 = buffer[index5] << bitOffset & 255;
    const b = buffer[index5 + 1] >> 8 - bitOffset;
    return a2 | b;
  }
}
var UtfCodepoint = class {
  constructor(value2) {
    this.value = value2;
  }
};
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name2, message) {
  if (isBitArrayDeprecationMessagePrinted[name2]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name2} property used in JavaScript FFI code. ${message}.`
  );
  isBitArrayDeprecationMessagePrinted[name2] = true;
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value2) {
    super();
    this[0] = value2;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a2 = values2.pop();
    let b = values2.pop();
    if (a2 === b)
      continue;
    if (!isObject(a2) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get4] = getters(a2);
    for (let k of keys2(a2)) {
      values2.push(get4(a2, k), get4(b, k));
    }
  }
  return true;
}
function getters(object4) {
  if (object4 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object4 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return !(a2 instanceof BitArray) && a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c))
    return false;
  return a2.constructor === b.constructor;
}
function makeError(variant, file, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a2 = option[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}
function from_result(result) {
  if (result instanceof Ok) {
    let a2 = result[0];
    return new Some(a2);
  } else {
    return new None();
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}
function map(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return new Some(fun(x));
  } else {
    return new None();
  }
}
function then$(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return fun(x);
  } else {
    return new None();
  }
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root2, shift, hash, key, val, addedLeaf) {
  switch (root2.type) {
    case ARRAY_NODE:
      return assocArray(root2, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root2, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root2, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root2, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root2.size + 1,
      array: cloneAndSet(root2.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root2;
      }
      return {
        type: ARRAY_NODE,
        size: root2.size,
        array: cloneAndSet(root2.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root2.size,
      array: cloneAndSet(
        root2.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root2;
  }
  return {
    type: ARRAY_NODE,
    size: root2.size,
    array: cloneAndSet(root2.array, idx, n)
  };
}
function assocIndex(root2, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root2.bitmap, bit);
  if ((root2.bitmap & bit) !== 0) {
    const node = root2.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root2;
      }
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root2;
      }
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap,
      array: cloneAndSet(
        root2.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root2.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root2.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root2.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root2.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root2, shift, hash, key, val, addedLeaf) {
  if (hash === root2.hash) {
    const idx = collisionIndexOf(root2, key);
    if (idx !== -1) {
      const entry = root2.array[idx];
      if (entry.v === val) {
        return root2;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root2.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size3 = root2.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root2.array, size3, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root2.hash, shift),
      array: [root2]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root2, key) {
  const size3 = root2.array.length;
  for (let i = 0; i < size3; i++) {
    if (isEqual(key, root2.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root2, shift, hash, key) {
  switch (root2.type) {
    case ARRAY_NODE:
      return findArray(root2, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root2, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root2, key);
  }
}
function findArray(root2, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root2, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root2.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root2.bitmap, bit);
  const node = root2.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root2, key) {
  const idx = collisionIndexOf(root2, key);
  if (idx < 0) {
    return void 0;
  }
  return root2.array[idx];
}
function without(root2, shift, hash, key) {
  switch (root2.type) {
    case ARRAY_NODE:
      return withoutArray(root2, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root2, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root2, key);
  }
}
function withoutArray(root2, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    return root2;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root2;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root2;
    }
  }
  if (n === void 0) {
    if (root2.size <= MIN_ARRAY_NODE) {
      const arr = root2.array;
      const out = new Array(root2.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root2.size - 1,
      array: cloneAndSet(root2.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root2.size,
    array: cloneAndSet(root2.array, idx, n)
  };
}
function withoutIndex(root2, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root2.bitmap & bit) === 0) {
    return root2;
  }
  const idx = index(root2.bitmap, bit);
  const node = root2.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root2;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, n)
      };
    }
    if (root2.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap ^ bit,
      array: spliceOut(root2.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root2.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap ^ bit,
      array: spliceOut(root2.array, idx)
    };
  }
  return root2;
}
function withoutCollision(root2, key) {
  const idx = collisionIndexOf(root2, key);
  if (idx < 0) {
    return root2;
  }
  if (root2.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root2.hash,
    array: spliceOut(root2.array, idx)
  };
}
function forEach(root2, fn) {
  if (root2 === void 0) {
    return;
  }
  const items = root2.array;
  const size3 = items.length;
  for (let i = 0; i < size3; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root2, size3) {
    this.root = root2;
    this.size = size3;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root2 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root2, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = /* @__PURE__ */ Symbol();

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function base_parse(string5, base) {
  let $ = base >= 2 && base <= 36;
  if ($) {
    return int_from_base_string(string5, base);
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string_tree.mjs
function new$() {
  return concat(toList([]));
}
function append(tree, second) {
  return add(tree, identity(second));
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function replace(string5, pattern, substitute) {
  let _pipe = string5;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}
function append2(first, second) {
  return first + second;
}
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string5;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function join_loop(loop$strings, loop$separator, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let separator = loop$separator;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$separator = separator;
      loop$accumulator = accumulator + separator + string5;
    }
  }
}
function join(strings, separator) {
  if (strings instanceof Empty) {
    return "";
  } else {
    let first$1 = strings.head;
    let rest = strings.tail;
    return join_loop(rest, separator, first$1);
  }
}
function trim(string5) {
  let _pipe = string5;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string5 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if ($) {
      let $1 = pop_grapheme(string5);
      if ($1 instanceof Ok) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string5;
      }
    } else {
      return string5;
    }
  }
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map2(_pipe$2, identity);
  }
}
function utf_codepoint(value2) {
  let i = value2;
  if (i > 1114111) {
    return new Error(void 0);
  } else {
    let i$1 = value2;
    if (i$1 >= 55296 && i$1 <= 57343) {
      return new Error(void 0);
    } else {
      let i$2 = value2;
      if (i$2 < 0) {
        return new Error(void 0);
      } else {
        let i$3 = value2;
        return new Ok(codepoint(i$3));
      }
    }
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return identity(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function map3(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function decode_error(expected, found) {
  return toList([
    new DecodeError(expected, classify_dynamic(found), toList([]))
  ]);
}
function run_dynamic_function(data, name2, f) {
  let $ = f(data);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError(name2, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_bool(data) {
  let $ = isEqual(identity(true), data);
  if ($) {
    return [true, toList([])];
  } else {
    let $1 = isEqual(identity(false), data);
    if ($1) {
      return [false, toList([])];
    } else {
      return [false, decode_error("Bool", data)];
    }
  }
}
function decode_int(data) {
  return run_dynamic_function(data, "Int", int);
}
var bool = /* @__PURE__ */ new Decoder(decode_bool);
var int2 = /* @__PURE__ */ new Decoder(decode_int);
function decode_string(data) {
  return run_dynamic_function(data, "String", string);
}
var string2 = /* @__PURE__ */ new Decoder(decode_string);
function fold_dict(acc, key, value2, key_decoder, value_decoder) {
  let $ = key_decoder(key);
  let $1 = $[1];
  if ($1 instanceof Empty) {
    let key$1 = $[0];
    let $2 = value_decoder(value2);
    let $3 = $2[1];
    if ($3 instanceof Empty) {
      let value$1 = $2[0];
      let dict$1 = insert(acc[0], key$1, value$1);
      return [dict$1, acc[1]];
    } else {
      let errors = $3;
      return push_path([new_map(), errors], toList(["values"]));
    }
  } else {
    let errors = $1;
    return push_path([new_map(), errors], toList(["keys"]));
  }
}
function dict2(key, value2) {
  return new Decoder(
    (data) => {
      let $ = dict(data);
      if ($ instanceof Ok) {
        let dict$1 = $[0];
        return fold(
          dict$1,
          [new_map(), toList([])],
          (a2, k, v) => {
            let $1 = a2[1];
            if ($1 instanceof Empty) {
              return fold_dict(a2, k, v, key.function, value2.function);
            } else {
              return a2;
            }
          }
        );
      } else {
        return [new_map(), decode_error("Dict", data)];
      }
    }
  );
}
function list2(inner) {
  return new Decoder(
    (data) => {
      return list(
        data,
        inner.function,
        (p2, k) => {
          return push_path(p2, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path(layer, path) {
  let decoder = one_of(
    string2,
    toList([
      (() => {
        let _pipe = int2;
        return map3(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map2(
    path,
    (key) => {
      let key$1 = identity(key);
      let $ = run(key$1, decoder);
      if ($ instanceof Ok) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map2(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError(
        _record.expected,
        _record.found,
        append3(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path instanceof Empty) {
      let _pipe = inner(data);
      return push_path(_pipe, reverse(position));
    } else {
      let key = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data, prepend(key, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next2) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next2(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append3(errors1, errors2)];
    }
  );
}
function field(field_name, field_decoder, next2) {
  return subfield(toList([field_name]), field_decoder, next2);
}
function optional_field(key, default$, field_decoder, next2) {
  return new Decoder(
    (data) => {
      let _block;
      let _block$1;
      let $1 = index2(data, key);
      if ($1 instanceof Ok) {
        let $22 = $1[0];
        if ($22 instanceof Some) {
          let data$1 = $22[0];
          _block$1 = field_decoder.function(data$1);
        } else {
          _block$1 = [default$, toList([])];
        }
      } else {
        let kind = $1[0];
        _block$1 = [
          default$,
          toList([new DecodeError(kind, classify_dynamic(data), toList([]))])
        ];
      }
      let _pipe = _block$1;
      _block = push_path(_pipe, toList([key]));
      let $ = _block;
      let out = $[0];
      let errors1 = $[1];
      let $2 = next2(out).function(data);
      let out$1 = $2[0];
      let errors2 = $2[1];
      return [out$1, append3(errors1, errors2)];
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value2) {
  if (/^[-+]?(\d+)$/.test(value2)) {
    return new Ok(parseInt(value2));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
var int_base_patterns = {
  2: /[^0-1]/,
  3: /[^0-2]/,
  4: /[^0-3]/,
  5: /[^0-4]/,
  6: /[^0-5]/,
  7: /[^0-6]/,
  8: /[^0-7]/,
  9: /[^0-8]/,
  10: /[^0-9]/,
  11: /[^0-9a]/,
  12: /[^0-9a-b]/,
  13: /[^0-9a-c]/,
  14: /[^0-9a-d]/,
  15: /[^0-9a-e]/,
  16: /[^0-9a-f]/,
  17: /[^0-9a-g]/,
  18: /[^0-9a-h]/,
  19: /[^0-9a-i]/,
  20: /[^0-9a-j]/,
  21: /[^0-9a-k]/,
  22: /[^0-9a-l]/,
  23: /[^0-9a-m]/,
  24: /[^0-9a-n]/,
  25: /[^0-9a-o]/,
  26: /[^0-9a-p]/,
  27: /[^0-9a-q]/,
  28: /[^0-9a-r]/,
  29: /[^0-9a-s]/,
  30: /[^0-9a-t]/,
  31: /[^0-9a-u]/,
  32: /[^0-9a-v]/,
  33: /[^0-9a-w]/,
  34: /[^0-9a-x]/,
  35: /[^0-9a-y]/,
  36: /[^0-9a-z]/
};
function int_from_base_string(string5, base) {
  if (int_base_patterns[base].test(string5.replace(/^-/, "").toLowerCase())) {
    return new Error(Nil);
  }
  const result = parseInt(string5, base);
  if (isNaN(result)) {
    return new Error(Nil);
  }
  return new Ok(result);
}
function string_replace(string5, target, substitute) {
  return string5.replaceAll(target, substitute);
}
function string_length(string5) {
  if (string5 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string5.match(/./gsu).length;
  }
}
function graphemes(string5) {
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string5.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string5) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string5)[Symbol.iterator]();
  }
}
function pop_grapheme(string5) {
  let first;
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    first = iterator.next().value?.segment;
  } else {
    first = string5.match(/./su)?.[0];
  }
  if (first) {
    return new Ok([first, string5.slice(first.length)]);
  } else {
    return new Error(Nil);
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string5) {
  return string5.toLowerCase();
}
function add(a2, b) {
  return a2 + b;
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function string_codeunit_slice(str, from, length5) {
  return str.slice(from, from + length5);
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function trim_start(string5) {
  return string5.replace(trim_start_regex, "");
}
function trim_end(string5) {
  return string5.replace(trim_end_regex, "");
}
function codepoint(int5) {
  return new UtfCodepoint(int5);
}
function utf_codepoint_list_to_string(utf_codepoint_integer_list) {
  return utf_codepoint_integer_list.toArray().map((x) => String.fromCodePoint(x.value)).join("");
}
function new_map() {
  return Dict.new();
}
function map_to_list(map10) {
  return List.fromArray(map10.entries());
}
function map_get(map10, key) {
  const value2 = map10.get(key, NOT_FOUND);
  if (value2 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value2);
}
function map_insert(key, value2, map10) {
  return map10.set(key, value2);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Array`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Nil";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function inspect(v) {
  return new Inspector().inspect(v);
}
function float_to_string(float2) {
  const string5 = float2.toString().replace("+", "");
  if (string5.indexOf(".") >= 0) {
    return string5;
  } else {
    const index5 = string5.indexOf("e");
    if (index5 >= 0) {
      return string5.slice(0, index5) + ".0" + string5.slice(index5);
    } else {
      return string5 + ".0";
    }
  }
}
var Inspector = class {
  #references = /* @__PURE__ */ new Set();
  inspect(v) {
    const t = typeof v;
    if (v === true)
      return "True";
    if (v === false)
      return "False";
    if (v === null)
      return "//js(null)";
    if (v === void 0)
      return "Nil";
    if (t === "string")
      return this.#string(v);
    if (t === "bigint" || Number.isInteger(v))
      return v.toString();
    if (t === "number")
      return float_to_string(v);
    if (v instanceof UtfCodepoint)
      return this.#utfCodepoint(v);
    if (v instanceof BitArray)
      return this.#bit_array(v);
    if (v instanceof RegExp)
      return `//js(${v})`;
    if (v instanceof Date)
      return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error)
      return `//js(${v.toString()})`;
    if (v instanceof Function) {
      const args = [];
      for (const i of Array(v.length).keys())
        args.push(String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (v instanceof List) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (v instanceof Dict) {
      printed = this.#dict(v);
    } else if (v instanceof Set) {
      return `//js(Set(${[...v].map((v2) => this.inspect(v2)).join(", ")}))`;
    } else {
      printed = this.#object(v);
    }
    this.#references.delete(v);
    return printed;
  }
  #object(v) {
    const name2 = Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body2 = props.length ? " " + props.join(", ") + " " : "";
    const head2 = name2 === "Object" ? "" : name2 + " ";
    return `//js(${head2}{${body2}})`;
  }
  #dict(map10) {
    let body2 = "dict.from_list([";
    let first = true;
    map10.forEach((value2, key) => {
      if (!first)
        body2 = body2 + ", ";
      body2 = body2 + "#(" + this.inspect(key) + ", " + this.inspect(value2) + ")";
      first = false;
    });
    return body2 + "])";
  }
  #customType(record) {
    const props = Object.keys(record).map((label) => {
      const value2 = this.inspect(record[label]);
      return isNaN(parseInt(label)) ? `${label}: ${value2}` : value2;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list4) {
    if (list4 instanceof Empty) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list4;
    while (current instanceof NonEmpty) {
      let element4 = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element4);
      if (char_out) {
        if (Number.isInteger(element4) && element4 >= 32 && element4 <= 126) {
          char_out += String.fromCharCode(element4);
        } else {
          char_out = null;
        }
      }
    }
    if (char_out) {
      return char_out + '")';
    } else {
      return list_out + "]";
    }
  }
  #string(str) {
    let new_str = '"';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case "\n":
          new_str += "\\n";
          break;
        case "\r":
          new_str += "\\r";
          break;
        case "	":
          new_str += "\\t";
          break;
        case "\f":
          new_str += "\\f";
          break;
        case "\\":
          new_str += "\\\\";
          break;
        case '"':
          new_str += '\\"';
          break;
        default:
          if (char < " " || char > "~" && char < "\xA0") {
            new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
          } else {
            new_str += char;
          }
      }
    }
    new_str += '"';
    return new_str;
  }
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
  }
  #bit_array(bits) {
    if (bits.bitSize === 0) {
      return "<<>>";
    }
    let acc = "<<";
    for (let i = 0; i < bits.byteSize - 1; i++) {
      acc += bits.byteAt(i).toString();
      acc += ", ";
    }
    if (bits.byteSize * 8 === bits.bitSize) {
      acc += bits.byteAt(bits.byteSize - 1).toString();
    } else {
      const trailingBitsCount = bits.bitSize % 8;
      acc += bits.byteAt(bits.byteSize - 1) >> 8 - trailingBitsCount;
      acc += `:size(${trailingBitsCount})`;
    }
    acc += ">>";
    return acc;
  }
};
function index2(data, key) {
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token4 = {};
    const entry = data.get(key, token4);
    if (entry === token4)
      return new Ok(new None());
    return new Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && data instanceof List) {
    let i = 0;
    for (const value2 of data) {
      if (i === key)
        return new Ok(new Some(value2));
      i++;
    }
    return new Error("Indexable");
  }
  if (key_is_int && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key in data)
      return new Ok(new Some(data[key]));
    return new Ok(new None());
  }
  return new Error(key_is_int ? "Indexable" : "Dict");
}
function list(data, decode2, pushPath, index5, emptyList) {
  if (!(data instanceof List || Array.isArray(data))) {
    const error = new DecodeError("List", classify_dynamic(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }
  const decoded = [];
  for (const element4 of data) {
    const layer = decode2(element4);
    const [out, errors] = layer;
    if (errors instanceof NonEmpty) {
      const [_, errors2] = pushPath(layer, index5.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index5++;
  }
  return [List.fromArray(decoded), emptyList];
}
function dict(data) {
  if (data instanceof Dict) {
    return new Ok(data);
  }
  if (data instanceof Map || data instanceof WeakMap) {
    return new Ok(Dict.fromMap(data));
  }
  if (data == null) {
    return new Error("Dict");
  }
  if (typeof data !== "object") {
    return new Error("Dict");
  }
  const proto = Object.getPrototypeOf(data);
  if (proto === Object.prototype || proto === null) {
    return new Ok(Dict.fromObject(data));
  }
  return new Error("Dict");
}
function int(data) {
  if (Number.isInteger(data))
    return new Ok(data);
  return new Error(0);
}
function string(data) {
  if (typeof data === "string")
    return new Ok(data);
  return new Error("");
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function do_has_key(key, dict3) {
  return !isEqual(map_get(dict3, key), new Error(void 0));
}
function has_key(dict3, key) {
  return do_has_key(key, dict3);
}
function insert(dict3, key, value2) {
  return map_insert(key, value2, dict3);
}
function from_list_loop(loop$list, loop$initial) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let rest = list4.tail;
      let key = list4.head[0];
      let value2 = list4.head[1];
      loop$list = rest;
      loop$initial = insert(initial, key, value2);
    }
  }
}
function from_list(list4) {
  return from_list_loop(list4, new_map());
}
function fold_loop(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let rest = list4.tail;
      let k = list4.head[0];
      let v = list4.head[1];
      loop$list = rest;
      loop$initial = fun(initial, k, v);
      loop$fun = fun;
    }
  }
}
function fold(dict3, initial, fun) {
  return fold_loop(map_to_list(dict3), initial, fun);
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Continue = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Stop = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let _block;
      let $ = fun(first$1);
      if ($) {
        _block = prepend(first$1, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list4, predicate) {
  return filter_loop(list4, predicate, toList([]));
}
function filter_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let _block;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        let first$2 = $[0];
        _block = prepend(first$2, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter_map(list4, fun) {
  return filter_map_loop(list4, fun, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function take_loop(loop$list, loop$n, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let n = loop$n;
    let acc = loop$acc;
    let $ = n <= 0;
    if ($) {
      return reverse(acc);
    } else {
      if (list4 instanceof Empty) {
        return reverse(acc);
      } else {
        let first$1 = list4.head;
        let rest$1 = list4.tail;
        loop$list = rest$1;
        loop$n = n - 1;
        loop$acc = prepend(first$1, acc);
      }
    }
  }
}
function take(list4, n) {
  return take_loop(list4, n, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second = loop$second;
    if (first instanceof Empty) {
      return second;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append3(first, second) {
  return append_loop(reverse(first), second);
}
function prepend2(list4, item) {
  return prepend(item, list4);
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists instanceof Empty) {
      return reverse(acc);
    } else {
      let list4 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list4, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, toList([]));
}
function flat_map(list4, fun) {
  return flatten(map2(list4, fun));
}
function fold2(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function fold_until(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = fun(initial, first$1);
      if ($ instanceof Continue) {
        let next_accumulator = $[0];
        loop$list = rest$1;
        loop$initial = next_accumulator;
        loop$fun = fun;
      } else {
        let b = $[0];
        return b;
      }
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list4 instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = compare4(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next2 = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare4(new$1, next2);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare4;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next2;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next2);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next2);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let ascending1 = sequences2.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(
          ascending1,
          ascending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let descending1 = sequences2.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(
          descending1,
          descending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2 instanceof Empty) {
      return toList([]);
    } else if (direction instanceof Ascending) {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences2, compare4, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Descending();
        loop$compare = compare4;
      }
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(sequence);
      } else {
        let sequences$1 = merge_descending_pairs(sequences2, compare4, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Ascending();
        loop$compare = compare4;
      }
    }
  }
}
function sort(list4, compare4) {
  if (list4 instanceof Empty) {
    return toList([]);
  } else {
    let $ = list4.tail;
    if ($ instanceof Empty) {
      let x = list4.head;
      return toList([x]);
    } else {
      let x = list4.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare4(x, y);
      if ($1 instanceof Lt) {
        _block = new Ascending();
      } else if ($1 instanceof Eq) {
        _block = new Ascending();
      } else {
        _block = new Descending();
      }
      let direction = _block;
      let sequences$1 = sequences(
        rest$1,
        compare4,
        toList([x]),
        direction,
        y,
        toList([])
      );
      return merge_all(sequences$1, new Ascending(), compare4);
    }
  }
}
function key_pop_loop(loop$list, loop$key, loop$checked) {
  while (true) {
    let list4 = loop$list;
    let key = loop$key;
    let checked = loop$checked;
    if (list4 instanceof Empty) {
      return new Error(void 0);
    } else {
      let k = list4.head[0];
      if (isEqual(k, key)) {
        let rest$1 = list4.tail;
        let v = list4.head[1];
        return new Ok([v, reverse_and_prepend(checked, rest$1)]);
      } else {
        let first$1 = list4.head;
        let rest$1 = list4.tail;
        loop$list = rest$1;
        loop$key = key;
        loop$checked = prepend(first$1, checked);
      }
    }
  }
}
function key_pop(list4, key) {
  return key_pop_loop(list4, key, toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function is_ok(result) {
  if (result instanceof Ok) {
    return true;
  } else {
    return false;
  }
}
function map4(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function unwrap2(result, default$) {
  if (result instanceof Ok) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}
function replace_error(result, error) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(x);
  } else {
    return new Error(error);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment2) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment2;
  }
};
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_fragment(rest, pieces) {
  return new Ok(
    (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        new Some(rest)
      );
    })()
  );
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string.startsWith("#")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let query = string_codeunit_slice(original, 0, size3);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          new Some(query),
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_fragment(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            _record.path,
            new Some(original),
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function parse_query_with_question_mark(uri_string, pieces) {
  return parse_query_with_question_mark_loop(uri_string, uri_string, pieces, 0);
}
function parse_path_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size3);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size3);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function parse_path(uri_string, pieces) {
  return parse_path_loop(uri_string, uri_string, pieces, 0);
}
function parse_port_loop(loop$uri_string, loop$pieces, loop$port) {
  while (true) {
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let port = loop$port;
    if (uri_string.startsWith("0")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10;
    } else if (uri_string.startsWith("1")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 1;
    } else if (uri_string.startsWith("2")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 2;
    } else if (uri_string.startsWith("3")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 3;
    } else if (uri_string.startsWith("4")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 4;
    } else if (uri_string.startsWith("5")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 5;
    } else if (uri_string.startsWith("6")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 6;
    } else if (uri_string.startsWith("7")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 7;
    } else if (uri_string.startsWith("8")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 8;
    } else if (uri_string.startsWith("9")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 9;
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            new Some(port),
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      return new Error(void 0);
    }
  }
}
function parse_port(uri_string, pieces) {
  if (uri_string.startsWith(":0")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 0);
  } else if (uri_string.startsWith(":1")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 1);
  } else if (uri_string.startsWith(":2")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 2);
  } else if (uri_string.startsWith(":3")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 3);
  } else if (uri_string.startsWith(":4")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 4);
  } else if (uri_string.startsWith(":5")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 5);
  } else if (uri_string.startsWith(":6")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 6);
  } else if (uri_string.startsWith(":7")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 7);
  } else if (uri_string.startsWith(":8")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 8);
  } else if (uri_string.startsWith(":9")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 9);
  } else if (uri_string.startsWith(":")) {
    return new Error(void 0);
  } else if (uri_string.startsWith("?")) {
    let rest = uri_string.slice(1);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith("#")) {
    let rest = uri_string.slice(1);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith("/")) {
    return parse_path(uri_string, pieces);
  } else if (uri_string === "") {
    return new Ok(pieces);
  } else {
    return new Error(void 0);
  }
}
function parse_host_outside_of_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(original),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith(":")) {
      let host = string_codeunit_slice(original, 0, size3);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size3);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size3);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size3);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(uri_string),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith("]")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_port(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size3 + 1);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_port(rest, pieces$1);
      }
    } else if (uri_string.startsWith("/")) {
      if (size3 === 0) {
        return parse_path(uri_string, pieces);
      } else {
        let host = string_codeunit_slice(original, 0, size3);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_path(uri_string, pieces$1);
      }
    } else if (uri_string.startsWith("?")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size3);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if (uri_string.startsWith("#")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size3);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_fragment(rest, pieces$1);
      }
    } else {
      let $ = pop_codeunit(uri_string);
      let char = $[0];
      let rest = $[1];
      let $1 = is_valid_host_within_brackets_char(char);
      if ($1) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size3 + 1;
      } else {
        return parse_host_outside_of_brackets_loop(
          original,
          original,
          pieces,
          0
        );
      }
    }
  }
}
function parse_host_within_brackets(uri_string, pieces) {
  return parse_host_within_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host_outside_of_brackets(uri_string, pieces) {
  return parse_host_outside_of_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host(uri_string, pieces) {
  if (uri_string.startsWith("[")) {
    return parse_host_within_brackets(uri_string, pieces);
  } else if (uri_string.startsWith(":")) {
    let _block;
    let _record = pieces;
    _block = new Uri(
      _record.scheme,
      _record.userinfo,
      new Some(""),
      _record.port,
      _record.path,
      _record.query,
      _record.fragment
    );
    let pieces$1 = _block;
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else {
    return parse_host_outside_of_brackets(uri_string, pieces);
  }
}
function parse_userinfo_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string.startsWith("@")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_host(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let userinfo = string_codeunit_slice(original, 0, size3);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          new Some(userinfo),
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_host(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("/")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("?")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("#")) {
      return parse_host(original, pieces);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function parse_authority_pieces(string5, pieces) {
  return parse_userinfo_loop(string5, string5, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else if (uri_string.startsWith("//")) {
    let rest = uri_string.slice(2);
    return parse_authority_pieces(rest, pieces);
  } else {
    return parse_path(uri_string, pieces);
  }
}
function parse_scheme_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size3 = loop$size;
    if (uri_string.startsWith("/")) {
      if (size3 === 0) {
        return parse_authority_with_slashes(uri_string, pieces);
      } else {
        let scheme = string_codeunit_slice(original, 0, size3);
        let _block;
        let _record = pieces;
        _block = new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_authority_with_slashes(uri_string, pieces$1);
      }
    } else if (uri_string.startsWith("?")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size3);
        let _block;
        let _record = pieces;
        _block = new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if (uri_string.startsWith("#")) {
      if (size3 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size3);
        let _block;
        let _record = pieces;
        _block = new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_fragment(rest, pieces$1);
      }
    } else if (uri_string.startsWith(":")) {
      if (size3 === 0) {
        return new Error(void 0);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size3);
        let _block;
        let _record = pieces;
        _block = new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_authority_with_slashes(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size3 + 1;
    }
  }
}
function to_string2(uri) {
  let _block;
  let $ = uri.fragment;
  if ($ instanceof Some) {
    let fragment2 = $[0];
    _block = toList(["#", fragment2]);
  } else {
    _block = toList([]);
  }
  let parts = _block;
  let _block$1;
  let $1 = uri.query;
  if ($1 instanceof Some) {
    let query = $1[0];
    _block$1 = prepend("?", prepend(query, parts));
  } else {
    _block$1 = parts;
  }
  let parts$1 = _block$1;
  let parts$2 = prepend(uri.path, parts$1);
  let _block$2;
  let $2 = uri.host;
  let $3 = starts_with(uri.path, "/");
  if (!$3) {
    if ($2 instanceof Some) {
      let host = $2[0];
      if (host !== "") {
        _block$2 = prepend("/", parts$2);
      } else {
        _block$2 = parts$2;
      }
    } else {
      _block$2 = parts$2;
    }
  } else {
    _block$2 = parts$2;
  }
  let parts$3 = _block$2;
  let _block$3;
  let $4 = uri.host;
  let $5 = uri.port;
  if ($5 instanceof Some) {
    if ($4 instanceof Some) {
      let port = $5[0];
      _block$3 = prepend(":", prepend(to_string(port), parts$3));
    } else {
      _block$3 = parts$3;
    }
  } else {
    _block$3 = parts$3;
  }
  let parts$4 = _block$3;
  let _block$4;
  let $6 = uri.scheme;
  let $7 = uri.userinfo;
  let $8 = uri.host;
  if ($8 instanceof Some) {
    if ($7 instanceof Some) {
      if ($6 instanceof Some) {
        let h = $8[0];
        let u = $7[0];
        let s = $6[0];
        _block$4 = prepend(
          s,
          prepend(
            "://",
            prepend(u, prepend("@", prepend(h, parts$4)))
          )
        );
      } else {
        _block$4 = parts$4;
      }
    } else if ($6 instanceof Some) {
      let h = $8[0];
      let s = $6[0];
      _block$4 = prepend(s, prepend("://", prepend(h, parts$4)));
    } else {
      let h = $8[0];
      _block$4 = prepend("//", prepend(h, parts$4));
    }
  } else if ($7 instanceof Some) {
    if ($6 instanceof Some) {
      let s = $6[0];
      _block$4 = prepend(s, prepend(":", parts$4));
    } else {
      _block$4 = parts$4;
    }
  } else if ($6 instanceof Some) {
    let s = $6[0];
    _block$4 = prepend(s, prepend(":", parts$4));
  } else {
    _block$4 = parts$4;
  }
  let parts$5 = _block$4;
  return concat2(parts$5);
}
var empty = /* @__PURE__ */ new Uri(
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  "",
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);
function parse(uri_string) {
  return parse_scheme_loop(uri_string, uri_string, empty, 0);
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options = class extends CustomType {
};
var Patch = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method2) {
  if (method2 instanceof Get) {
    return "GET";
  } else if (method2 instanceof Post) {
    return "POST";
  } else if (method2 instanceof Head) {
    return "HEAD";
  } else if (method2 instanceof Put) {
    return "PUT";
  } else if (method2 instanceof Delete) {
    return "DELETE";
  } else if (method2 instanceof Trace) {
    return "TRACE";
  } else if (method2 instanceof Connect) {
    return "CONNECT";
  } else if (method2 instanceof Options) {
    return "OPTIONS";
  } else if (method2 instanceof Patch) {
    return "PATCH";
  } else {
    let s = method2[0];
    return s;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method2, headers, body2, scheme, host, port, path, query) {
    super();
    this.method = method2;
    this.headers = headers;
    this.body = body2;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return try$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return try$(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}
function to(url) {
  let _pipe = url;
  let _pipe$1 = parse(_pipe);
  return try$(_pipe$1, from_uri);
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body2) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body2;
  }
};

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value2) {
    return value2 instanceof Promise ? new _PromiseLayer(value2) : value2;
  }
  static unwrap(value2) {
    return value2 instanceof _PromiseLayer ? value2.promise : value2;
  }
};
function resolve(value2) {
  return Promise.resolve(PromiseLayer.wrap(value2));
}
function then_await(promise, fn) {
  return promise.then((value2) => fn(PromiseLayer.unwrap(value2)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value2) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value2)))
  );
}
function wait(delay) {
  return new Promise((resolve2) => {
    globalThis.setTimeout(resolve2, delay);
  });
}
function race_promises(...promises) {
  if (promises.length === 1) {
    return Promise.race(promises[0]);
  } else {
    return Promise.race(promises);
  }
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (a2) => {
      callback(a2);
      return a2;
    }
  );
}
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(
    _pipe,
    (result) => {
      if (result instanceof Ok) {
        let a2 = result[0];
        return callback(a2);
      } else {
        let e = result[0];
        return resolve(new Error(e));
      }
    }
  );
}

// build/dev/javascript/gleam_fetch/gleam_fetch_ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error) {
    return new Error(new NetworkError(error.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function request_common(request) {
  let url = to_string2(to_uri(request));
  let method2 = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method: method2
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD")
    options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList)
    headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body2;
  try {
    body2 = await response.body.text();
  } catch (error) {
    return new Error(new UnableToReadBody());
  }
  return new Ok(response.withFields({ body: body2 }));
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnableToReadBody = class extends CustomType {
};
function send(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/iv/iv_ffi.mjs
var empty2 = () => [];
var singleton = (x) => [x];
var append4 = (xs, x) => [...xs, x];
var get1 = (idx, xs) => xs[idx - 1];
var length4 = (xs) => xs.length;
var bsl = (a2, b) => a2 << b;
var bsr = (a2, b) => a2 >> b;

// build/dev/javascript/iv/iv/internal/vector.mjs
function fold_loop2(loop$xs, loop$state, loop$idx, loop$len, loop$fun) {
  while (true) {
    let xs = loop$xs;
    let state = loop$state;
    let idx = loop$idx;
    let len = loop$len;
    let fun = loop$fun;
    let $ = idx <= len;
    if ($) {
      loop$xs = xs;
      loop$state = fun(state, get1(idx, xs));
      loop$idx = idx + 1;
      loop$len = len;
      loop$fun = fun;
    } else {
      return state;
    }
  }
}
function fold_skip_first(xs, state, fun) {
  let len = length4(xs);
  return fold_loop2(xs, state, 2, len, fun);
}

// build/dev/javascript/iv/iv/internal/node.mjs
var Balanced = class extends CustomType {
  constructor(size3, children2) {
    super();
    this.size = size3;
    this.children = children2;
  }
};
var Unbalanced = class extends CustomType {
  constructor(sizes, children2) {
    super();
    this.sizes = sizes;
    this.children = children2;
  }
};
var Leaf = class extends CustomType {
  constructor(children2) {
    super();
    this.children = children2;
  }
};
function leaf(items) {
  return new Leaf(items);
}
function size(node) {
  if (node instanceof Balanced) {
    let size$1 = node.size;
    return size$1;
  } else if (node instanceof Unbalanced) {
    let sizes = node.sizes;
    return get1(length4(sizes), sizes);
  } else {
    let children2 = node.children;
    return length4(children2);
  }
}
function compute_sizes(nodes) {
  let first_size = size(get1(1, nodes));
  return fold_skip_first(
    nodes,
    singleton(first_size),
    (sizes, node) => {
      let size$1 = get1(length4(sizes), sizes) + size(node);
      return append4(sizes, size$1);
    }
  );
}
function find_size(loop$sizes, loop$size_idx_plus_one, loop$index) {
  while (true) {
    let sizes = loop$sizes;
    let size_idx_plus_one = loop$size_idx_plus_one;
    let index5 = loop$index;
    let $ = get1(size_idx_plus_one, sizes) > index5;
    if ($) {
      return size_idx_plus_one - 1;
    } else {
      loop$sizes = sizes;
      loop$size_idx_plus_one = size_idx_plus_one + 1;
      loop$index = index5;
    }
  }
}
function balanced(shift, nodes) {
  let len = length4(nodes);
  let last_child = get1(len, nodes);
  let max_size = bsl(1, shift);
  let size$1 = max_size * (len - 1) + size(last_child);
  return new Balanced(size$1, nodes);
}
function branch(shift, nodes) {
  let len = length4(nodes);
  let max_size = bsl(1, shift);
  let sizes = compute_sizes(nodes);
  let _block;
  if (len === 1) {
    _block = 0;
  } else {
    _block = get1(len - 1, sizes);
  }
  let prefix_size = _block;
  let is_balanced = prefix_size === max_size * (len - 1);
  if (is_balanced) {
    let size$1 = get1(len, sizes);
    return new Balanced(size$1, nodes);
  } else {
    return new Unbalanced(sizes, nodes);
  }
}
var branch_bits = 5;
function get(loop$node, loop$shift, loop$index) {
  while (true) {
    let node = loop$node;
    let shift = loop$shift;
    let index5 = loop$index;
    if (node instanceof Balanced) {
      let children2 = node.children;
      let node_index = bsr(index5, shift);
      let index$1 = index5 - bsl(node_index, shift);
      let child = get1(node_index + 1, children2);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else if (node instanceof Unbalanced) {
      let sizes = node.sizes;
      let children2 = node.children;
      let start_search_index = bsr(index5, shift);
      let node_index = find_size(sizes, start_search_index + 1, index5);
      let _block;
      if (node_index === 0) {
        _block = index5;
      } else {
        _block = index5 - get1(node_index, sizes);
      }
      let index$1 = _block;
      let child = get1(node_index + 1, children2);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else {
      let children2 = node.children;
      return get1(index5 + 1, children2);
    }
  }
}
var branch_factor = 32;

// build/dev/javascript/iv/iv/internal/builder.mjs
var Builder = class extends CustomType {
  constructor(nodes, items, push_node, push_item) {
    super();
    this.nodes = nodes;
    this.items = items;
    this.push_node = push_node;
    this.push_item = push_item;
  }
};
function append_node(nodes, node, shift) {
  if (nodes instanceof Empty) {
    return toList([singleton(node)]);
  } else {
    let nodes$1 = nodes.head;
    let rest = nodes.tail;
    let $ = length4(nodes$1) < branch_factor;
    if ($) {
      return prepend(append4(nodes$1, node), rest);
    } else {
      let shift$1 = shift + branch_bits;
      let new_node = balanced(shift$1, nodes$1);
      return prepend(
        singleton(node),
        append_node(rest, new_node, shift$1)
      );
    }
  }
}
function new$2() {
  return new Builder(toList([]), empty2(), append_node, append4);
}
function push(builder, item) {
  let nodes = builder.nodes;
  let items = builder.items;
  let push_node = builder.push_node;
  let push_item = builder.push_item;
  let $ = length4(items) === branch_factor;
  if ($) {
    let leaf2 = leaf(items);
    return new Builder(
      push_node(nodes, leaf2, 0),
      singleton(item),
      push_node,
      push_item
    );
  } else {
    return new Builder(nodes, push_item(items, item), push_node, push_item);
  }
}
function compress_nodes(loop$nodes, loop$push_node, loop$shift) {
  while (true) {
    let nodes = loop$nodes;
    let push_node = loop$push_node;
    let shift = loop$shift;
    if (nodes instanceof Empty) {
      return new Error(void 0);
    } else {
      let $ = nodes.tail;
      if ($ instanceof Empty) {
        let root2 = nodes.head;
        return new Ok([shift, root2]);
      } else {
        let nodes$1 = nodes.head;
        let rest = $;
        let shift$1 = shift + branch_bits;
        let compressed = push_node(
          rest,
          branch(shift$1, nodes$1),
          shift$1
        );
        loop$nodes = compressed;
        loop$push_node = push_node;
        loop$shift = shift$1;
      }
    }
  }
}
function build(builder) {
  let nodes = builder.nodes;
  let items = builder.items;
  let push_node = builder.push_node;
  let items_len = length4(items);
  let _block;
  let $ = items_len > 0;
  if ($) {
    _block = push_node(nodes, leaf(items), 0);
  } else {
    _block = nodes;
  }
  let nodes$1 = _block;
  return compress_nodes(nodes$1, push_node, 0);
}

// build/dev/javascript/iv/iv.mjs
var Empty2 = class extends CustomType {
};
var Array2 = class extends CustomType {
  constructor(shift, root2) {
    super();
    this.shift = shift;
    this.root = root2;
  }
};
function array(shift, nodes) {
  let $ = length4(nodes);
  if ($ === 0) {
    return new Empty2();
  } else if ($ === 1) {
    return new Array2(shift, get1(1, nodes));
  } else {
    let shift$1 = shift + branch_bits;
    return new Array2(shift$1, branch(shift$1, nodes));
  }
}
function from_list2(list4) {
  let $ = (() => {
    let _pipe = list4;
    let _pipe$1 = fold2(_pipe, new$2(), push);
    return build(_pipe$1);
  })();
  if ($ instanceof Ok) {
    let shift = $[0][0];
    let nodes = $[0][1];
    return array(shift, nodes);
  } else {
    return new Empty2();
  }
}
function get2(array4, index5) {
  if (array4 instanceof Empty2) {
    return new Error(void 0);
  } else {
    let shift = array4.shift;
    let root2 = array4.root;
    let $ = 0 <= index5 && index5 < size(root2);
    if ($) {
      return new Ok(get(root2, shift, index5));
    } else {
      return new Error(void 0);
    }
  }
}

// build/dev/javascript/gleam_regexp/gleam_regexp_ffi.mjs
function check(regex, string5) {
  regex.lastIndex = 0;
  return regex.test(string5);
}
function compile(pattern, options) {
  try {
    let flags = "gu";
    if (options.case_insensitive)
      flags += "i";
    if (options.multi_line)
      flags += "m";
    return new Ok(new RegExp(pattern, flags));
  } catch (error) {
    const number = (error.columnNumber || 0) | 0;
    return new Error(new CompileError(error.message, number));
  }
}

// build/dev/javascript/gleam_regexp/gleam/regexp.mjs
var CompileError = class extends CustomType {
  constructor(error, byte_index) {
    super();
    this.error = error;
    this.byte_index = byte_index;
  }
};
var Options2 = class extends CustomType {
  constructor(case_insensitive, multi_line) {
    super();
    this.case_insensitive = case_insensitive;
    this.multi_line = multi_line;
  }
};
function compile2(pattern, options) {
  return compile(pattern, options);
}
function from_string(pattern) {
  return compile2(pattern, new Options2(false, false));
}
function check2(regexp, string5) {
  return check(regexp, string5);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict3) {
    super();
    this.dict = dict3;
  }
};
function new$4() {
  return new Set2(new_map());
}
function contains(set, member) {
  let _pipe = set.dict;
  let _pipe$1 = map_get(_pipe, member);
  return is_ok(_pipe$1);
}
var token = void 0;
function from_list3(members) {
  let dict3 = fold2(
    members,
    new_map(),
    (m, k) => {
      return insert(m, k, token);
    }
  );
  return new Set2(dict3);
}

// build/dev/javascript/nibble/nibble/lexer.mjs
var FILEPATH = "src/nibble/lexer.gleam";
var Matcher = class extends CustomType {
  constructor(run3) {
    super();
    this.run = run3;
  }
};
var Keep = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var Skip = class extends CustomType {
};
var Drop = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var NoMatch = class extends CustomType {
};
var Token = class extends CustomType {
  constructor(span2, lexeme, value2) {
    super();
    this.span = span2;
    this.lexeme = lexeme;
    this.value = value2;
  }
};
var Span = class extends CustomType {
  constructor(row_start, col_start, row_end, col_end) {
    super();
    this.row_start = row_start;
    this.col_start = col_start;
    this.row_end = row_end;
    this.col_end = col_end;
  }
};
var NoMatchFound = class extends CustomType {
  constructor(row, col, lexeme) {
    super();
    this.row = row;
    this.col = col;
    this.lexeme = lexeme;
  }
};
var Lexer = class extends CustomType {
  constructor(matchers) {
    super();
    this.matchers = matchers;
  }
};
var State = class extends CustomType {
  constructor(source, tokens, current, row, col) {
    super();
    this.source = source;
    this.tokens = tokens;
    this.current = current;
    this.row = row;
    this.col = col;
  }
};
function advanced(matchers) {
  return new Lexer((mode) => {
    return matchers(mode);
  });
}
function map8(matcher, f) {
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let $ = matcher.run(mode, lexeme, lookahead);
      if ($ instanceof Keep) {
        let value2 = $[0];
        let mode$1 = $[1];
        return new Keep(f(value2), mode$1);
      } else if ($ instanceof Skip) {
        return new Skip();
      } else if ($ instanceof Drop) {
        let mode$1 = $[0];
        return new Drop(mode$1);
      } else {
        return new NoMatch();
      }
    }
  );
}
function into(matcher, f) {
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let $ = matcher.run(mode, lexeme, lookahead);
      if ($ instanceof Keep) {
        let value2 = $[0];
        let mode$1 = $[1];
        return new Keep(value2, f(mode$1));
      } else if ($ instanceof Skip) {
        return new Skip();
      } else if ($ instanceof Drop) {
        let mode$1 = $[0];
        return new Drop(f(mode$1));
      } else {
        return new NoMatch();
      }
    }
  );
}
function ignore(matcher) {
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let $ = matcher.run(mode, lexeme, lookahead);
      if ($ instanceof Keep) {
        let mode$1 = $[1];
        return new Drop(mode$1);
      } else if ($ instanceof Skip) {
        return new Skip();
      } else if ($ instanceof Drop) {
        let mode$1 = $[0];
        return new Drop(mode$1);
      } else {
        return new NoMatch();
      }
    }
  );
}
function token2(str, value2) {
  return new Matcher(
    (mode, lexeme, _) => {
      let $ = lexeme === str;
      if ($) {
        return new Keep(value2, mode);
      } else {
        return new NoMatch();
      }
    }
  );
}
function keyword(str, breaker, value2) {
  let $ = from_string(breaker);
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "nibble/lexer",
      334,
      "keyword",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 11137,
        end: 11187,
        pattern_start: 11148,
        pattern_end: 11157
      }
    );
  }
  let break$ = $[0];
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let $1 = lexeme === str && (lookahead === "" || check2(
        break$,
        lookahead
      ));
      if ($1) {
        return new Keep(value2, mode);
      } else {
        return new NoMatch();
      }
    }
  );
}
function identifier(start, inner, reserved, to_value) {
  let $ = from_string("^" + start + inner + "*$");
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "nibble/lexer",
      486,
      "identifier",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 14767,
        end: 14839,
        pattern_start: 14778,
        pattern_end: 14787
      }
    );
  }
  let ident = $[0];
  let $1 = from_string(inner);
  if (!($1 instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "nibble/lexer",
      487,
      "identifier",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $1,
        start: 14842,
        end: 14890,
        pattern_start: 14853,
        pattern_end: 14862
      }
    );
  }
  let inner$1 = $1[0];
  return new Matcher(
    (mode, lexeme, lookahead) => {
      let $2 = check2(inner$1, lookahead);
      let $3 = check2(ident, lexeme);
      if ($3) {
        if ($2) {
          return new Skip();
        } else {
          let $4 = contains(reserved, lexeme);
          if ($4) {
            return new NoMatch();
          } else {
            return new Keep(to_value(lexeme), mode);
          }
        }
      } else {
        return new NoMatch();
      }
    }
  );
}
function whitespace(token4) {
  let $ = from_string("^\\s+$");
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "nibble/lexer",
      557,
      "whitespace",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 16378,
        end: 16434,
        pattern_start: 16389,
        pattern_end: 16403
      }
    );
  }
  let whitespace$1 = $[0];
  return new Matcher(
    (mode, lexeme, _) => {
      let $1 = check2(whitespace$1, lexeme);
      if ($1) {
        return new Keep(token4, mode);
      } else {
        return new NoMatch();
      }
    }
  );
}
function do_match(mode, str, lookahead, matchers) {
  return fold_until(
    matchers,
    new NoMatch(),
    (_, matcher) => {
      let $ = matcher.run(mode, str, lookahead);
      if ($ instanceof Keep) {
        let match = $;
        return new Stop(match);
      } else if ($ instanceof Skip) {
        return new Stop(new Skip());
      } else if ($ instanceof Drop) {
        let match = $;
        return new Stop(match);
      } else {
        return new Continue(new NoMatch());
      }
    }
  );
}
function next_col(col, str) {
  if (str === "\n") {
    return 1;
  } else {
    return col + 1;
  }
}
function next_row(row, str) {
  if (str === "\n") {
    return row + 1;
  } else {
    return row;
  }
}
function do_run(loop$lexer, loop$mode, loop$state) {
  while (true) {
    let lexer2 = loop$lexer;
    let mode = loop$mode;
    let state = loop$state;
    let matchers = lexer2.matchers(mode);
    let $ = state.source;
    let $1 = state.current;
    if ($ instanceof Empty) {
      let $2 = $1[2];
      if ($2 === "") {
        return new Ok(reverse(state.tokens));
      } else {
        let start_row = $1[0];
        let start_col = $1[1];
        let lexeme = $2;
        let $3 = do_match(mode, lexeme, "", matchers);
        if ($3 instanceof Keep) {
          let value2 = $3[0];
          let span2 = new Span(start_row, start_col, state.row, state.col);
          let token$1 = new Token(span2, lexeme, value2);
          return new Ok(reverse(prepend(token$1, state.tokens)));
        } else if ($3 instanceof Skip) {
          return new Error(new NoMatchFound(start_row, start_col, lexeme));
        } else if ($3 instanceof Drop) {
          return new Ok(reverse(state.tokens));
        } else {
          return new Error(new NoMatchFound(start_row, start_col, lexeme));
        }
      }
    } else {
      let start_row = $1[0];
      let start_col = $1[1];
      let lexeme = $1[2];
      let lookahead = $.head;
      let rest = $.tail;
      let row = next_row(state.row, lookahead);
      let col = next_col(state.col, lookahead);
      let $2 = do_match(mode, lexeme, lookahead, matchers);
      if ($2 instanceof Keep) {
        let value2 = $2[0];
        let mode$1 = $2[1];
        let span2 = new Span(start_row, start_col, state.row, state.col);
        let token$1 = new Token(span2, lexeme, value2);
        loop$lexer = lexer2;
        loop$mode = mode$1;
        loop$state = new State(
          rest,
          prepend(token$1, state.tokens),
          [state.row, state.col, lookahead],
          row,
          col
        );
      } else if ($2 instanceof Skip) {
        loop$lexer = lexer2;
        loop$mode = mode;
        loop$state = new State(
          rest,
          state.tokens,
          [start_row, start_col, lexeme + lookahead],
          row,
          col
        );
      } else if ($2 instanceof Drop) {
        let mode$1 = $2[0];
        loop$lexer = lexer2;
        loop$mode = mode$1;
        loop$state = new State(
          rest,
          state.tokens,
          [state.row, state.col, lookahead],
          row,
          col
        );
      } else {
        loop$lexer = lexer2;
        loop$mode = mode;
        loop$state = new State(
          rest,
          state.tokens,
          [start_row, start_col, lexeme + lookahead],
          row,
          col
        );
      }
    }
  }
}
function run_advanced(source, mode, lexer2) {
  return do_run(
    lexer2,
    mode,
    new State(graphemes(source), toList([]), [1, 1, ""], 1, 1)
  );
}

// build/dev/javascript/nibble/nibble.mjs
var Parser = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Cont = class extends CustomType {
  constructor($0, $1, $2) {
    super();
    this[0] = $0;
    this[1] = $1;
    this[2] = $2;
  }
};
var Fail = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var State2 = class extends CustomType {
  constructor(src2, idx, pos, ctx) {
    super();
    this.src = src2;
    this.idx = idx;
    this.pos = pos;
    this.ctx = ctx;
  }
};
var CanBacktrack = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Continue2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Break = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var BadParser = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Custom = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var EndOfInput = class extends CustomType {
};
var Expected = class extends CustomType {
  constructor($0, got) {
    super();
    this[0] = $0;
    this.got = got;
  }
};
var DeadEnd = class extends CustomType {
  constructor(pos, problem, context) {
    super();
    this.pos = pos;
    this.problem = problem;
    this.context = context;
  }
};
var Empty3 = class extends CustomType {
};
var Cons = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var Append = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
function runwrap(state, parser2) {
  let parse5 = parser2[0];
  return parse5(state);
}
function next(state) {
  let $ = get2(state.src, state.idx);
  if ($ instanceof Ok) {
    let span$1 = $[0].span;
    let tok = $[0].value;
    return [
      new Some(tok),
      (() => {
        let _record = state;
        return new State2(_record.src, state.idx + 1, span$1, _record.ctx);
      })()
    ];
  } else {
    return [new None(), state];
  }
}
function return$(value2) {
  return new Parser(
    (state) => {
      return new Cont(new CanBacktrack(false), value2, state);
    }
  );
}
function should_commit(a2, b) {
  let a$1 = a2[0];
  let b$1 = b[0];
  return new CanBacktrack(a$1 || b$1);
}
function do$(parser2, f) {
  return new Parser(
    (state) => {
      let $ = runwrap(state, parser2);
      if ($ instanceof Cont) {
        let to_a = $[0];
        let a2 = $[1];
        let state$1 = $[2];
        let $1 = runwrap(state$1, f(a2));
        if ($1 instanceof Cont) {
          let to_b = $1[0];
          let b = $1[1];
          let state$2 = $1[2];
          return new Cont(should_commit(to_a, to_b), b, state$2);
        } else {
          let to_b = $1[0];
          let bag = $1[1];
          return new Fail(should_commit(to_a, to_b), bag);
        }
      } else {
        let can_backtrack = $[0];
        let bag = $[1];
        return new Fail(can_backtrack, bag);
      }
    }
  );
}
function then$2(parser2, f) {
  return do$(parser2, f);
}
function map9(parser2, f) {
  return do$(parser2, (a2) => {
    return return$(f(a2));
  });
}
function replace3(parser2, b) {
  return map9(parser2, (_) => {
    return b;
  });
}
function loop_help(loop$f, loop$commit, loop$loop_state, loop$state) {
  while (true) {
    let f = loop$f;
    let commit = loop$commit;
    let loop_state = loop$loop_state;
    let state = loop$state;
    let $ = runwrap(state, f(loop_state));
    if ($ instanceof Cont) {
      let $1 = $[1];
      if ($1 instanceof Continue2) {
        let can_backtrack = $[0];
        let next_state = $[2];
        let next_loop_state = $1[0];
        loop$f = f;
        loop$commit = should_commit(commit, can_backtrack);
        loop$loop_state = next_loop_state;
        loop$state = next_state;
      } else {
        let can_backtrack = $[0];
        let next_state = $[2];
        let result = $1[0];
        return new Cont(
          should_commit(commit, can_backtrack),
          result,
          next_state
        );
      }
    } else {
      let can_backtrack = $[0];
      let bag = $[1];
      return new Fail(should_commit(commit, can_backtrack), bag);
    }
  }
}
function loop(init, step) {
  return new Parser(
    (state) => {
      return loop_help(step, new CanBacktrack(false), init, state);
    }
  );
}
function take_while(predicate) {
  return new Parser(
    (state) => {
      let $ = next(state);
      let tok = $[0];
      let next_state = $[1];
      let $1 = map(tok, predicate);
      if ($1 instanceof Some) {
        let $2 = $1[0];
        if ($2) {
          if (tok instanceof Some) {
            let tok$1 = tok[0];
            return runwrap(
              next_state,
              do$(
                take_while(predicate),
                (toks) => {
                  return return$(prepend(tok$1, toks));
                }
              )
            );
          } else {
            return new Cont(new CanBacktrack(false), toList([]), state);
          }
        } else if (tok instanceof Some) {
          return new Cont(new CanBacktrack(false), toList([]), state);
        } else {
          return new Cont(new CanBacktrack(false), toList([]), state);
        }
      } else {
        return new Cont(new CanBacktrack(false), toList([]), state);
      }
    }
  );
}
function take_map_while(f) {
  return new Parser(
    (state) => {
      let $ = next(state);
      let tok = $[0];
      let next_state = $[1];
      let $1 = then$(tok, f);
      if (tok instanceof Some) {
        if ($1 instanceof Some) {
          let x = $1[0];
          return runwrap(
            next_state,
            (() => {
              let _pipe = take_map_while(f);
              return map9(
                _pipe,
                (_capture) => {
                  return prepend2(_capture, x);
                }
              );
            })()
          );
        } else {
          return new Cont(new CanBacktrack(true), toList([]), state);
        }
      } else {
        return new Cont(new CanBacktrack(true), toList([]), state);
      }
    }
  );
}
function bag_from_state(state, problem) {
  return new Cons(new Empty3(), new DeadEnd(state.pos, problem, state.ctx));
}
function throw$(message) {
  return new Parser(
    (state) => {
      let error = new Custom(message);
      let bag = bag_from_state(state, error);
      return new Fail(new CanBacktrack(false), bag);
    }
  );
}
function fail(message) {
  return throw$(message);
}
function token3(tok) {
  return new Parser(
    (state) => {
      let $ = next(state);
      let $1 = $[0];
      if ($1 instanceof Some) {
        let t = $1[0];
        if (isEqual(tok, t)) {
          let state$1 = $[1];
          return new Cont(new CanBacktrack(true), void 0, state$1);
        } else {
          let state$1 = $[1];
          let t$1 = $1[0];
          return new Fail(
            new CanBacktrack(false),
            bag_from_state(state$1, new Expected(inspect2(tok), t$1))
          );
        }
      } else {
        let state$1 = $[1];
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(state$1, new EndOfInput())
        );
      }
    }
  );
}
function take_map(expecting, f) {
  return new Parser(
    (state) => {
      let $ = next(state);
      let tok = $[0];
      let next_state = $[1];
      let $1 = then$(tok, f);
      if (tok instanceof Some) {
        if ($1 instanceof Some) {
          let a2 = $1[0];
          return new Cont(new CanBacktrack(false), a2, next_state);
        } else {
          let tok$1 = tok[0];
          return new Fail(
            new CanBacktrack(false),
            bag_from_state(next_state, new Expected(expecting, tok$1))
          );
        }
      } else {
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(next_state, new EndOfInput())
        );
      }
    }
  );
}
function to_deadends(loop$bag, loop$acc) {
  while (true) {
    let bag = loop$bag;
    let acc = loop$acc;
    if (bag instanceof Empty3) {
      return acc;
    } else if (bag instanceof Cons) {
      let $ = bag[0];
      if ($ instanceof Empty3) {
        let deadend = bag[1];
        return prepend(deadend, acc);
      } else {
        let bag$1 = $;
        let deadend = bag[1];
        loop$bag = bag$1;
        loop$acc = prepend(deadend, acc);
      }
    } else {
      let left = bag[0];
      let right = bag[1];
      loop$bag = left;
      loop$acc = to_deadends(right, acc);
    }
  }
}
function run2(src2, parser2) {
  let init = new State2(from_list2(src2), 0, new Span(1, 1, 1, 1), toList([]));
  let $ = runwrap(init, parser2);
  if ($ instanceof Cont) {
    let a2 = $[1];
    return new Ok(a2);
  } else {
    let bag = $[1];
    return new Error(to_deadends(bag, toList([])));
  }
}
function add_bag_to_step(step, left) {
  if (step instanceof Cont) {
    let can_backtrack = step[0];
    let a2 = step[1];
    let state = step[2];
    return new Cont(can_backtrack, a2, state);
  } else {
    let can_backtrack = step[0];
    let right = step[1];
    return new Fail(can_backtrack, new Append(left, right));
  }
}
function one_of2(parsers) {
  return new Parser(
    (state) => {
      let init = new Fail(new CanBacktrack(false), new Empty3());
      return fold_until(
        parsers,
        init,
        (result, next2) => {
          if (result instanceof Cont) {
            return new Stop(result);
          } else {
            let $ = result[0][0];
            if ($) {
              return new Stop(result);
            } else {
              let bag = result[1];
              let _pipe = runwrap(state, next2);
              let _pipe$1 = add_bag_to_step(_pipe, bag);
              return new Continue(_pipe$1);
            }
          }
        }
      );
    }
  );
}
function optional(parser2) {
  return one_of2(
    toList([
      map9(parser2, (var0) => {
        return new Some(var0);
      }),
      return$(new None())
    ])
  );
}

// build/dev/javascript/gleaxml/gleaxml/lexer.mjs
var TagOpen = class extends CustomType {
  constructor(name2) {
    super();
    this.name = name2;
  }
};
var TagClose = class extends CustomType {
};
var TagSelfClose = class extends CustomType {
};
var TagEnd = class extends CustomType {
  constructor(name2) {
    super();
    this.name = name2;
  }
};
var Text = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Equals = class extends CustomType {
};
var CommentStart = class extends CustomType {
};
var CommentEnd = class extends CustomType {
};
var Quote = class extends CustomType {
  constructor(quote) {
    super();
    this.quote = quote;
  }
};
var CDATAOpen = class extends CustomType {
};
var CDATAClose = class extends CustomType {
};
var ReferenceStart = class extends CustomType {
};
var ReferenceName = class extends CustomType {
  constructor(name2) {
    super();
    this.name = name2;
  }
};
var ReferenceCode = class extends CustomType {
  constructor(code) {
    super();
    this.code = code;
  }
};
var ReferenceHexCode = class extends CustomType {
  constructor(code) {
    super();
    this.code = code;
  }
};
var ReferenceEnd = class extends CustomType {
};
var XmlDeclarationStart = class extends CustomType {
};
var XmlDeclarationEnd = class extends CustomType {
};
var StartTag = class extends CustomType {
};
var EndTag = class extends CustomType {
};
var Content = class extends CustomType {
};
var Comment = class extends CustomType {
};
var AttrValue = class extends CustomType {
  constructor(quote, parent) {
    super();
    this.quote = quote;
    this.parent = parent;
  }
};
var CDATA = class extends CustomType {
};
var Reference = class extends CustomType {
  constructor(parent) {
    super();
    this.parent = parent;
  }
};
var XmlDecl = class extends CustomType {
};
function print_token(tok) {
  if (tok instanceof TagOpen) {
    let name2 = tok.name;
    return "<" + name2;
  } else if (tok instanceof TagClose) {
    return ">";
  } else if (tok instanceof TagSelfClose) {
    return "/>";
  } else if (tok instanceof TagEnd) {
    let name2 = tok.name;
    return "</" + name2;
  } else if (tok instanceof Text) {
    let s = tok[0];
    return s;
  } else if (tok instanceof Equals) {
    return "=";
  } else if (tok instanceof CommentStart) {
    return "<!--";
  } else if (tok instanceof CommentEnd) {
    return "-->";
  } else if (tok instanceof Quote) {
    let quote = tok.quote;
    return quote;
  } else if (tok instanceof CDATAOpen) {
    return "<![CDATA[";
  } else if (tok instanceof CDATAClose) {
    return "]]>";
  } else if (tok instanceof ReferenceStart) {
    return "&";
  } else if (tok instanceof ReferenceName) {
    let name2 = tok.name;
    return name2;
  } else if (tok instanceof ReferenceCode) {
    let code = tok.code;
    return "#" + code;
  } else if (tok instanceof ReferenceHexCode) {
    let code = tok.code;
    return "#x" + code;
  } else if (tok instanceof ReferenceEnd) {
    return ";";
  } else if (tok instanceof XmlDeclarationStart) {
    return "<?xml";
  } else {
    return "?>";
  }
}
function name_with_prefix(prefix) {
  return identifier(
    prefix + "[a-zA-Z:_]",
    "[a-zA-Z0-9:_\\-\\.]",
    new$4(),
    (s) => {
      let _pipe = s;
      return drop_start(_pipe, string_length(prefix));
    }
  );
}
function lexer() {
  return advanced(
    (mode) => {
      if (mode instanceof StartTag) {
        return toList([
          token2("=", new Equals()),
          (() => {
            let _pipe = token2("/>", new TagSelfClose());
            return into(_pipe, (_) => {
              return new Content();
            });
          })(),
          (() => {
            let _pipe = token2(">", new TagClose());
            return into(_pipe, (_) => {
              return new Content();
            });
          })(),
          (() => {
            let _pipe = token2("'", new Quote("'"));
            return into(
              _pipe,
              (_capture) => {
                return new AttrValue("'", _capture);
              }
            );
          })(),
          (() => {
            let _pipe = token2('"', new Quote('"'));
            return into(
              _pipe,
              (_capture) => {
                return new AttrValue('"', _capture);
              }
            );
          })(),
          (() => {
            let _pipe = name_matcher();
            return map8(_pipe, (name2) => {
              return new Text(name2);
            });
          })(),
          (() => {
            let _pipe = token2("\n", void 0);
            return ignore(_pipe);
          })(),
          (() => {
            let _pipe = token2("\r", void 0);
            return ignore(_pipe);
          })(),
          (() => {
            let _pipe = whitespace(void 0);
            return ignore(_pipe);
          })()
        ]);
      } else if (mode instanceof EndTag) {
        return toList([
          (() => {
            let _pipe = token2(">", new TagClose());
            return into(_pipe, (_) => {
              return new Content();
            });
          })(),
          (() => {
            let _pipe = token2("\n", void 0);
            return ignore(_pipe);
          })(),
          (() => {
            let _pipe = whitespace(void 0);
            return ignore(_pipe);
          })()
        ]);
      } else if (mode instanceof Content) {
        return toList([
          (() => {
            let _pipe = token2("<!--", new CommentStart());
            return into(_pipe, (_) => {
              return new Comment();
            });
          })(),
          (() => {
            let _pipe = token2("<![CDATA[", new CDATAOpen());
            return into(_pipe, (_) => {
              return new CDATA();
            });
          })(),
          (() => {
            let _pipe = name_with_prefix("</");
            let _pipe$1 = map8(
              _pipe,
              (name2) => {
                return new TagEnd(name2);
              }
            );
            return into(_pipe$1, (_) => {
              return new EndTag();
            });
          })(),
          (() => {
            let _pipe = name_with_prefix("<");
            let _pipe$1 = map8(
              _pipe,
              (name2) => {
                return new TagOpen(name2);
              }
            );
            return into(_pipe$1, (_) => {
              return new StartTag();
            });
          })(),
          (() => {
            let _pipe = token2("<?xml", new XmlDeclarationStart());
            return into(_pipe, (_) => {
              return new XmlDecl();
            });
          })(),
          identifier(
            "[\\r]?[\\n]",
            "[\\s]",
            new$4(),
            (_) => {
              return new Text(" ");
            }
          ),
          whitespace(new Text(" ")),
          identifier(
            "[^<&]",
            "[^<&\\n]",
            new$4(),
            (var0) => {
              return new Text(var0);
            }
          ),
          (() => {
            let _pipe = token2("&", new ReferenceStart());
            return into(_pipe, (var0) => {
              return new Reference(var0);
            });
          })()
        ]);
      } else if (mode instanceof Comment) {
        return toList([
          (() => {
            let _pipe = token2("-->", new CommentEnd());
            return into(_pipe, (_) => {
              return new Content();
            });
          })(),
          identifier(
            "[^\\-]",
            "[^\\-]",
            new$4(),
            (var0) => {
              return new Text(var0);
            }
          ),
          keyword("-", "[^-]", new Text("-"))
        ]);
      } else if (mode instanceof AttrValue) {
        let quote = mode.quote;
        let parent = mode.parent;
        return toList([
          identifier(
            "[^<&" + quote + "]",
            "[^<&" + quote + "]",
            new$4(),
            (var0) => {
              return new Text(var0);
            }
          ),
          (() => {
            let _pipe = token2(quote, new Quote(quote));
            return into(_pipe, (_) => {
              return parent;
            });
          })(),
          (() => {
            let _pipe = token2("&", new ReferenceStart());
            return into(_pipe, (var0) => {
              return new Reference(var0);
            });
          })()
        ]);
      } else if (mode instanceof CDATA) {
        return toList([
          (() => {
            let _pipe = token2("]]>", new CDATAClose());
            return into(_pipe, (_) => {
              return new Content();
            });
          })(),
          identifier(
            "[^\\]]",
            "[^\\]]",
            new$4(),
            (var0) => {
              return new Text(var0);
            }
          ),
          identifier(
            "\\]",
            "[\\]>]",
            from_list3(toList(["]]>"])),
            (var0) => {
              return new Text(var0);
            }
          )
        ]);
      } else if (mode instanceof Reference) {
        let parent = mode.parent;
        return toList([
          identifier(
            "#x[a-fA-F0-9]",
            "[a-fA-F0-9]",
            new$4(),
            (s) => {
              return new ReferenceHexCode(
                (() => {
                  let _pipe = s;
                  return drop_start(_pipe, 2);
                })()
              );
            }
          ),
          identifier(
            "#[0-9]",
            "[0-9]",
            new$4(),
            (s) => {
              return new ReferenceCode(
                (() => {
                  let _pipe = s;
                  return drop_start(_pipe, 1);
                })()
              );
            }
          ),
          identifier(
            "[a-zA-Z_:]",
            "[a-zA-Z_:0-9.\\-]",
            new$4(),
            (var0) => {
              return new ReferenceName(var0);
            }
          ),
          (() => {
            let _pipe = token2(";", new ReferenceEnd());
            return into(_pipe, (_) => {
              return parent;
            });
          })()
        ]);
      } else {
        return toList([
          token2("=", new Equals()),
          (() => {
            let _pipe = token2("?>", new XmlDeclarationEnd());
            return into(_pipe, (_) => {
              return new Content();
            });
          })(),
          (() => {
            let _pipe = token2("'", new Quote("'"));
            return into(
              _pipe,
              (_capture) => {
                return new AttrValue("'", _capture);
              }
            );
          })(),
          (() => {
            let _pipe = token2('"', new Quote('"'));
            return into(
              _pipe,
              (_capture) => {
                return new AttrValue('"', _capture);
              }
            );
          })(),
          (() => {
            let _pipe = name_matcher();
            return map8(_pipe, (name2) => {
              return new Text(name2);
            });
          })(),
          (() => {
            let _pipe = token2("\n", void 0);
            return ignore(_pipe);
          })(),
          (() => {
            let _pipe = token2("\r", void 0);
            return ignore(_pipe);
          })(),
          (() => {
            let _pipe = whitespace(void 0);
            return ignore(_pipe);
          })()
        ]);
      }
    }
  );
}
function name_matcher() {
  return identifier(
    "[a-zA-Z:_]",
    "[a-zA-Z0-9:_\\-\\.]",
    new$4(),
    (s) => {
      return s;
    }
  );
}
function get_tokens(input2) {
  return run_advanced(input2, new Content(), lexer());
}

// build/dev/javascript/gleaxml/gleaxml/parser.mjs
var XmlDocument = class extends CustomType {
  constructor(version, encoding, standalone, root_element) {
    super();
    this.version = version;
    this.encoding = encoding;
    this.standalone = standalone;
    this.root_element = root_element;
  }
};
var Element = class extends CustomType {
  constructor(name2, attrs, children2) {
    super();
    this.name = name2;
    this.attrs = attrs;
    this.children = children2;
  }
};
var Text2 = class extends CustomType {
  constructor(content2) {
    super();
    this.content = content2;
  }
};
var Comment2 = class extends CustomType {
  constructor(content2) {
    super();
    this.content = content2;
  }
};
function tag_open() {
  return take_map(
    "an opening tag",
    (tok) => {
      if (tok instanceof TagOpen) {
        let name2 = tok.name;
        return new Some(name2);
      } else {
        return new None();
      }
    }
  );
}
function text_content() {
  return take_map(
    "text content",
    (tok) => {
      if (tok instanceof Text) {
        let content2 = tok[0];
        return new Some(content2);
      } else {
        return new None();
      }
    }
  );
}
function reference() {
  return do$(
    token3(new ReferenceStart()),
    (_) => {
      return do$(
        take_map(
          "a reference",
          (tok) => {
            if (tok instanceof ReferenceName) {
              let $ = tok.name;
              if ($ === "amp") {
                return new Some("&");
              } else if ($ === "quot") {
                return new Some('"');
              } else if ($ === "apos") {
                return new Some("'");
              } else if ($ === "lt") {
                return new Some("<");
              } else if ($ === "gt") {
                return new Some(">");
              } else {
                let name2 = $;
                return new Some("&" + name2 + ";");
              }
            } else if (tok instanceof ReferenceCode) {
              let code = tok.code;
              let _pipe = code;
              let _pipe$1 = base_parse(_pipe, 10);
              let _pipe$2 = try$(_pipe$1, utf_codepoint);
              let _pipe$3 = map4(
                _pipe$2,
                (code2) => {
                  let _pipe$32 = utf_codepoint_list_to_string(toList([code2]));
                  return new Some(_pipe$32);
                }
              );
              return unwrap2(_pipe$3, new None());
            } else if (tok instanceof ReferenceHexCode) {
              let code = tok.code;
              let _pipe = code;
              let _pipe$1 = base_parse(_pipe, 16);
              let _pipe$2 = try$(_pipe$1, utf_codepoint);
              let _pipe$3 = map4(
                _pipe$2,
                (code2) => {
                  let _pipe$32 = utf_codepoint_list_to_string(toList([code2]));
                  return new Some(_pipe$32);
                }
              );
              return unwrap2(_pipe$3, new None());
            } else {
              return new None();
            }
          }
        ),
        (reftext) => {
          return do$(
            token3(new ReferenceEnd()),
            (_2) => {
              return return$(reftext);
            }
          );
        }
      );
    }
  );
}
function text() {
  let _pipe = loop(
    toList([]),
    (texts) => {
      return do$(
        optional(one_of2(toList([text_content(), reference()]))),
        (s) => {
          if (s instanceof Some) {
            let t = s[0];
            let _pipe2 = new Continue2(prepend(t, texts));
            return return$(_pipe2);
          } else if (texts instanceof Empty) {
            return fail("No text");
          } else {
            let _pipe2 = new Break(
              (() => {
                let _pipe3 = texts;
                return reverse(_pipe3);
              })()
            );
            return return$(_pipe2);
          }
        }
      );
    }
  );
  return then$2(
    _pipe,
    (texts) => {
      let _block;
      let _pipe$1 = texts;
      _block = join(_pipe$1, "");
      let content2 = _block;
      return return$(new Text2(content2));
    }
  );
}
function self_closing_tag() {
  return do$(
    token3(new TagSelfClose()),
    (_) => {
      return return$(toList([]));
    }
  );
}
function attribute_name() {
  return take_map(
    "an attribute name",
    (tok) => {
      if (tok instanceof Text) {
        let name2 = tok[0];
        return new Some(name2);
      } else {
        return new None();
      }
    }
  );
}
function attribute_value() {
  return do$(
    one_of2(
      toList([
        (() => {
          let _pipe = token3(new Quote("'"));
          return replace3(_pipe, "'");
        })(),
        (() => {
          let _pipe = token3(new Quote('"'));
          return replace3(_pipe, '"');
        })()
      ])
    ),
    (start_quote) => {
      return do$(
        take_map(
          "an attribute value",
          (tok) => {
            if (tok instanceof Text) {
              let v = tok[0];
              return new Some(v);
            } else {
              return new None();
            }
          }
        ),
        (value2) => {
          return do$(
            one_of2(
              toList([
                (() => {
                  let _pipe = token3(new Quote("'"));
                  return replace3(_pipe, "'");
                })(),
                (() => {
                  let _pipe = token3(new Quote('"'));
                  return replace3(_pipe, '"');
                })()
              ])
            ),
            (end_quote) => {
              let $ = start_quote === end_quote;
              if ($) {
                return return$(value2);
              } else {
                return fail(
                  "Expected " + start_quote + ", got " + end_quote
                );
              }
            }
          );
        }
      );
    }
  );
}
function attribute() {
  return do$(
    attribute_name(),
    (name2) => {
      return do$(
        token3(new Equals()),
        (_) => {
          return do$(
            attribute_value(),
            (value2) => {
              return return$([name2, value2]);
            }
          );
        }
      );
    }
  );
}
function attributes() {
  return loop(
    new_map(),
    (state) => {
      return do$(
        optional(attribute()),
        (attr) => {
          if (attr instanceof Some) {
            let a2 = attr[0];
            let $ = has_key(state, a2[0]);
            if ($) {
              return fail("Duplicate attribute name: " + a2[0]);
            } else {
              let _pipe = new Continue2(
                (() => {
                  let _pipe2 = state;
                  return insert(_pipe2, a2[0], a2[1]);
                })()
              );
              return return$(_pipe);
            }
          } else {
            let _pipe = new Break(state);
            return return$(_pipe);
          }
        }
      );
    }
  );
}
function tag_end(name2) {
  return do$(
    take_while((t) => {
      return isEqual(t, new Text(" "));
    }),
    (_) => {
      return do$(
        token3(new TagEnd(name2)),
        (_2) => {
          return do$(
            token3(new TagClose()),
            (_3) => {
              return return$(void 0);
            }
          );
        }
      );
    }
  );
}
function comment() {
  return do$(
    token3(new CommentStart()),
    (_) => {
      return do$(
        take_map_while(
          (tok) => {
            if (tok instanceof Text) {
              let v = tok[0];
              return new Some(v);
            } else {
              return new None();
            }
          }
        ),
        (values2) => {
          return do$(
            token3(new CommentEnd()),
            (_2) => {
              return return$(new Comment2(join(values2, "")));
            }
          );
        }
      );
    }
  );
}
function cdata() {
  return do$(
    token3(new CDATAOpen()),
    (_) => {
      return do$(
        take_map_while(
          (tok) => {
            if (tok instanceof Text) {
              let v = tok[0];
              return new Some(v);
            } else {
              return new None();
            }
          }
        ),
        (values2) => {
          return do$(
            token3(new CDATAClose()),
            (_2) => {
              return return$(new Text2(join(values2, "")));
            }
          );
        }
      );
    }
  );
}
function pop_attr(attrs, attr) {
  let $ = key_pop(attrs, attr);
  if ($ instanceof Ok) {
    let value2 = $[0][0];
    let new_attrs = $[0][1];
    return [new Some(value2), new_attrs];
  } else {
    return [new None(), attrs];
  }
}
function xml_declaration() {
  return do$(
    token3(new XmlDeclarationStart()),
    (_) => {
      return do$(
        attributes(),
        (attrs) => {
          return do$(
            token3(new XmlDeclarationEnd()),
            (_2) => {
              let attr_list = map_to_list(attrs);
              let $ = pop_attr(attr_list, "version");
              let version = $[0];
              let attr_list$1 = $[1];
              let $1 = pop_attr(attr_list$1, "encoding");
              let encoding = $1[0];
              let attr_list$2 = $1[1];
              let $2 = pop_attr(attr_list$2, "standalone");
              let standalone = $2[0];
              let attr_list$3 = $2[1];
              if (version instanceof Some) {
                if (attr_list$3 instanceof Empty) {
                  let v = version[0];
                  return return$(
                    [
                      v,
                      encoding,
                      (() => {
                        let _pipe = standalone;
                        return map(
                          _pipe,
                          (s) => {
                            return s === "yes";
                          }
                        );
                      })()
                    ]
                  );
                } else {
                  let el = attr_list$3.head;
                  return fail("Incorrect attribute: " + el[0]);
                }
              } else {
                return fail("Version is required");
              }
            }
          );
        }
      );
    }
  );
}
function children() {
  return loop(
    toList([]),
    (state) => {
      return do$(
        optional(
          one_of2(toList([tag(), text(), comment(), cdata()]))
        ),
        (el) => {
          if (el instanceof Some) {
            let a2 = el[0];
            let _pipe = new Continue2(prepend(a2, state));
            return return$(_pipe);
          } else {
            let _pipe = new Break(
              (() => {
                let _pipe2 = state;
                return reverse(_pipe2);
              })()
            );
            return return$(_pipe);
          }
        }
      );
    }
  );
}
function tag() {
  return do$(
    tag_open(),
    (name2) => {
      return do$(
        attributes(),
        (attrs) => {
          return do$(
            one_of2(toList([simple_tag(name2), self_closing_tag()])),
            (children2) => {
              return return$(new Element(name2, attrs, children2));
            }
          );
        }
      );
    }
  );
}
function simple_tag(name2) {
  return do$(
    token3(new TagClose()),
    (_) => {
      return do$(
        children(),
        (children2) => {
          return do$(
            tag_end(name2),
            (_2) => {
              return return$(children2);
            }
          );
        }
      );
    }
  );
}
function parser() {
  return do$(
    take_while((t) => {
      return isEqual(t, new Text(" "));
    }),
    (_) => {
      return do$(
        optional(xml_declaration()),
        (xml_decl_info) => {
          return do$(
            take_while(
              (t) => {
                return isEqual(t, new Text(" "));
              }
            ),
            (_2) => {
              return do$(
                tag(),
                (node) => {
                  return do$(
                    take_while(
                      (t) => {
                        return isEqual(t, new Text(" "));
                      }
                    ),
                    (_3) => {
                      if (xml_decl_info instanceof Some) {
                        let v = xml_decl_info[0][0];
                        let e = xml_decl_info[0][1];
                        let s = xml_decl_info[0][2];
                        return return$(
                          new XmlDocument(
                            v,
                            (() => {
                              let _pipe = e;
                              return unwrap(_pipe, "UTF-8");
                            })(),
                            (() => {
                              let _pipe = s;
                              return unwrap(_pipe, true);
                            })(),
                            node
                          )
                        );
                      } else {
                        return return$(
                          new XmlDocument("1.0", "UTF-8", true, node)
                        );
                      }
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function parse3(tokens) {
  return run2(tokens, parser());
}

// build/dev/javascript/gleaxml/gleaxml.mjs
function print_lexer_error(err) {
  let row = err.row;
  let col = err.col;
  let lexeme = err.lexeme;
  return "Lexer error at row " + (() => {
    let _pipe = row;
    return to_string(_pipe);
  })() + ", column " + (() => {
    let _pipe = col;
    return to_string(_pipe);
  })() + ": No match found for '" + lexeme + "'";
}
function print_nibble_error(err) {
  if (err instanceof BadParser) {
    let parser2 = err[0];
    return "Bad parser: " + parser2;
  } else if (err instanceof Custom) {
    let err$1 = err[0];
    return err$1;
  } else if (err instanceof EndOfInput) {
    return "Unexpected end of input";
  } else if (err instanceof Expected) {
    let expected = err[0];
    let got = err.got;
    return "Expected " + expected + ", got " + print_token(got);
  } else {
    let unexpected = err[0];
    return "Unexpected token: " + print_token(unexpected);
  }
}
function print_parser_error(errs) {
  let _pipe = map2(
    errs,
    (deadend) => {
      return "Parser error at position " + (() => {
        let _pipe2 = deadend.pos.row_start;
        return to_string(_pipe2);
      })() + ":" + (() => {
        let _pipe2 = deadend.pos.col_start;
        return to_string(_pipe2);
      })() + ": " + print_nibble_error(deadend.problem);
    }
  );
  return join(_pipe, "\n");
}
function parse4(input2) {
  return try$(
    (() => {
      let _pipe = get_tokens(input2);
      return map_error(_pipe, print_lexer_error);
    })(),
    (tokens) => {
      return try$(
        (() => {
          let _pipe = parse3(tokens);
          return map_error(_pipe, print_parser_error);
        })(),
        (xml_node) => {
          return new Ok(xml_node);
        }
      );
    }
  );
}
function do_get_nodes(loop$path, loop$nodes) {
  while (true) {
    let path = loop$path;
    let nodes = loop$nodes;
    if (path instanceof Empty) {
      return nodes;
    } else {
      let $ = path.head;
      if ($ === "*") {
        let rest = path.tail;
        let _block;
        let _pipe = nodes;
        _block = flat_map(
          _pipe,
          (node) => {
            if (node instanceof Element) {
              let children3 = node.children;
              return children3;
            } else {
              return toList([]);
            }
          }
        );
        let children2 = _block;
        loop$path = rest;
        loop$nodes = children2;
      } else {
        let name2 = $;
        let rest = path.tail;
        let _block;
        let _pipe = nodes;
        _block = flat_map(
          _pipe,
          (node) => {
            if (node instanceof Element) {
              let children3 = node.children;
              let _pipe$1 = children3;
              return filter_map(
                _pipe$1,
                (child) => {
                  if (child instanceof Element) {
                    let n = child.name;
                    if (n === name2) {
                      return new Ok(child);
                    } else {
                      return new Error(void 0);
                    }
                  } else {
                    return new Error(void 0);
                  }
                }
              );
            } else {
              return toList([]);
            }
          }
        );
        let children2 = _block;
        loop$path = rest;
        loop$nodes = children2;
      }
    }
  }
}
function get_nodes(root2, path) {
  if (root2 instanceof Element) {
    if (path instanceof Empty) {
      return toList([]);
    } else {
      let n = root2.name;
      let name2 = path.head;
      if (n === name2) {
        let rest = path.tail;
        return do_get_nodes(rest, toList([root2]));
      } else {
        return toList([]);
      }
    }
  } else {
    return toList([]);
  }
}
function get_node(root2, path) {
  let nodes = get_nodes(root2, path);
  if (nodes instanceof Empty) {
    return new Error("No node found at path " + join(path, "/"));
  } else {
    let node = nodes.head;
    return new Ok(node);
  }
}
function get_attribute(node, name2) {
  if (node instanceof Element) {
    let attrs = node.attrs;
    let _pipe = attrs;
    let _pipe$1 = map_get(_pipe, name2);
    return replace_error(_pipe$1, "No attribute with name " + name2);
  } else {
    return new Error("Node is not an element");
  }
}
function get_texts(node) {
  if (node instanceof Element) {
    let children2 = node.children;
    let _pipe = children2;
    return filter_map(
      _pipe,
      (child) => {
        if (child instanceof Text2) {
          let content2 = child.content;
          return new Ok(content2);
        } else {
          return new Error(void 0);
        }
      }
    );
  } else {
    return toList([]);
  }
}
function get_nonempty_texts(node) {
  let _pipe = get_texts(node);
  return filter(_pipe, (text5) => {
    return trim(text5) !== "";
  });
}

// build/dev/javascript/glisse/glisse.mjs
var RssDocument = class extends CustomType {
  constructor(version, channel) {
    super();
    this.version = version;
    this.channel = channel;
  }
};
var RssChannel = class extends CustomType {
  constructor(title2, link, description, language, copyright, managing_editor, web_master, pub_date, last_build_date, category, generator, docs, cloud, ttl, image, rating, text_input, skip_hours, skip_days, items) {
    super();
    this.title = title2;
    this.link = link;
    this.description = description;
    this.language = language;
    this.copyright = copyright;
    this.managing_editor = managing_editor;
    this.web_master = web_master;
    this.pub_date = pub_date;
    this.last_build_date = last_build_date;
    this.category = category;
    this.generator = generator;
    this.docs = docs;
    this.cloud = cloud;
    this.ttl = ttl;
    this.image = image;
    this.rating = rating;
    this.text_input = text_input;
    this.skip_hours = skip_hours;
    this.skip_days = skip_days;
    this.items = items;
  }
};
var RssCloud = class extends CustomType {
  constructor(domain, port, path, register_procedure, protocol) {
    super();
    this.domain = domain;
    this.port = port;
    this.path = path;
    this.register_procedure = register_procedure;
    this.protocol = protocol;
  }
};
var RssImage = class extends CustomType {
  constructor(url, title2, link, width, height, description) {
    super();
    this.url = url;
    this.title = title2;
    this.link = link;
    this.width = width;
    this.height = height;
    this.description = description;
  }
};
var RssTextInput = class extends CustomType {
  constructor(title2, description, name2, link) {
    super();
    this.title = title2;
    this.description = description;
    this.name = name2;
    this.link = link;
  }
};
var RssItem = class extends CustomType {
  constructor(title2, link, description, author, category, comments, enclosure, guid, pub_date, source) {
    super();
    this.title = title2;
    this.link = link;
    this.description = description;
    this.author = author;
    this.category = category;
    this.comments = comments;
    this.enclosure = enclosure;
    this.guid = guid;
    this.pub_date = pub_date;
    this.source = source;
  }
};
function parse_cloud(node) {
  return try$(
    get_attribute(node, "domain"),
    (domain) => {
      return try$(
        get_attribute(node, "port"),
        (port_str) => {
          return try$(
            get_attribute(node, "path"),
            (path) => {
              return try$(
                get_attribute(node, "registerProcedure"),
                (register_procedure) => {
                  return try$(
                    get_attribute(node, "protocol"),
                    (protocol) => {
                      return try$(
                        (() => {
                          let _pipe = parse_int(port_str);
                          return replace_error(
                            _pipe,
                            "Invalid port number"
                          );
                        })(),
                        (port) => {
                          return new Ok(
                            new RssCloud(
                              domain,
                              port,
                              path,
                              register_procedure,
                              protocol
                            )
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function parse_ttl(node) {
  let _pipe = get_nonempty_texts(node);
  let _pipe$1 = join(_pipe, "");
  let _pipe$2 = parse_int(_pipe$1);
  return replace_error(_pipe$2, "Invalid TTL value");
}
function get_required_text(node, path) {
  let _pipe = get_node(node, path);
  let _pipe$1 = map4(_pipe, get_nonempty_texts);
  return map4(
    _pipe$1,
    (_capture) => {
      return join(_capture, " ");
    }
  );
}
function parse_text_input(node) {
  return try$(
    get_required_text(node, toList(["textInput", "title"])),
    (title2) => {
      return try$(
        get_required_text(node, toList(["textInput", "description"])),
        (description) => {
          return try$(
            get_required_text(node, toList(["textInput", "name"])),
            (name2) => {
              return try$(
                get_required_text(node, toList(["textInput", "link"])),
                (link) => {
                  return new Ok(
                    new RssTextInput(title2, description, name2, link)
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function get_optional_text(node, path) {
  let _pipe = get_node(node, path);
  let _pipe$1 = from_result(_pipe);
  let _pipe$2 = map(_pipe$1, get_nonempty_texts);
  return map(
    _pipe$2,
    (_capture) => {
      return join(_capture, " ");
    }
  );
}
function parse_image(node) {
  return try$(
    get_required_text(node, toList(["image", "url"])),
    (url) => {
      return try$(
        get_required_text(node, toList(["image", "title"])),
        (title2) => {
          return try$(
            get_required_text(node, toList(["image", "link"])),
            (link) => {
              let _block;
              let _pipe = get_required_text(node, toList(["image", "width"]));
              let _pipe$1 = replace_error(_pipe, void 0);
              let _pipe$2 = try$(_pipe$1, parse_int);
              _block = from_result(_pipe$2);
              let width = _block;
              let _block$1;
              let _pipe$3 = get_required_text(node, toList(["image", "height"]));
              let _pipe$4 = replace_error(_pipe$3, void 0);
              let _pipe$5 = try$(_pipe$4, parse_int);
              _block$1 = from_result(_pipe$5);
              let height = _block$1;
              let description = get_optional_text(
                node,
                toList(["image", "description"])
              );
              return new Ok(
                new RssImage(url, title2, link, width, height, description)
              );
            }
          );
        }
      );
    }
  );
}
function parse_item(item) {
  let title2 = get_optional_text(item, toList(["item", "title"]));
  let link = get_optional_text(item, toList(["item", "link"]));
  let description = get_optional_text(item, toList(["item", "description"]));
  let author = get_optional_text(item, toList(["item", "author"]));
  let category = toList([]);
  let comments = get_optional_text(item, toList(["item", "comments"]));
  let enclosure = new None();
  let guid = new None();
  let pub_date = get_optional_text(item, toList(["item", "pubDate"]));
  let source = new None();
  if (description instanceof None) {
    if (title2 instanceof None) {
      return new Error("Item must have at least a title or description");
    } else {
      return new Ok(
        new RssItem(
          title2,
          link,
          description,
          author,
          category,
          comments,
          enclosure,
          guid,
          pub_date,
          source
        )
      );
    }
  } else {
    return new Ok(
      new RssItem(
        title2,
        link,
        description,
        author,
        category,
        comments,
        enclosure,
        guid,
        pub_date,
        source
      )
    );
  }
}
function parse_channel(chan) {
  return try$(
    get_required_text(chan, toList(["channel", "title"])),
    (title2) => {
      return try$(
        get_required_text(chan, toList(["channel", "link"])),
        (link) => {
          return try$(
            get_required_text(chan, toList(["channel", "description"])),
            (description) => {
              let language = get_optional_text(
                chan,
                toList(["channel", "language"])
              );
              let copyright = get_optional_text(
                chan,
                toList(["channel", "copyright"])
              );
              let managing_editor = get_optional_text(
                chan,
                toList(["channel", "managingEditor"])
              );
              let web_master = get_optional_text(
                chan,
                toList(["channel", "webMaster"])
              );
              let pub_date = get_optional_text(
                chan,
                toList(["channel", "pubDate"])
              );
              let last_build_date = get_optional_text(
                chan,
                toList(["channel", "lastBuildDate"])
              );
              let category = get_optional_text(
                chan,
                toList(["channel", "category"])
              );
              let generator = get_optional_text(
                chan,
                toList(["channel", "generator"])
              );
              let docs = get_optional_text(chan, toList(["channel", "docs"]));
              let _block;
              let _pipe = get_node(chan, toList(["channel", "cloud"]));
              let _pipe$1 = try$(_pipe, parse_cloud);
              _block = from_result(_pipe$1);
              let cloud = _block;
              let _block$1;
              let _pipe$2 = get_node(chan, toList(["channel", "ttl"]));
              let _pipe$3 = try$(_pipe$2, parse_ttl);
              _block$1 = from_result(_pipe$3);
              let ttl = _block$1;
              let _block$2;
              let _pipe$4 = get_node(
                chan,
                toList(["channel", "image"])
              );
              let _pipe$5 = try$(_pipe$4, parse_image);
              _block$2 = from_result(_pipe$5);
              let image = _block$2;
              let rating = get_optional_text(
                chan,
                toList(["channel", "rating"])
              );
              let _block$3;
              let _pipe$6 = get_node(
                chan,
                toList(["channel", "textInput"])
              );
              let _pipe$7 = try$(_pipe$6, parse_text_input);
              _block$3 = from_result(_pipe$7);
              let text_input = _block$3;
              let _block$4;
              let _pipe$8 = get_nodes(
                chan,
                toList(["channel", "skipHours", "hour"])
              );
              let _pipe$9 = flat_map(_pipe$8, get_nonempty_texts);
              _block$4 = filter_map(_pipe$9, parse_int);
              let skip_hours = _block$4;
              let _block$5;
              let _pipe$10 = get_nodes(
                chan,
                toList(["channel", "skipDays", "day"])
              );
              _block$5 = flat_map(_pipe$10, get_nonempty_texts);
              let skip_days = _block$5;
              let _block$6;
              let _pipe$11 = get_nodes(
                chan,
                toList(["channel", "item"])
              );
              _block$6 = filter_map(_pipe$11, parse_item);
              let items = _block$6;
              return new Ok(
                new RssChannel(
                  title2,
                  link,
                  description,
                  language,
                  copyright,
                  managing_editor,
                  web_master,
                  pub_date,
                  last_build_date,
                  category,
                  generator,
                  docs,
                  cloud,
                  ttl,
                  image,
                  rating,
                  text_input,
                  skip_hours,
                  skip_days,
                  items
                )
              );
            }
          );
        }
      );
    }
  );
}
function parse_doc(doc) {
  return try$(
    get_node(doc.root_element, toList(["rss", "channel"])),
    (chan) => {
      return try$(
        get_attribute(doc.root_element, "version"),
        (version) => {
          return try$(
            parse_channel(chan),
            (channel) => {
              return new Ok(new RssDocument(version, channel));
            }
          );
        }
      );
    }
  );
}
function parse_rss(xml) {
  return try$(
    parse4(xml),
    (xml_doc) => {
      return try$(
        parse_doc(xml_doc),
        (rss_doc) => {
          return new Ok(rss_doc);
        }
      );
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}

// build/dev/javascript/houdini/houdini.ffi.mjs
function do_escape(string5) {
  return string5.replaceAll(/[><&"']/g, (replaced) => {
    switch (replaced) {
      case ">":
        return "&gt;";
      case "<":
        return "&lt;";
      case "'":
        return "&#39;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return replaced;
    }
  });
}

// build/dev/javascript/houdini/houdini/internal/escape_js.mjs
function escape(text5) {
  return do_escape(text5);
}

// build/dev/javascript/houdini/houdini.mjs
function escape2(string5) {
  return escape(string5);
}

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ new Gt();
var LT = /* @__PURE__ */ new Lt();
var EQ = /* @__PURE__ */ new Eq();
function compare3(a2, b) {
  if (a2.name === b.name) {
    return EQ;
  } else if (a2.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
var Attribute = class extends CustomType {
  constructor(kind, name2, value2) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value2;
  }
};
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes2 = loop$attributes;
    let merged = loop$merged;
    if (attributes2 instanceof Empty) {
      return merged;
    } else {
      let $ = attributes2.head;
      if ($ instanceof Attribute) {
        let $1 = $.name;
        if ($1 === "") {
          let rest = attributes2.tail;
          loop$attributes = rest;
          loop$merged = merged;
        } else if ($1 === "class") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes2.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes2.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "class") {
                  let kind = $.kind;
                  let class1 = $2;
                  let rest = $3.tail;
                  let class2 = $4.value;
                  let value2 = class1 + " " + class2;
                  let attribute$1 = new Attribute(kind, "class", value2);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else if ($1 === "style") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes2.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes2.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "style") {
                  let kind = $.kind;
                  let style1 = $2;
                  let rest = $3.tail;
                  let style22 = $4.value;
                  let value2 = style1 + ";" + style22;
                  let attribute$1 = new Attribute(kind, "style", value2);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else {
          let attribute$1 = $;
          let rest = attributes2.tail;
          loop$attributes = rest;
          loop$merged = prepend(attribute$1, merged);
        }
      } else {
        let attribute$1 = $;
        let rest = attributes2.tail;
        loop$attributes = rest;
        loop$merged = prepend(attribute$1, merged);
      }
    }
  }
}
function prepare(attributes2) {
  if (attributes2 instanceof Empty) {
    return attributes2;
  } else {
    let $ = attributes2.tail;
    if ($ instanceof Empty) {
      return attributes2;
    } else {
      let _pipe = attributes2;
      let _pipe$1 = sort(_pipe, (a2, b) => {
        return compare3(b, a2);
      });
      return merge(_pipe$1, empty_list);
    }
  }
}
var attribute_kind = 0;
function attribute2(name2, value2) {
  return new Attribute(attribute_kind, name2, value2);
}
function to_string_tree(key, namespace, attributes2) {
  let _block;
  let $ = key !== "";
  if ($) {
    _block = prepend(attribute2("data-lustre-key", key), attributes2);
  } else {
    _block = attributes2;
  }
  let attributes$1 = _block;
  let _block$1;
  let $1 = namespace !== "";
  if ($1) {
    _block$1 = prepend(attribute2("xmlns", namespace), attributes$1);
  } else {
    _block$1 = attributes$1;
  }
  let attributes$2 = _block$1;
  return fold2(
    attributes$2,
    new$(),
    (html2, attr) => {
      if (attr instanceof Attribute) {
        let $2 = attr.name;
        if ($2 === "virtual:defaultValue") {
          let value2 = attr.value;
          return append(
            html2,
            ' value="' + escape2(value2) + '"'
          );
        } else if ($2 === "") {
          return html2;
        } else {
          let $3 = attr.value;
          if ($3 === "") {
            let name2 = $2;
            return append(html2, " " + name2);
          } else {
            let name2 = $2;
            let value2 = $3;
            return append(
              html2,
              " " + name2 + '="' + escape2(value2) + '"'
            );
          }
        }
      } else {
        return html2;
      }
    }
  );
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute3(name2, value2) {
  return attribute2(name2, value2);
}
function class$(name2) {
  return attribute3("class", name2);
}
function id(value2) {
  return attribute3("id", value2);
}
function style(property3, value2) {
  if (property3 === "") {
    return class$("");
  } else if (value2 === "") {
    return class$("");
  } else {
    return attribute3("style", property3 + ":" + value2 + ";");
  }
}
function href(url) {
  return attribute3("href", url);
}
function src(url) {
  return attribute3("src", url);
}
function crossorigin(value2) {
  return attribute3("crossorigin", value2);
}
function action(url) {
  return attribute3("action", url);
}
function method(http_method) {
  return attribute3("method", http_method);
}
function name(element_name) {
  return attribute3("name", element_name);
}
function type_(control_type) {
  return attribute3("type", control_type);
}
function value(control_value) {
  return attribute3("value", control_value);
}
function content(value2) {
  return attribute3("content", value2);
}
function charset(value2) {
  return attribute3("charset", value2);
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty4() {
  return null;
}
function insert2(map10, key, value2) {
  map10 ??= /* @__PURE__ */ new Map();
  map10.set(key, value2);
  return map10;
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key, mapper, children2, keyed_children) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.children = children2;
    this.keyed_children = keyed_children;
  }
};
var Element2 = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag2, attributes2, children2, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag2;
    this.attributes = attributes2;
    this.children = children2;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Text3 = class extends CustomType {
  constructor(kind, key, mapper, content2) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.content = content2;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag2, attributes2, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag2;
    this.attributes = attributes2;
    this.inner_html = inner_html;
  }
};
function is_void_element(tag2, namespace) {
  if (namespace === "") {
    if (tag2 === "area") {
      return true;
    } else if (tag2 === "base") {
      return true;
    } else if (tag2 === "br") {
      return true;
    } else if (tag2 === "col") {
      return true;
    } else if (tag2 === "embed") {
      return true;
    } else if (tag2 === "hr") {
      return true;
    } else if (tag2 === "img") {
      return true;
    } else if (tag2 === "input") {
      return true;
    } else if (tag2 === "link") {
      return true;
    } else if (tag2 === "meta") {
      return true;
    } else if (tag2 === "param") {
      return true;
    } else if (tag2 === "source") {
      return true;
    } else if (tag2 === "track") {
      return true;
    } else if (tag2 === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function to_keyed(key, node) {
  if (node instanceof Fragment) {
    let _record = node;
    return new Fragment(
      _record.kind,
      key,
      _record.mapper,
      _record.children,
      _record.keyed_children
    );
  } else if (node instanceof Element2) {
    let _record = node;
    return new Element2(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.children,
      _record.keyed_children,
      _record.self_closing,
      _record.void
    );
  } else if (node instanceof Text3) {
    let _record = node;
    return new Text3(_record.kind, key, _record.mapper, _record.content);
  } else {
    let _record = node;
    return new UnsafeInnerHtml(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.inner_html
    );
  }
}
var element_kind = 1;
function element(key, mapper, namespace, tag2, attributes2, children2, keyed_children, self_closing, void$) {
  return new Element2(
    element_kind,
    key,
    mapper,
    namespace,
    tag2,
    prepare(attributes2),
    children2,
    keyed_children,
    self_closing,
    void$ || is_void_element(tag2, namespace)
  );
}
var text_kind = 2;
function text2(key, mapper, content2) {
  return new Text3(text_kind, key, mapper, content2);
}
var unsafe_inner_html_kind = 3;
function unsafe_inner_html(key, mapper, namespace, tag2, attributes2, inner_html) {
  return new UnsafeInnerHtml(
    unsafe_inner_html_kind,
    key,
    mapper,
    namespace,
    tag2,
    prepare(attributes2),
    inner_html
  );
}
function children_to_string_tree(html2, children2) {
  return fold2(
    children2,
    html2,
    (html3, child) => {
      let _pipe = child;
      let _pipe$1 = to_string_tree2(_pipe);
      return ((_capture) => {
        return add(html3, _capture);
      })(
        _pipe$1
      );
    }
  );
}
function to_string_tree2(node) {
  if (node instanceof Fragment) {
    let children2 = node.children;
    return children_to_string_tree(new$(), children2);
  } else if (node instanceof Element2) {
    let self_closing = node.self_closing;
    if (self_closing) {
      let key = node.key;
      let namespace = node.namespace;
      let tag2 = node.tag;
      let attributes2 = node.attributes;
      let html2 = identity("<" + tag2);
      let attributes$1 = to_string_tree(key, namespace, attributes2);
      let _pipe = html2;
      let _pipe$1 = add(_pipe, attributes$1);
      return append(_pipe$1, "/>");
    } else {
      let void$ = node.void;
      if (void$) {
        let key = node.key;
        let namespace = node.namespace;
        let tag2 = node.tag;
        let attributes2 = node.attributes;
        let html2 = identity("<" + tag2);
        let attributes$1 = to_string_tree(key, namespace, attributes2);
        let _pipe = html2;
        let _pipe$1 = add(_pipe, attributes$1);
        return append(_pipe$1, ">");
      } else {
        let key = node.key;
        let namespace = node.namespace;
        let tag2 = node.tag;
        let attributes2 = node.attributes;
        let children2 = node.children;
        let html2 = identity("<" + tag2);
        let attributes$1 = to_string_tree(key, namespace, attributes2);
        let _pipe = html2;
        let _pipe$1 = add(_pipe, attributes$1);
        let _pipe$2 = append(_pipe$1, ">");
        let _pipe$3 = children_to_string_tree(_pipe$2, children2);
        return append(_pipe$3, "</" + tag2 + ">");
      }
    }
  } else if (node instanceof Text3) {
    let $ = node.content;
    if ($ === "") {
      return new$();
    } else {
      let content2 = $;
      return identity(escape2(content2));
    }
  } else {
    let key = node.key;
    let namespace = node.namespace;
    let tag2 = node.tag;
    let attributes2 = node.attributes;
    let inner_html = node.inner_html;
    let html2 = identity("<" + tag2);
    let attributes$1 = to_string_tree(key, namespace, attributes2);
    let _pipe = html2;
    let _pipe$1 = add(_pipe, attributes$1);
    let _pipe$2 = append(_pipe$1, ">");
    let _pipe$3 = append(_pipe$2, inner_html);
    return append(_pipe$3, "</" + tag2 + ">");
  }
}
function to_string3(node) {
  let _pipe = node;
  let _pipe$1 = to_string_tree2(_pipe);
  return identity(_pipe$1);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element2(tag2, attributes2, children2) {
  return element(
    "",
    identity2,
    "",
    tag2,
    attributes2,
    children2,
    empty4(),
    false,
    false
  );
}
function text3(content2) {
  return text2("", identity2, content2);
}
function unsafe_raw_html(namespace, tag2, attributes2, inner_html) {
  return unsafe_inner_html(
    "",
    identity2,
    namespace,
    tag2,
    attributes2,
    inner_html
  );
}
function to_string4(element4) {
  return to_string3(element4);
}
function to_document_string(el) {
  let _pipe = to_string3(
    (() => {
      if (el instanceof Element2) {
        let $ = el.tag;
        if ($ === "html") {
          return el;
        } else if ($ === "head") {
          return element2("html", toList([]), toList([el]));
        } else if ($ === "body") {
          return element2("html", toList([]), toList([el]));
        } else {
          return element2(
            "html",
            toList([]),
            toList([element2("body", toList([]), toList([el]))])
          );
        }
      } else {
        return element2(
          "html",
          toList([]),
          toList([element2("body", toList([]), toList([el]))])
        );
      }
    })()
  );
  return ((_capture) => {
    return append2("<!doctype html>\n", _capture);
  })(
    _pipe
  );
}

// build/dev/javascript/rss_reader/aws_ffi.js
function toResponse(data) {
  return {
    statusCode: data.status_code,
    headers: Object.fromEntries(data.headers.entries()),
    cookies: data.cookies.toArray(),
    body: data.body,
    isBase64Encoded: data.is_base64_encoded
  };
}

// build/dev/javascript/rss_reader/node_ffi.js
function consoleLog(message) {
  console.log(message);
}
function consoleError(message) {
  console.error(message);
}

// build/dev/javascript/rss_reader/rss_reader/aws.mjs
var LambdaEvent = class extends CustomType {
  constructor(version, raw_path, raw_query_string, cookies, headers, query_string_parameters, request_context, body2, is_base64_encoded) {
    super();
    this.version = version;
    this.raw_path = raw_path;
    this.raw_query_string = raw_query_string;
    this.cookies = cookies;
    this.headers = headers;
    this.query_string_parameters = query_string_parameters;
    this.request_context = request_context;
    this.body = body2;
    this.is_base64_encoded = is_base64_encoded;
  }
};
var RequestContext = class extends CustomType {
  constructor(account_id, api_id, domain_name, domain_prefix, http, request_id, time, time_epoch) {
    super();
    this.account_id = account_id;
    this.api_id = api_id;
    this.domain_name = domain_name;
    this.domain_prefix = domain_prefix;
    this.http = http;
    this.request_id = request_id;
    this.time = time;
    this.time_epoch = time_epoch;
  }
};
var Http2 = class extends CustomType {
  constructor(method2, path, protocol, source_ip, user_agent) {
    super();
    this.method = method2;
    this.path = path;
    this.protocol = protocol;
    this.source_ip = source_ip;
    this.user_agent = user_agent;
  }
};
var LambdaResponse = class extends CustomType {
  constructor(status_code2, headers, cookies, body2, is_base64_encoded) {
    super();
    this.status_code = status_code2;
    this.headers = headers;
    this.cookies = cookies;
    this.body = body2;
    this.is_base64_encoded = is_base64_encoded;
  }
};
function http_decoder() {
  return field(
    "method",
    string2,
    (method2) => {
      return field(
        "path",
        string2,
        (path) => {
          return field(
            "protocol",
            string2,
            (protocol) => {
              return field(
                "sourceIp",
                string2,
                (source_ip) => {
                  return field(
                    "userAgent",
                    string2,
                    (user_agent) => {
                      return success(
                        new Http2(method2, path, protocol, source_ip, user_agent)
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function request_context_decoder() {
  return field(
    "accountId",
    string2,
    (account_id) => {
      return field(
        "apiId",
        string2,
        (api_id) => {
          return field(
            "domainName",
            string2,
            (domain_name) => {
              return field(
                "domainPrefix",
                string2,
                (domain_prefix) => {
                  return field(
                    "http",
                    http_decoder(),
                    (http) => {
                      return field(
                        "requestId",
                        string2,
                        (request_id) => {
                          return field(
                            "time",
                            string2,
                            (time) => {
                              return field(
                                "timeEpoch",
                                int2,
                                (time_epoch) => {
                                  return success(
                                    new RequestContext(
                                      account_id,
                                      api_id,
                                      domain_name,
                                      domain_prefix,
                                      http,
                                      request_id,
                                      time,
                                      time_epoch
                                    )
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function lambda_event_decoder() {
  return field(
    "version",
    string2,
    (version) => {
      return field(
        "rawPath",
        string2,
        (raw_path) => {
          return field(
            "rawQueryString",
            string2,
            (raw_query_string) => {
              return optional_field(
                "cookies",
                toList([]),
                list2(string2),
                (cookies) => {
                  return field(
                    "headers",
                    dict2(string2, string2),
                    (headers) => {
                      return optional_field(
                        "queryStringParameters",
                        new_map(),
                        dict2(string2, string2),
                        (query_string_parameters) => {
                          return field(
                            "requestContext",
                            request_context_decoder(),
                            (request_context) => {
                              return optional_field(
                                "body",
                                "",
                                string2,
                                (body2) => {
                                  return field(
                                    "isBase64Encoded",
                                    bool,
                                    (is_base64_encoded) => {
                                      return success(
                                        new LambdaEvent(
                                          version,
                                          raw_path,
                                          raw_query_string,
                                          cookies,
                                          headers,
                                          query_string_parameters,
                                          request_context,
                                          body2,
                                          is_base64_encoded
                                        )
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function decode_event(event2) {
  let _pipe = run(event2, lambda_event_decoder());
  return map_error(
    _pipe,
    (err) => {
      consoleError("Decode error: " + inspect2(err));
      return "Failed to decode Lambda event";
    }
  );
}
function html_response(html2) {
  return new LambdaResponse(
    200,
    from_list(toList([["Content-Type", "text/html; charset=utf-8"]])),
    toList([]),
    html2,
    false
  );
}
function status_code(response, code) {
  let _record = response;
  return new LambdaResponse(
    code,
    _record.headers,
    _record.cookies,
    _record.body,
    _record.is_base64_encoded
  );
}

// build/dev/javascript/rss_reader/rss_reader/utils.mjs
function await_or_err(promise, err, callback) {
  return then_await(
    promise,
    (res) => {
      if (res instanceof Ok) {
        let v = res[0];
        return callback(v);
      } else {
        let e = res[0];
        consoleError("Error: " + inspect2(e));
        return resolve(new Error(err));
      }
    }
  );
}
function await_with_timeout(promise, timeout_ms, err) {
  let _block;
  let _pipe = wait(timeout_ms);
  _block = map_promise(_pipe, (_) => {
    return new Error(err);
  });
  let timeout_promise = _block;
  return race_promises(toList([promise, timeout_promise]));
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function html(attrs, children2) {
  return element2("html", attrs, children2);
}
function text4(content2) {
  return text3(content2);
}
function head(attrs, children2) {
  return element2("head", attrs, children2);
}
function meta(attrs) {
  return element2("meta", attrs, empty_list);
}
function style2(attrs, css) {
  return unsafe_raw_html("", "style", attrs, css);
}
function title(attrs, content2) {
  return element2("title", attrs, toList([text4(content2)]));
}
function body(attrs, children2) {
  return element2("body", attrs, children2);
}
function h2(attrs, children2) {
  return element2("h2", attrs, children2);
}
function div(attrs, children2) {
  return element2("div", attrs, children2);
}
function p(attrs, children2) {
  return element2("p", attrs, children2);
}
function a(attrs, children2) {
  return element2("a", attrs, children2);
}
function span(attrs, children2) {
  return element2("span", attrs, children2);
}
function script(attrs, js) {
  return unsafe_raw_html("", "script", attrs, js);
}
function button(attrs, children2) {
  return element2("button", attrs, children2);
}
function form(attrs, children2) {
  return element2("form", attrs, children2);
}
function input(attrs) {
  return element2("input", attrs, empty_list);
}
function details(attrs, children2) {
  return element2("details", attrs, children2);
}
function summary(attrs, children2) {
  return element2("summary", attrs, children2);
}

// build/dev/javascript/lustre/lustre/element/keyed.mjs
function do_extract_keyed_children(loop$key_children_pairs, loop$keyed_children, loop$children) {
  while (true) {
    let key_children_pairs = loop$key_children_pairs;
    let keyed_children = loop$keyed_children;
    let children2 = loop$children;
    if (key_children_pairs instanceof Empty) {
      return [keyed_children, reverse(children2)];
    } else {
      let rest = key_children_pairs.tail;
      let key = key_children_pairs.head[0];
      let element$1 = key_children_pairs.head[1];
      let keyed_element = to_keyed(key, element$1);
      let _block;
      if (key === "") {
        _block = keyed_children;
      } else {
        _block = insert2(keyed_children, key, keyed_element);
      }
      let keyed_children$1 = _block;
      let children$1 = prepend(keyed_element, children2);
      loop$key_children_pairs = rest;
      loop$keyed_children = keyed_children$1;
      loop$children = children$1;
    }
  }
}
function extract_keyed_children(children2) {
  return do_extract_keyed_children(
    children2,
    empty4(),
    empty_list
  );
}
function element3(tag2, attributes2, children2) {
  let $ = extract_keyed_children(children2);
  let keyed_children = $[0];
  let children$1 = $[1];
  return element(
    "",
    identity2,
    "",
    tag2,
    attributes2,
    children$1,
    keyed_children,
    false,
    false
  );
}
function div2(attributes2, children2) {
  return element3("div", attributes2, children2);
}

// build/dev/javascript/rss_reader/rss_reader/view.mjs
function feed_view(feed) {
  return div(
    toList([]),
    toList([
      h2(toList([]), toList([text4(feed.channel.title)])),
      div(
        toList([]),
        map2(
          (() => {
            let _pipe = feed.channel.items;
            return take(_pipe, 10);
          })(),
          (item) => {
            let _block;
            let _pipe = item.description;
            let _pipe$1 = unwrap(_pipe, "");
            _block = replace(_pipe$1, '"', "");
            let description = _block;
            return details(
              toList([]),
              toList([
                summary(
                  toList([]),
                  toList([
                    text4(
                      (() => {
                        let _pipe$2 = item.title;
                        return unwrap(_pipe$2, "No title");
                      })()
                    )
                  ])
                ),
                div(toList([]), toList([text4(description)])),
                div(
                  toList([]),
                  toList([
                    a(
                      (() => {
                        let _pipe$2 = map(
                          item.link,
                          (l) => {
                            return toList([href(l)]);
                          }
                        );
                        return unwrap(_pipe$2, toList([]));
                      })(),
                      toList([text4("Read more")])
                    )
                  ])
                )
              ])
            );
          }
        )
      )
    ])
  );
}
function error_view(error) {
  return p(
    toList([style("color", "red")]),
    toList([text4(error)])
  );
}
var feed_inputs_id = "feed-inputs";
function add_feed_button() {
  return toList([
    button(
      toList([attribute3("onclick", "addFeedInput()")]),
      toList([text4("Add Feed")])
    ),
    script(
      toList([]),
      "\n    function addFeedInput() {\n      const form = document.getElementById('" + feed_inputs_id + "');\n      if (form) {\n        const input = document.createElement('input');\n        input.name = 'feed-url[]';\n        form.appendChild(input);\n      }\n    }\n    "
    )
  ]);
}
function feed_inputs_view(initial_values) {
  return div(
    toList([]),
    prepend(
      form(
        toList([method("GET"), action("/")]),
        toList([
          div(
            toList([id(feed_inputs_id)]),
            map2(
              initial_values,
              (value2) => {
                return input(
                  toList([
                    name("feed-url[]"),
                    value(value2)
                  ])
                );
              }
            )
          ),
          input(
            toList([type_("submit"), value("Get feeds")])
          )
        ])
      ),
      add_feed_button()
    )
  );
}
function view(urls, errors) {
  return html(
    toList([]),
    toList([
      head(
        toList([]),
        toList([
          meta(toList([charset("UTF-8")])),
          meta(
            toList([
              name("viewport"),
              content("width=device-width, initial-scale=1.0")
            ])
          ),
          title(toList([]), "RSS Reader"),
          script(
            toList([
              src(
                "https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js"
              ),
              crossorigin("anonymous")
            ]),
            ""
          ),
          style2(
            toList([]),
            "\n.loader {\n    width: 24px;\n    height: 24px;\n    border: 3px solid #000;\n    border-bottom-color: transparent;\n    border-radius: 50%;\n    display: inline-block;\n    box-sizing: border-box;\n    animation: rotation 1s linear infinite;\n      margin: 1em;\n}\n\n@keyframes rotation {\n    0% {\n        transform: rotate(0deg);\n    }\n    100% {\n        transform: rotate(360deg);\n    }\n}\n\n      details {\n      background: antiquewhite;\n        border-bottom: 1px solid black;\n      }\n      details:first-of-type {\n        border-top: 1px solid black;\n      }\n\n      details > *:not(summary) {\n      margin: 0.25em 1.5em;\n      opacity: 0.8;\n      }\n\n      summary {\n        cursor: pointer;\n        padding: 0.5em 1em;\n      border-bottom: none;\n      font-size: 1.1em;\n      }\n\n      details[open] summary {\n      border-bottom: 1px solid black;\n      }\n"
          )
        ])
      ),
      body(
        toList([style("font-family", "monospace")]),
        toList([
          div(
            toList([]),
            toList([
              div(
                toList([]),
                map2(errors, (error) => {
                  return error_view(error);
                })
              ),
              feed_inputs_view(urls),
              div2(
                toList([]),
                map2(
                  urls,
                  (url) => {
                    return [
                      url,
                      div(
                        toList([
                          attribute3(
                            "hx-get",
                            "/items?feed-url=" + url
                          ),
                          attribute3("hx-trigger", "load"),
                          attribute3("hx-target", "this")
                        ]),
                        toList([
                          span(
                            toList([class$("loader")]),
                            toList([])
                          )
                        ])
                      )
                    ];
                  }
                )
              )
            ])
          )
        ])
      )
    ])
  );
}

// build/dev/javascript/rss_reader/rss_reader.mjs
function fetch_feed(url) {
  let $ = to(url);
  if ($ instanceof Ok) {
    let req = $[0];
    consoleLog("Fetching feed from " + url);
    return await_or_err(
      send(req),
      "Error fetching URL: " + url,
      (resp) => {
        return await_or_err(
          read_text_body(resp),
          "Error reading response body from URL: " + url,
          (resp2) => {
            return resolve(parse_rss(resp2.body));
          }
        );
      }
    );
  } else {
    return resolve(new Error("Invalid URL: " + url));
  }
}
function handler(event2) {
  consoleLog("Received event: " + inspect2(event2));
  let ev = decode_event(event2);
  let _block;
  if (ev instanceof Ok) {
    let ev$1 = ev[0];
    let $ = ev$1.request_context.http.path;
    if ($ === "/") {
      let _block$1;
      let _pipe = ev$1.query_string_parameters;
      let _pipe$1 = map_get(_pipe, "feed-url[]");
      let _pipe$2 = unwrap2(_pipe$1, "");
      let _pipe$3 = split2(_pipe$2, ",");
      _block$1 = filter(
        _pipe$3,
        (s) => {
          return trim(s) !== "";
        }
      );
      let urls = _block$1;
      let _pipe$4 = view(urls, toList([]));
      let _pipe$5 = to_document_string(_pipe$4);
      let _pipe$6 = html_response(_pipe$5);
      let _pipe$7 = toResponse(_pipe$6);
      _block = resolve(_pipe$7);
    } else if ($ === "/items") {
      let _block$1;
      let _pipe = ev$1.query_string_parameters;
      let _pipe$1 = map_get(_pipe, "feed-url");
      _block$1 = unwrap2(_pipe$1, "");
      let url = _block$1;
      _block = map_promise(
        (() => {
          let _pipe$2 = fetch_feed(url);
          return await_with_timeout(
            _pipe$2,
            3e3,
            "Timeout fetching URL: " + url
          );
        })(),
        (res2) => {
          let _block$2;
          if (res2 instanceof Ok) {
            let feed = res2[0];
            _block$2 = feed_view(feed);
          } else {
            let e = res2[0];
            _block$2 = error_view(e);
          }
          let _pipe$2 = _block$2;
          let _pipe$3 = to_string4(_pipe$2);
          let _pipe$4 = html_response(_pipe$3);
          return toResponse(_pipe$4);
        }
      );
    } else {
      let _pipe = html_response("Not found");
      let _pipe$1 = status_code(_pipe, 404);
      let _pipe$2 = toResponse(_pipe$1);
      _block = resolve(_pipe$2);
    }
  } else {
    let e = ev[0];
    consoleError(e);
    let _pipe = view(toList([]), toList([e]));
    let _pipe$1 = to_document_string(_pipe);
    let _pipe$2 = html_response(_pipe$1);
    let _pipe$3 = toResponse(_pipe$2);
    _block = resolve(_pipe$3);
  }
  let res = _block;
  tap(
    res,
    (res2) => {
      return consoleLog("Returning response: " + inspect2(res2));
    }
  );
  return res;
}
export {
  handler
};

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
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length6 = 0;
    while (current) {
      current = current.tail;
      length6++;
    }
    return length6 - 1;
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
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
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
  byteAt(index4) {
    if (index4 < 0 || index4 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index4);
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
function bitArrayByteAt(buffer, bitOffset, index4) {
  if (bitOffset === 0) {
    return buffer[index4] ?? 0;
  } else {
    const a2 = buffer[index4] << bitOffset & 255;
    const b = buffer[index4 + 1] >> 8 - bitOffset;
    return a2 | b;
  }
}
var UtfCodepoint = class {
  constructor(value2) {
    this.value = value2;
  }
};
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name, message2) {
  if (isBitArrayDeprecationMessagePrinted[name]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name} property used in JavaScript FFI code. ${message2}.`
  );
  isBitArrayDeprecationMessagePrinted[name] = true;
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
  let values3 = [x, y];
  while (values3.length) {
    let a2 = values3.pop();
    let b = values3.pop();
    if (a2 === b) continue;
    if (!isObject(a2) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get5] = getters(a2);
    for (let k of keys2(a2)) {
      values3.push(get5(a2, k), get5(b, k));
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
  if (nonstructural.some((c) => a2 instanceof c)) return false;
  return a2.constructor === b.constructor;
}
function makeError(variant, file, module, line, fn, message2, extra) {
  let error2 = new globalThis.Error(message2);
  error2.gleam_error = variant;
  error2.file = file;
  error2.module = module;
  error2.line = line;
  error2.function = fn;
  error2.fn = fn;
  for (let k in extra) error2[k] = extra[k];
  return error2;
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
      const code2 = o.hashCode(o);
      if (typeof code2 === "number") {
        return code2;
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
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
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
function createNode(shift, key1, val1, key2hash, key22, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key22, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key22,
    val2,
    addedLeaf
  );
}
function assoc(root3, shift, hash, key3, val, addedLeaf) {
  switch (root3.type) {
    case ARRAY_NODE:
      return assocArray(root3, shift, hash, key3, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root3, shift, hash, key3, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root3, shift, hash, key3, val, addedLeaf);
  }
}
function assocArray(root3, shift, hash, key3, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size + 1,
      array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key3, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key3, node.k)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: ARRAY_NODE,
        size: root3.size,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key3,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key3, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key3, val, addedLeaf);
  if (n === node) {
    return root3;
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function assocIndex(root3, shift, hash, key3, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root3.bitmap, bit);
  if ((root3.bitmap & bit) !== 0) {
    const node = root3.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key3, val, addedLeaf);
      if (n === node) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key3, nodeKey)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key3,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key3, val)
      )
    };
  } else {
    const n = root3.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key3, val, addedLeaf);
      let j = 0;
      let bitmap = root3.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root3.array[j++];
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
      const newArray = spliceIn(root3.array, idx, {
        type: ENTRY,
        k: key3,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root3, shift, hash, key3, val, addedLeaf) {
  if (hash === root3.hash) {
    const idx = collisionIndexOf(root3, key3);
    if (idx !== -1) {
      const entry = root3.array[idx];
      if (entry.v === val) {
        return root3;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key3, v: val })
      };
    }
    const size3 = root3.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root3.array, size3, { type: ENTRY, k: key3, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root3.hash, shift),
      array: [root3]
    },
    shift,
    hash,
    key3,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root3, key3) {
  const size3 = root3.array.length;
  for (let i = 0; i < size3; i++) {
    if (isEqual(key3, root3.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root3, shift, hash, key3) {
  switch (root3.type) {
    case ARRAY_NODE:
      return findArray(root3, shift, hash, key3);
    case INDEX_NODE:
      return findIndex(root3, shift, hash, key3);
    case COLLISION_NODE:
      return findCollision(root3, key3);
  }
}
function findArray(root3, shift, hash, key3) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key3);
  }
  if (isEqual(key3, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root3, shift, hash, key3) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key3);
  }
  if (isEqual(key3, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root3, key3) {
  const idx = collisionIndexOf(root3, key3);
  if (idx < 0) {
    return void 0;
  }
  return root3.array[idx];
}
function without(root3, shift, hash, key3) {
  switch (root3.type) {
    case ARRAY_NODE:
      return withoutArray(root3, shift, hash, key3);
    case INDEX_NODE:
      return withoutIndex(root3, shift, hash, key3);
    case COLLISION_NODE:
      return withoutCollision(root3, key3);
  }
}
function withoutArray(root3, shift, hash, key3) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return root3;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key3)) {
      return root3;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key3);
    if (n === node) {
      return root3;
    }
  }
  if (n === void 0) {
    if (root3.size <= MIN_ARRAY_NODE) {
      const arr = root3.array;
      const out = new Array(root3.size - 1);
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
      size: root3.size - 1,
      array: cloneAndSet(root3.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function withoutIndex(root3, shift, hash, key3) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return root3;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key3);
    if (n === node) {
      return root3;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  if (isEqual(key3, node.k)) {
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  return root3;
}
function withoutCollision(root3, key3) {
  const idx = collisionIndexOf(root3, key3);
  if (idx < 0) {
    return root3;
  }
  if (root3.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root3.hash,
    array: spliceOut(root3.array, idx)
  };
}
function forEach(root3, fn) {
  if (root3 === void 0) {
    return;
  }
  const items = root3.array;
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
  constructor(root3, size3) {
    this.root = root3;
    this.size = size3;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key3, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key3), key3);
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
  set(key3, val) {
    const addedLeaf = { val: false };
    const root3 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root3, 0, getHash(key3), key3, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key3) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key3), key3);
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
  has(key3) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key3), key3) !== void 0;
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

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
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
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function string_codeunit_slice(str, from2, length6) {
  return str.slice(from2, from2 + length6);
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
function map_remove(key3, map10) {
  return map10.delete(key3);
}
function map_get(map10, key3) {
  const value2 = map10.get(key3, NOT_FOUND);
  if (value2 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value2);
}
function map_insert(key3, value2, map10) {
  return map10.set(key3, value2);
}
function inspect(v) {
  return new Inspector().inspect(v);
}
function float_to_string(float2) {
  const string5 = float2.toString().replace("+", "");
  if (string5.indexOf(".") >= 0) {
    return string5;
  } else {
    const index4 = string5.indexOf("e");
    if (index4 >= 0) {
      return string5.slice(0, index4) + ".0" + string5.slice(index4);
    } else {
      return string5 + ".0";
    }
  }
}
var Inspector = class {
  #references = /* @__PURE__ */ new Set();
  inspect(v) {
    const t = typeof v;
    if (v === true) return "True";
    if (v === false) return "False";
    if (v === null) return "//js(null)";
    if (v === void 0) return "Nil";
    if (t === "string") return this.#string(v);
    if (t === "bigint" || Number.isInteger(v)) return v.toString();
    if (t === "number") return float_to_string(v);
    if (v instanceof UtfCodepoint) return this.#utfCodepoint(v);
    if (v instanceof BitArray) return this.#bit_array(v);
    if (v instanceof RegExp) return `//js(${v})`;
    if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error) return `//js(${v.toString()})`;
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
    const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body2 = props.length ? " " + props.join(", ") + " " : "";
    const head = name === "Object" ? "" : name + " ";
    return `//js(${head}{${body2}})`;
  }
  #dict(map10) {
    let body2 = "dict.from_list([";
    let first = true;
    map10.forEach((value2, key3) => {
      if (!first) body2 = body2 + ", ";
      body2 = body2 + "#(" + this.inspect(key3) + ", " + this.inspect(value2) + ")";
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

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function do_has_key(key3, dict3) {
  return !isEqual(map_get(dict3, key3), new Error(void 0));
}
function has_key(dict3, key3) {
  return do_has_key(key3, dict3);
}
function insert(dict3, key3, value2) {
  return map_insert(key3, value2, dict3);
}
function delete$(dict3, key3) {
  return map_remove(key3, dict3);
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
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second2 = loop$second;
    if (first instanceof Empty) {
      return second2;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second2);
    }
  }
}
function append2(first, second2) {
  return append_loop(reverse(first), second2);
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
function unique_loop(loop$list, loop$seen, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let seen = loop$seen;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = has_key(seen, first$1);
      if ($) {
        loop$list = rest$1;
        loop$seen = seen;
        loop$acc = acc;
      } else {
        loop$list = rest$1;
        loop$seen = insert(seen, first$1, void 0);
        loop$acc = prepend(first$1, acc);
      }
    }
  }
}
function unique(list4) {
  return unique_loop(list4, new_map(), toList([]));
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare5 = loop$compare;
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
      let $ = compare5(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare5;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare5;
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
            let $1 = compare5(new$1, next2);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare5;
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
          let $1 = compare5(new$1, next2);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare5;
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
          let $1 = compare5(new$1, next2);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare5;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare5;
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
    let compare5 = loop$compare;
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
      let $ = compare5(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare5 = loop$compare;
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
          compare5,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare5;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare5 = loop$compare;
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
      let $ = compare5(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare5 = loop$compare;
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
          compare5,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare5;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare5 = loop$compare;
    if (sequences2 instanceof Empty) {
      return toList([]);
    } else if (direction instanceof Ascending) {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences2, compare5, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Descending();
        loop$compare = compare5;
      }
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(sequence);
      } else {
        let sequences$1 = merge_descending_pairs(sequences2, compare5, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Ascending();
        loop$compare = compare5;
      }
    }
  }
}
function sort(list4, compare5) {
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
      let $1 = compare5(x, y);
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
        compare5,
        toList([x]),
        direction,
        y,
        toList([])
      );
      return merge_all(sequences$1, new Ascending(), compare5);
    }
  }
}
function key_pop_loop(loop$list, loop$key, loop$checked) {
  while (true) {
    let list4 = loop$list;
    let key3 = loop$key;
    let checked = loop$checked;
    if (list4 instanceof Empty) {
      return new Error(void 0);
    } else {
      let k = list4.head[0];
      if (isEqual(k, key3)) {
        let rest$1 = list4.tail;
        let v = list4.head[1];
        return new Ok([v, reverse_and_prepend(checked, rest$1)]);
      } else {
        let first$1 = list4.head;
        let rest$1 = list4.tail;
        loop$list = rest$1;
        loop$key = key3;
        loop$checked = prepend(first$1, checked);
      }
    }
  }
}
function key_pop(list4, key3) {
  return key_pop_loop(list4, key3, toList([]));
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
    let error2 = result[0];
    return new Error(fun(error2));
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
function unwrap_both(result) {
  if (result instanceof Ok) {
    let a2 = result[0];
    return a2;
  } else {
    let a2 = result[0];
    return a2;
  }
}
function replace_error(result, error2) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(x);
  } else {
    return new Error(error2);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment3) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment3;
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
    let fragment3 = $[0];
    _block = toList(["#", fragment3]);
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

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
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
function method_to_string(method) {
  if (method instanceof Get) {
    return "GET";
  } else if (method instanceof Post) {
    return "POST";
  } else if (method instanceof Head) {
    return "HEAD";
  } else if (method instanceof Put) {
    return "PUT";
  } else if (method instanceof Delete) {
    return "DELETE";
  } else if (method instanceof Trace) {
    return "TRACE";
  } else if (method instanceof Connect) {
    return "CONNECT";
  } else if (method instanceof Options) {
    return "OPTIONS";
  } else if (method instanceof Patch) {
    return "PATCH";
  } else {
    let s = method[0];
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
  constructor(method, headers, body2, scheme, host, port, path, query) {
    super();
    this.method = method;
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

// build/dev/javascript/iv/iv_ffi.mjs
var empty2 = () => [];
var singleton = (x) => [x];
var append3 = (xs, x) => [...xs, x];
var get1 = (idx, xs) => xs[idx - 1];
var length3 = (xs) => xs.length;
var bsl = (a2, b) => a2 << b;
var bsr = (a2, b) => a2 >> b;

// build/dev/javascript/iv/iv/internal/vector.mjs
function fold_loop(loop$xs, loop$state, loop$idx, loop$len, loop$fun) {
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
  let len = length3(xs);
  return fold_loop(xs, state, 2, len, fun);
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
    return get1(length3(sizes), sizes);
  } else {
    let children2 = node.children;
    return length3(children2);
  }
}
function compute_sizes(nodes) {
  let first_size = size(get1(1, nodes));
  return fold_skip_first(
    nodes,
    singleton(first_size),
    (sizes, node) => {
      let size$1 = get1(length3(sizes), sizes) + size(node);
      return append3(sizes, size$1);
    }
  );
}
function find_size(loop$sizes, loop$size_idx_plus_one, loop$index) {
  while (true) {
    let sizes = loop$sizes;
    let size_idx_plus_one = loop$size_idx_plus_one;
    let index4 = loop$index;
    let $ = get1(size_idx_plus_one, sizes) > index4;
    if ($) {
      return size_idx_plus_one - 1;
    } else {
      loop$sizes = sizes;
      loop$size_idx_plus_one = size_idx_plus_one + 1;
      loop$index = index4;
    }
  }
}
function balanced(shift, nodes) {
  let len = length3(nodes);
  let last_child = get1(len, nodes);
  let max_size = bsl(1, shift);
  let size$1 = max_size * (len - 1) + size(last_child);
  return new Balanced(size$1, nodes);
}
function branch(shift, nodes) {
  let len = length3(nodes);
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
    let index4 = loop$index;
    if (node instanceof Balanced) {
      let children2 = node.children;
      let node_index = bsr(index4, shift);
      let index$1 = index4 - bsl(node_index, shift);
      let child = get1(node_index + 1, children2);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else if (node instanceof Unbalanced) {
      let sizes = node.sizes;
      let children2 = node.children;
      let start_search_index = bsr(index4, shift);
      let node_index = find_size(sizes, start_search_index + 1, index4);
      let _block;
      if (node_index === 0) {
        _block = index4;
      } else {
        _block = index4 - get1(node_index, sizes);
      }
      let index$1 = _block;
      let child = get1(node_index + 1, children2);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else {
      let children2 = node.children;
      return get1(index4 + 1, children2);
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
    let $ = length3(nodes$1) < branch_factor;
    if ($) {
      return prepend(append3(nodes$1, node), rest);
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
function new$() {
  return new Builder(toList([]), empty2(), append_node, append3);
}
function push(builder, item) {
  let nodes = builder.nodes;
  let items = builder.items;
  let push_node = builder.push_node;
  let push_item = builder.push_item;
  let $ = length3(items) === branch_factor;
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
        let root3 = nodes.head;
        return new Ok([shift, root3]);
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
  let items_len = length3(items);
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
  constructor(shift, root3) {
    super();
    this.shift = shift;
    this.root = root3;
  }
};
function array(shift, nodes) {
  let $ = length3(nodes);
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
    let _pipe$1 = fold2(_pipe, new$(), push);
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
function get2(array4, index4) {
  if (array4 instanceof Empty2) {
    return new Error(void 0);
  } else {
    let shift = array4.shift;
    let root3 = array4.root;
    let $ = 0 <= index4 && index4 < size(root3);
    if ($) {
      return new Ok(get(root3, shift, index4));
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
    if (options.case_insensitive) flags += "i";
    if (options.multi_line) flags += "m";
    return new Ok(new RegExp(pattern, flags));
  } catch (error2) {
    const number = (error2.columnNumber || 0) | 0;
    return new Error(new CompileError(error2.message, number));
  }
}

// build/dev/javascript/gleam_regexp/gleam/regexp.mjs
var CompileError = class extends CustomType {
  constructor(error2, byte_index) {
    super();
    this.error = error2;
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
function new$3() {
  return new Set2(new_map());
}
function contains(set2, member) {
  let _pipe = set2.dict;
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
  constructor(span, lexeme, value2) {
    super();
    this.span = span;
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
function map7(matcher, f) {
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
function identifier(start4, inner, reserved, to_value) {
  let $ = from_string("^" + start4 + inner + "*$");
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
          let span = new Span(start_row, start_col, state.row, state.col);
          let token$1 = new Token(span, lexeme, value2);
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
        let span = new Span(start_row, start_col, state.row, state.col);
        let token$1 = new Token(span, lexeme, value2);
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
  constructor(src, idx, pos, ctx) {
    super();
    this.src = src;
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
  let parse6 = parser2[0];
  return parse6(state);
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
function map8(parser2, f) {
  return do$(parser2, (a2) => {
    return return$(f(a2));
  });
}
function replace3(parser2, b) {
  return map8(parser2, (_) => {
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
function loop(init2, step) {
  return new Parser(
    (state) => {
      return loop_help(step, new CanBacktrack(false), init2, state);
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
              return map8(
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
function throw$(message2) {
  return new Parser(
    (state) => {
      let error2 = new Custom(message2);
      let bag = bag_from_state(state, error2);
      return new Fail(new CanBacktrack(false), bag);
    }
  );
}
function fail(message2) {
  return throw$(message2);
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
function run2(src, parser2) {
  let init2 = new State2(from_list2(src), 0, new Span(1, 1, 1, 1), toList([]));
  let $ = runwrap(init2, parser2);
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
function one_of(parsers) {
  return new Parser(
    (state) => {
      let init2 = new Fail(new CanBacktrack(false), new Empty3());
      return fold_until(
        parsers,
        init2,
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
  return one_of(
    toList([
      map8(parser2, (var0) => {
        return new Some(var0);
      }),
      return$(new None())
    ])
  );
}

// build/dev/javascript/gleaxml/gleaxml/lexer.mjs
var TagOpen = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var TagClose = class extends CustomType {
};
var TagSelfClose = class extends CustomType {
};
var TagEnd = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
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
  constructor(name) {
    super();
    this.name = name;
  }
};
var ReferenceCode = class extends CustomType {
  constructor(code2) {
    super();
    this.code = code2;
  }
};
var ReferenceHexCode = class extends CustomType {
  constructor(code2) {
    super();
    this.code = code2;
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
    let name = tok.name;
    return "<" + name;
  } else if (tok instanceof TagClose) {
    return ">";
  } else if (tok instanceof TagSelfClose) {
    return "/>";
  } else if (tok instanceof TagEnd) {
    let name = tok.name;
    return "</" + name;
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
    let name = tok.name;
    return name;
  } else if (tok instanceof ReferenceCode) {
    let code2 = tok.code;
    return "#" + code2;
  } else if (tok instanceof ReferenceHexCode) {
    let code2 = tok.code;
    return "#x" + code2;
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
    new$3(),
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
            return map7(_pipe, (name) => {
              return new Text(name);
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
            let _pipe$1 = map7(
              _pipe,
              (name) => {
                return new TagEnd(name);
              }
            );
            return into(_pipe$1, (_) => {
              return new EndTag();
            });
          })(),
          (() => {
            let _pipe = name_with_prefix("<");
            let _pipe$1 = map7(
              _pipe,
              (name) => {
                return new TagOpen(name);
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
            new$3(),
            (_) => {
              return new Text(" ");
            }
          ),
          whitespace(new Text(" ")),
          identifier(
            "[^<&]",
            "[^<&\\n]",
            new$3(),
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
            new$3(),
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
            new$3(),
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
            new$3(),
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
            new$3(),
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
            new$3(),
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
            new$3(),
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
            return map7(_pipe, (name) => {
              return new Text(name);
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
    new$3(),
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
var Element2 = class extends CustomType {
  constructor(name, attrs, children2) {
    super();
    this.name = name;
    this.attrs = attrs;
    this.children = children2;
  }
};
var Text2 = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Comment2 = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
function tag_open() {
  return take_map(
    "an opening tag",
    (tok) => {
      if (tok instanceof TagOpen) {
        let name = tok.name;
        return new Some(name);
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
        let content = tok[0];
        return new Some(content);
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
                let name = $;
                return new Some("&" + name + ";");
              }
            } else if (tok instanceof ReferenceCode) {
              let code2 = tok.code;
              let _pipe = code2;
              let _pipe$1 = base_parse(_pipe, 10);
              let _pipe$2 = try$(_pipe$1, utf_codepoint);
              let _pipe$3 = map4(
                _pipe$2,
                (code3) => {
                  let _pipe$32 = utf_codepoint_list_to_string(toList([code3]));
                  return new Some(_pipe$32);
                }
              );
              return unwrap2(_pipe$3, new None());
            } else if (tok instanceof ReferenceHexCode) {
              let code2 = tok.code;
              let _pipe = code2;
              let _pipe$1 = base_parse(_pipe, 16);
              let _pipe$2 = try$(_pipe$1, utf_codepoint);
              let _pipe$3 = map4(
                _pipe$2,
                (code3) => {
                  let _pipe$32 = utf_codepoint_list_to_string(toList([code3]));
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
        optional(one_of(toList([text_content(), reference()]))),
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
      let content = _block;
      return return$(new Text2(content));
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
        let name = tok[0];
        return new Some(name);
      } else {
        return new None();
      }
    }
  );
}
function attribute_value() {
  return do$(
    one_of(
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
            one_of(
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
    (name) => {
      return do$(
        token3(new Equals()),
        (_) => {
          return do$(
            attribute_value(),
            (value2) => {
              return return$([name, value2]);
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
function tag_end(name) {
  return do$(
    take_while((t) => {
      return isEqual(t, new Text(" "));
    }),
    (_) => {
      return do$(
        token3(new TagEnd(name)),
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
        (values3) => {
          return do$(
            token3(new CommentEnd()),
            (_2) => {
              return return$(new Comment2(join(values3, "")));
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
        (values3) => {
          return do$(
            token3(new CDATAClose()),
            (_2) => {
              return return$(new Text2(join(values3, "")));
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
          one_of(toList([tag(), text(), comment(), cdata()]))
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
    (name) => {
      return do$(
        attributes(),
        (attrs) => {
          return do$(
            one_of(toList([simple_tag(name), self_closing_tag()])),
            (children2) => {
              return return$(new Element2(name, attrs, children2));
            }
          );
        }
      );
    }
  );
}
function simple_tag(name) {
  return do$(
    token3(new TagClose()),
    (_) => {
      return do$(
        children(),
        (children2) => {
          return do$(
            tag_end(name),
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
            if (node instanceof Element2) {
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
        let name = $;
        let rest = path.tail;
        let _block;
        let _pipe = nodes;
        _block = flat_map(
          _pipe,
          (node) => {
            if (node instanceof Element2) {
              let children3 = node.children;
              let _pipe$1 = children3;
              return filter_map(
                _pipe$1,
                (child) => {
                  if (child instanceof Element2) {
                    let n = child.name;
                    if (n === name) {
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
function get_nodes(root3, path) {
  if (root3 instanceof Element2) {
    if (path instanceof Empty) {
      return toList([]);
    } else {
      let n = root3.name;
      let name = path.head;
      if (n === name) {
        let rest = path.tail;
        return do_get_nodes(rest, toList([root3]));
      } else {
        return toList([]);
      }
    }
  } else {
    return toList([]);
  }
}
function get_node(root3, path) {
  let nodes = get_nodes(root3, path);
  if (nodes instanceof Empty) {
    return new Error("No node found at path " + join(path, "/"));
  } else {
    let node = nodes.head;
    return new Ok(node);
  }
}
function get_attribute(node, name) {
  if (node instanceof Element2) {
    let attrs = node.attrs;
    let _pipe = attrs;
    let _pipe$1 = map_get(_pipe, name);
    return replace_error(_pipe$1, "No attribute with name " + name);
  } else {
    return new Error("Node is not an element");
  }
}
function get_texts(node) {
  if (node instanceof Element2) {
    let children2 = node.children;
    let _pipe = children2;
    return filter_map(
      _pipe,
      (child) => {
        if (child instanceof Text2) {
          let content = child.content;
          return new Ok(content);
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
  constructor(title2, description, name, link) {
    super();
    this.title = title2;
    this.description = description;
    this.name = name;
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
            (name) => {
              return try$(
                get_required_text(node, toList(["textInput", "link"])),
                (link) => {
                  return new Ok(
                    new RssTextInput(title2, description, name, link)
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

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var document2 = () => globalThis?.document;
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);
var option_none = /* @__PURE__ */ new None();

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
  constructor(kind, name, value2) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value2;
  }
};
var Property = class extends CustomType {
  constructor(kind, name, value2) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value2;
  }
};
var Event2 = class extends CustomType {
  constructor(kind, name, handler, include, prevent_default, stop_propagation, immediate, debounce, throttle) {
    super();
    this.kind = kind;
    this.name = name;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.immediate = immediate;
    this.debounce = debounce;
    this.throttle = throttle;
  }
};
var Handler = class extends CustomType {
  constructor(prevent_default, stop_propagation, message2) {
    super();
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.message = message2;
  }
};
var Never = class extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
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
                  let style2 = $4.value;
                  let value2 = style1 + ";" + style2;
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
function attribute2(name, value2) {
  return new Attribute(attribute_kind, name, value2);
}
var property_kind = 1;
var event_kind = 2;
function event(name, handler, include, prevent_default, stop_propagation, immediate, debounce, throttle) {
  return new Event2(
    event_kind,
    name,
    handler,
    include,
    prevent_default,
    stop_propagation,
    immediate,
    debounce,
    throttle
  );
}
var never_kind = 0;
var never = /* @__PURE__ */ new Never(never_kind);
var always_kind = 2;

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute3(name, value2) {
  return attribute2(name, value2);
}
function id(value2) {
  return attribute3("id", value2);
}
function href(url) {
  return attribute3("href", url);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(synchronous, before_paint2, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint2;
    this.after_paint = after_paint;
  }
};
var empty4 = /* @__PURE__ */ new Effect(
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([])
);
function none() {
  return empty4;
}
function from(effect) {
  let task = (actions) => {
    let dispatch2 = actions.dispatch;
    return effect(dispatch2);
  };
  let _record = empty4;
  return new Effect(toList([task]), _record.before_paint, _record.after_paint);
}
function batch(effects) {
  return fold2(
    effects,
    empty4,
    (acc, eff) => {
      return new Effect(
        fold2(eff.synchronous, acc.synchronous, prepend2),
        fold2(eff.before_paint, acc.before_paint, prepend2),
        fold2(eff.after_paint, acc.after_paint, prepend2)
      );
    }
  );
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty5() {
  return null;
}
function get3(map10, key3) {
  const value2 = map10?.get(key3);
  if (value2 != null) {
    return new Ok(value2);
  } else {
    return new Error(void 0);
  }
}
function has_key2(map10, key3) {
  return map10 && map10.has(key3);
}
function insert2(map10, key3, value2) {
  map10 ??= /* @__PURE__ */ new Map();
  map10.set(key3, value2);
  return map10;
}
function remove(map10, key3) {
  map10?.delete(key3);
  return map10;
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
var Root = class extends CustomType {
};
var Key = class extends CustomType {
  constructor(key3, parent) {
    super();
    this.key = key3;
    this.parent = parent;
  }
};
var Index = class extends CustomType {
  constructor(index4, parent) {
    super();
    this.index = index4;
    this.parent = parent;
  }
};
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates instanceof Empty) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return true;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function add2(parent, index4, key3) {
  if (key3 === "") {
    return new Index(index4, parent);
  } else {
    return new Key(key3, parent);
  }
}
var root2 = /* @__PURE__ */ new Root();
var separator_element = "	";
function do_to_string(loop$path, loop$acc) {
  while (true) {
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      if (acc instanceof Empty) {
        return "";
      } else {
        let segments = acc.tail;
        return concat2(segments);
      }
    } else if (path instanceof Key) {
      let key3 = path.key;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(separator_element, prepend(key3, acc));
    } else {
      let index4 = path.index;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(
        separator_element,
        prepend(to_string(index4), acc)
      );
    }
  }
}
function to_string3(path) {
  return do_to_string(path, toList([]));
}
function matches(path, candidates) {
  if (candidates instanceof Empty) {
    return false;
  } else {
    return do_matches(to_string3(path), candidates);
  }
}
var separator_event = "\n";
function event2(path, event4) {
  return do_to_string(path, toList([separator_event, event4]));
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key3, mapper, children2, keyed_children) {
    super();
    this.kind = kind;
    this.key = key3;
    this.mapper = mapper;
    this.children = children2;
    this.keyed_children = keyed_children;
  }
};
var Element3 = class extends CustomType {
  constructor(kind, key3, mapper, namespace, tag2, attributes2, children2, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key3;
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
  constructor(kind, key3, mapper, content) {
    super();
    this.kind = kind;
    this.key = key3;
    this.mapper = mapper;
    this.content = content;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key3, mapper, namespace, tag2, attributes2, inner_html) {
    super();
    this.kind = kind;
    this.key = key3;
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
function to_keyed(key3, node) {
  if (node instanceof Fragment) {
    let _record = node;
    return new Fragment(
      _record.kind,
      key3,
      _record.mapper,
      _record.children,
      _record.keyed_children
    );
  } else if (node instanceof Element3) {
    let _record = node;
    return new Element3(
      _record.kind,
      key3,
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
    return new Text3(_record.kind, key3, _record.mapper, _record.content);
  } else {
    let _record = node;
    return new UnsafeInnerHtml(
      _record.kind,
      key3,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.inner_html
    );
  }
}
var fragment_kind = 0;
function fragment(key3, mapper, children2, keyed_children) {
  return new Fragment(fragment_kind, key3, mapper, children2, keyed_children);
}
var element_kind = 1;
function element(key3, mapper, namespace, tag2, attributes2, children2, keyed_children, self_closing, void$) {
  return new Element3(
    element_kind,
    key3,
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
function text2(key3, mapper, content) {
  return new Text3(text_kind, key3, mapper, content);
}
var unsafe_inner_html_kind = 3;

// build/dev/javascript/lustre/lustre/internals/equals.ffi.mjs
var isReferenceEqual = (a2, b) => a2 === b;
var isEqual2 = (a2, b) => {
  if (a2 === b) {
    return true;
  }
  if (a2 == null || b == null) {
    return false;
  }
  const type = typeof a2;
  if (type !== typeof b) {
    return false;
  }
  if (type !== "object") {
    return false;
  }
  const ctor = a2.constructor;
  if (ctor !== b.constructor) {
    return false;
  }
  if (Array.isArray(a2)) {
    return areArraysEqual(a2, b);
  }
  return areObjectsEqual(a2, b);
};
var areArraysEqual = (a2, b) => {
  let index4 = a2.length;
  if (index4 !== b.length) {
    return false;
  }
  while (index4--) {
    if (!isEqual2(a2[index4], b[index4])) {
      return false;
    }
  }
  return true;
};
var areObjectsEqual = (a2, b) => {
  const properties = Object.keys(a2);
  let index4 = properties.length;
  if (Object.keys(b).length !== index4) {
    return false;
  }
  while (index4--) {
    const property3 = properties[index4];
    if (!Object.hasOwn(b, property3)) {
      return false;
    }
    if (!isEqual2(a2[property3], b[property3])) {
      return false;
    }
  }
  return true;
};

// build/dev/javascript/lustre/lustre/vdom/events.mjs
var Events = class extends CustomType {
  constructor(handlers, dispatched_paths, next_dispatched_paths) {
    super();
    this.handlers = handlers;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
};
function new$5() {
  return new Events(
    empty5(),
    empty_list,
    empty_list
  );
}
function tick(events) {
  return new Events(
    events.handlers,
    events.next_dispatched_paths,
    empty_list
  );
}
function do_remove_event(handlers, path, name) {
  return remove(handlers, event2(path, name));
}
function remove_event(events, path, name) {
  let handlers = do_remove_event(events.handlers, path, name);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function remove_attributes(handlers, path, attributes2) {
  return fold2(
    attributes2,
    handlers,
    (events, attribute4) => {
      if (attribute4 instanceof Event2) {
        let name = attribute4.name;
        return do_remove_event(events, path, name);
      } else {
        return events;
      }
    }
  );
}
function handle(events, path, name, event4) {
  let next_dispatched_paths = prepend(path, events.next_dispatched_paths);
  let _block;
  let _record = events;
  _block = new Events(
    _record.handlers,
    _record.dispatched_paths,
    next_dispatched_paths
  );
  let events$1 = _block;
  let $ = get3(
    events$1.handlers,
    path + separator_event + name
  );
  if ($ instanceof Ok) {
    let handler = $[0];
    return [events$1, run(event4, handler)];
  } else {
    return [events$1, new Error(toList([]))];
  }
}
function has_dispatched_events(events, path) {
  return matches(path, events.dispatched_paths);
}
function do_add_event(handlers, mapper, path, name, handler) {
  return insert2(
    handlers,
    event2(path, name),
    map3(
      handler,
      (handler2) => {
        let _record = handler2;
        return new Handler(
          _record.prevent_default,
          _record.stop_propagation,
          identity2(mapper)(handler2.message)
        );
      }
    )
  );
}
function add_event(events, mapper, path, name, handler) {
  let handlers = do_add_event(events.handlers, mapper, path, name, handler);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_attributes(handlers, mapper, path, attributes2) {
  return fold2(
    attributes2,
    handlers,
    (events, attribute4) => {
      if (attribute4 instanceof Event2) {
        let name = attribute4.name;
        let handler = attribute4.handler;
        return do_add_event(events, mapper, path, name, handler);
      } else {
        return events;
      }
    }
  );
}
function compose_mapper(mapper, child_mapper) {
  let $ = isReferenceEqual(mapper, identity2);
  let $1 = isReferenceEqual(child_mapper, identity2);
  if ($1) {
    return mapper;
  } else if ($) {
    return child_mapper;
  } else {
    return (msg) => {
      return mapper(child_mapper(msg));
    };
  }
}
function do_remove_children(loop$handlers, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let path = loop$path;
    let child_index = loop$child_index;
    let children2 = loop$children;
    if (children2 instanceof Empty) {
      return handlers;
    } else {
      let child = children2.head;
      let rest = children2.tail;
      let _pipe = handlers;
      let _pipe$1 = do_remove_child(_pipe, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$path = path;
      loop$child_index = child_index + 1;
      loop$children = rest;
    }
  }
}
function do_remove_child(handlers, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children2 = child.children;
    let path = add2(parent, child_index, child.key);
    return do_remove_children(handlers, path, 0, children2);
  } else if (child instanceof Element3) {
    let attributes2 = child.attributes;
    let children2 = child.children;
    let path = add2(parent, child_index, child.key);
    let _pipe = handlers;
    let _pipe$1 = remove_attributes(_pipe, path, attributes2);
    return do_remove_children(_pipe$1, path, 0, children2);
  } else if (child instanceof Text3) {
    return handlers;
  } else {
    let attributes2 = child.attributes;
    let path = add2(parent, child_index, child.key);
    return remove_attributes(handlers, path, attributes2);
  }
}
function remove_child(events, parent, child_index, child) {
  let handlers = do_remove_child(events.handlers, parent, child_index, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function do_add_children(loop$handlers, loop$mapper, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let mapper = loop$mapper;
    let path = loop$path;
    let child_index = loop$child_index;
    let children2 = loop$children;
    if (children2 instanceof Empty) {
      return handlers;
    } else {
      let child = children2.head;
      let rest = children2.tail;
      let _pipe = handlers;
      let _pipe$1 = do_add_child(_pipe, mapper, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$mapper = mapper;
      loop$path = path;
      loop$child_index = child_index + 1;
      loop$children = rest;
    }
  }
}
function do_add_child(handlers, mapper, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children2 = child.children;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return do_add_children(handlers, composed_mapper, path, 0, children2);
  } else if (child instanceof Element3) {
    let attributes2 = child.attributes;
    let children2 = child.children;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let _pipe = handlers;
    let _pipe$1 = add_attributes(_pipe, composed_mapper, path, attributes2);
    return do_add_children(_pipe$1, composed_mapper, path, 0, children2);
  } else if (child instanceof Text3) {
    return handlers;
  } else {
    let attributes2 = child.attributes;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return add_attributes(handlers, composed_mapper, path, attributes2);
  }
}
function add_child(events, mapper, parent, index4, child) {
  let handlers = do_add_child(events.handlers, mapper, parent, index4, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_children(events, mapper, path, child_index, children2) {
  let handlers = do_add_children(
    events.handlers,
    mapper,
    path,
    child_index,
    children2
  );
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
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
    empty5(),
    false,
    false
  );
}
function text3(content) {
  return text2("", identity2, content);
}
function none2() {
  return text2("", identity2, "");
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text4(content) {
  return text3(content);
}
function h2(attrs, children2) {
  return element2("h2", attrs, children2);
}
function div(attrs, children2) {
  return element2("div", attrs, children2);
}
function li(attrs, children2) {
  return element2("li", attrs, children2);
}
function p(attrs, children2) {
  return element2("p", attrs, children2);
}
function ul(attrs, children2) {
  return element2("ul", attrs, children2);
}
function a(attrs, children2) {
  return element2("a", attrs, children2);
}
function button(attrs, children2) {
  return element2("button", attrs, children2);
}
function input(attrs) {
  return element2("input", attrs, empty_list);
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
var Patch2 = class extends CustomType {
  constructor(index4, removed, changes, children2) {
    super();
    this.index = index4;
    this.removed = removed;
    this.changes = changes;
    this.children = children2;
  }
};
var ReplaceText = class extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
};
var ReplaceInnerHtml = class extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
};
var Update = class extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
};
var Move = class extends CustomType {
  constructor(kind, key3, before) {
    super();
    this.kind = kind;
    this.key = key3;
    this.before = before;
  }
};
var Replace = class extends CustomType {
  constructor(kind, index4, with$) {
    super();
    this.kind = kind;
    this.index = index4;
    this.with = with$;
  }
};
var Remove = class extends CustomType {
  constructor(kind, index4) {
    super();
    this.kind = kind;
    this.index = index4;
  }
};
var Insert = class extends CustomType {
  constructor(kind, children2, before) {
    super();
    this.kind = kind;
    this.children = children2;
    this.before = before;
  }
};
function new$7(index4, removed, changes, children2) {
  return new Patch2(index4, removed, changes, children2);
}
var replace_text_kind = 0;
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
var replace_inner_html_kind = 1;
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
var update_kind = 2;
function update2(added, removed) {
  return new Update(update_kind, added, removed);
}
var move_kind = 3;
function move(key3, before) {
  return new Move(move_kind, key3, before);
}
var remove_kind = 4;
function remove2(index4) {
  return new Remove(remove_kind, index4);
}
var replace_kind = 5;
function replace4(index4, with$) {
  return new Replace(replace_kind, index4, with$);
}
var insert_kind = 6;
function insert3(children2, before) {
  return new Insert(insert_kind, children2, before);
}

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
var Diff = class extends CustomType {
  constructor(patch, events) {
    super();
    this.patch = patch;
    this.events = events;
  }
};
var AttributeChange = class extends CustomType {
  constructor(added, removed, events) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events;
  }
};
function is_controlled(events, namespace, tag2, path) {
  if (tag2 === "input") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag2 === "select") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag2 === "textarea") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$mapper, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let mapper = loop$mapper;
    let events = loop$events;
    let old = loop$old;
    let new$10 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (new$10 instanceof Empty) {
      if (old instanceof Empty) {
        return new AttributeChange(added, removed, events);
      } else {
        let $ = old.head;
        if ($ instanceof Event2) {
          let prev = $;
          let old$1 = old.tail;
          let name = $.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = old$1;
          loop$new = new$10;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let prev = $;
          let old$1 = old.tail;
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = old$1;
          loop$new = new$10;
          loop$added = added;
          loop$removed = removed$1;
        }
      }
    } else if (old instanceof Empty) {
      let $ = new$10.head;
      if ($ instanceof Event2) {
        let next2 = $;
        let new$1 = new$10.tail;
        let name = $.name;
        let handler = $.handler;
        let added$1 = prepend(next2, added);
        let events$1 = add_event(events, mapper, path, name, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let next2 = $;
        let new$1 = new$10.tail;
        let added$1 = prepend(next2, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      }
    } else {
      let next2 = new$10.head;
      let remaining_new = new$10.tail;
      let prev = old.head;
      let remaining_old = old.tail;
      let $ = compare3(prev, next2);
      if ($ instanceof Lt) {
        if (prev instanceof Event2) {
          let name = prev.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = new$10;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = remaining_old;
          loop$new = new$10;
          loop$added = added;
          loop$removed = removed$1;
        }
      } else if ($ instanceof Eq) {
        if (next2 instanceof Attribute) {
          if (prev instanceof Attribute) {
            let _block;
            let $1 = next2.name;
            if ($1 === "value") {
              _block = controlled || prev.value !== next2.value;
            } else if ($1 === "checked") {
              _block = controlled || prev.value !== next2.value;
            } else if ($1 === "selected") {
              _block = controlled || prev.value !== next2.value;
            } else {
              _block = prev.value !== next2.value;
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next2, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name = prev.name;
            let added$1 = prepend(next2, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next2, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (next2 instanceof Property) {
          if (prev instanceof Property) {
            let _block;
            let $1 = next2.name;
            if ($1 === "scrollLeft") {
              _block = true;
            } else if ($1 === "scrollRight") {
              _block = true;
            } else if ($1 === "value") {
              _block = controlled || !isEqual2(
                prev.value,
                next2.value
              );
            } else if ($1 === "checked") {
              _block = controlled || !isEqual2(
                prev.value,
                next2.value
              );
            } else if ($1 === "selected") {
              _block = controlled || !isEqual2(
                prev.value,
                next2.value
              );
            } else {
              _block = !isEqual2(prev.value, next2.value);
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next2, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name = prev.name;
            let added$1 = prepend(next2, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next2, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (prev instanceof Event2) {
          let name = next2.name;
          let handler = next2.handler;
          let has_changes = prev.prevent_default.kind !== next2.prevent_default.kind || prev.stop_propagation.kind !== next2.stop_propagation.kind || prev.immediate !== next2.immediate || prev.debounce !== next2.debounce || prev.throttle !== next2.throttle;
          let _block;
          if (has_changes) {
            _block = prepend(next2, added);
          } else {
            _block = added;
          }
          let added$1 = _block;
          let events$1 = add_event(events, mapper, path, name, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let name = next2.name;
          let handler = next2.handler;
          let added$1 = prepend(next2, added);
          let removed$1 = prepend(prev, removed);
          let events$1 = add_event(events, mapper, path, name, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed$1;
        }
      } else if (next2 instanceof Event2) {
        let name = next2.name;
        let handler = next2.handler;
        let added$1 = prepend(next2, added);
        let events$1 = add_event(events, mapper, path, name, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let added$1 = prepend(next2, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      }
    }
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$path, loop$changes, loop$children, loop$mapper, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$10 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let path = loop$path;
    let changes = loop$changes;
    let children2 = loop$children;
    let mapper = loop$mapper;
    let events = loop$events;
    if (new$10 instanceof Empty) {
      if (old instanceof Empty) {
        return new Diff(
          new Patch2(patch_index, removed, changes, children2),
          events
        );
      } else {
        let prev = old.head;
        let old$1 = old.tail;
        let _block;
        let $ = prev.key === "" || !has_key2(moved, prev.key);
        if ($) {
          _block = removed + 1;
        } else {
          _block = removed;
        }
        let removed$1 = _block;
        let events$1 = remove_child(events, path, node_index, prev);
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$10;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed$1;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes;
        loop$children = children2;
        loop$mapper = mapper;
        loop$events = events$1;
      }
    } else if (old instanceof Empty) {
      let events$1 = add_children(
        events,
        mapper,
        path,
        node_index,
        new$10
      );
      let insert4 = insert3(new$10, node_index - moved_offset);
      let changes$1 = prepend(insert4, changes);
      return new Diff(
        new Patch2(patch_index, removed, changes$1, children2),
        events$1
      );
    } else {
      let next2 = new$10.head;
      let prev = old.head;
      if (prev.key !== next2.key) {
        let new_remaining = new$10.tail;
        let old_remaining = old.tail;
        let next_did_exist = get3(old_keyed, next2.key);
        let prev_does_exist = has_key2(new_keyed, prev.key);
        if (next_did_exist instanceof Ok) {
          if (prev_does_exist) {
            let match = next_did_exist[0];
            let $ = has_key2(moved, prev.key);
            if ($) {
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new$10;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - 1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children2;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let before = node_index - moved_offset;
              let changes$1 = prepend(
                move(next2.key, before),
                changes
              );
              let moved$1 = insert2(moved, next2.key, void 0);
              let moved_offset$1 = moved_offset + 1;
              loop$old = prepend(match, old);
              loop$old_keyed = old_keyed;
              loop$new = new$10;
              loop$new_keyed = new_keyed;
              loop$moved = moved$1;
              loop$moved_offset = moved_offset$1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes$1;
              loop$children = children2;
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let index4 = node_index - moved_offset;
            let changes$1 = prepend(remove2(index4), changes);
            let events$1 = remove_child(events, path, node_index, prev);
            let moved_offset$1 = moved_offset - 1;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new$10;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset$1;
            loop$removed = removed;
            loop$node_index = node_index;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes$1;
            loop$children = children2;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if (prev_does_exist) {
          let before = node_index - moved_offset;
          let events$1 = add_child(
            events,
            mapper,
            path,
            node_index,
            next2
          );
          let insert4 = insert3(toList([next2]), before);
          let changes$1 = prepend(insert4, changes);
          loop$old = old;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset + 1;
          loop$removed = removed;
          loop$node_index = node_index + 1;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = changes$1;
          loop$children = children2;
          loop$mapper = mapper;
          loop$events = events$1;
        } else {
          let change = replace4(node_index - moved_offset, next2);
          let _block;
          let _pipe = events;
          let _pipe$1 = remove_child(_pipe, path, node_index, prev);
          _block = add_child(_pipe$1, mapper, path, node_index, next2);
          let events$1 = _block;
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset;
          loop$removed = removed;
          loop$node_index = node_index + 1;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = prepend(change, changes);
          loop$children = children2;
          loop$mapper = mapper;
          loop$events = events$1;
        }
      } else {
        let $ = old.head;
        if ($ instanceof Fragment) {
          let $1 = new$10.head;
          if ($1 instanceof Fragment) {
            let next$1 = $1;
            let new$1 = new$10.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child_path = add2(path, node_index, next$1.key);
            let child = do_diff(
              prev$1.children,
              prev$1.keyed_children,
              next$1.children,
              next$1.keyed_children,
              empty5(),
              0,
              0,
              0,
              node_index,
              child_path,
              empty_list,
              empty_list,
              composed_mapper,
              events
            );
            let _block;
            let $2 = child.patch;
            let $3 = $2.children;
            if ($3 instanceof Empty) {
              let $4 = $2.changes;
              if ($4 instanceof Empty) {
                let $5 = $2.removed;
                if ($5 === 0) {
                  _block = children2;
                } else {
                  _block = prepend(child.patch, children2);
                }
              } else {
                _block = prepend(child.patch, children2);
              }
            } else {
              _block = prepend(child.patch, children2);
            }
            let children$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes;
            loop$children = children$1;
            loop$mapper = mapper;
            loop$events = child.events;
          } else {
            let next$1 = $1;
            let new_remaining = new$10.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace4(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children2;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Element3) {
          let $1 = new$10.head;
          if ($1 instanceof Element3) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.namespace === next$1.namespace && prev$1.tag === next$1.tag) {
              let new$1 = new$10.tail;
              let old$1 = old.tail;
              let composed_mapper = compose_mapper(
                mapper,
                next$1.mapper
              );
              let child_path = add2(path, node_index, next$1.key);
              let controlled = is_controlled(
                events,
                next$1.namespace,
                next$1.tag,
                child_path
              );
              let $2 = diff_attributes(
                controlled,
                child_path,
                composed_mapper,
                events,
                prev$1.attributes,
                next$1.attributes,
                empty_list,
                empty_list
              );
              let added_attrs = $2.added;
              let removed_attrs = $2.removed;
              let events$1 = $2.events;
              let _block;
              if (removed_attrs instanceof Empty) {
                if (added_attrs instanceof Empty) {
                  _block = empty_list;
                } else {
                  _block = toList([update2(added_attrs, removed_attrs)]);
                }
              } else {
                _block = toList([update2(added_attrs, removed_attrs)]);
              }
              let initial_child_changes = _block;
              let child = do_diff(
                prev$1.children,
                prev$1.keyed_children,
                next$1.children,
                next$1.keyed_children,
                empty5(),
                0,
                0,
                0,
                node_index,
                child_path,
                initial_child_changes,
                empty_list,
                composed_mapper,
                events$1
              );
              let _block$1;
              let $3 = child.patch;
              let $4 = $3.children;
              if ($4 instanceof Empty) {
                let $5 = $3.changes;
                if ($5 instanceof Empty) {
                  let $6 = $3.removed;
                  if ($6 === 0) {
                    _block$1 = children2;
                  } else {
                    _block$1 = prepend(child.patch, children2);
                  }
                } else {
                  _block$1 = prepend(child.patch, children2);
                }
              } else {
                _block$1 = prepend(child.patch, children2);
              }
              let children$1 = _block$1;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children$1;
              loop$mapper = mapper;
              loop$events = child.events;
            } else {
              let next$2 = $1;
              let new_remaining = new$10.tail;
              let prev$2 = $;
              let old_remaining = old.tail;
              let change = replace4(node_index - moved_offset, next$2);
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(
                _pipe,
                path,
                node_index,
                prev$2
              );
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next$2
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children2;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$10.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace4(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children2;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Text3) {
          let $1 = new$10.head;
          if ($1 instanceof Text3) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.content === next$1.content) {
              let new$1 = new$10.tail;
              let old$1 = old.tail;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children2;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let next$2 = $1;
              let new$1 = new$10.tail;
              let old$1 = old.tail;
              let child = new$7(
                node_index,
                0,
                toList([replace_text(next$2.content)]),
                empty_list
              );
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = prepend(child, children2);
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$10.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace4(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children2;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else {
          let $1 = new$10.head;
          if ($1 instanceof UnsafeInnerHtml) {
            let next$1 = $1;
            let new$1 = new$10.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child_path = add2(path, node_index, next$1.key);
            let $2 = diff_attributes(
              false,
              child_path,
              composed_mapper,
              events,
              prev$1.attributes,
              next$1.attributes,
              empty_list,
              empty_list
            );
            let added_attrs = $2.added;
            let removed_attrs = $2.removed;
            let events$1 = $2.events;
            let _block;
            if (removed_attrs instanceof Empty) {
              if (added_attrs instanceof Empty) {
                _block = empty_list;
              } else {
                _block = toList([update2(added_attrs, removed_attrs)]);
              }
            } else {
              _block = toList([update2(added_attrs, removed_attrs)]);
            }
            let child_changes = _block;
            let _block$1;
            let $3 = prev$1.inner_html === next$1.inner_html;
            if ($3) {
              _block$1 = child_changes;
            } else {
              _block$1 = prepend(
                replace_inner_html(next$1.inner_html),
                child_changes
              );
            }
            let child_changes$1 = _block$1;
            let _block$2;
            if (child_changes$1 instanceof Empty) {
              _block$2 = children2;
            } else {
              _block$2 = prepend(
                new$7(node_index, 0, child_changes$1, toList([])),
                children2
              );
            }
            let children$1 = _block$2;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes;
            loop$children = children$1;
            loop$mapper = mapper;
            loop$events = events$1;
          } else {
            let next$1 = $1;
            let new_remaining = new$10.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace4(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children2;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        }
      }
    }
  }
}
function diff(events, old, new$10) {
  return do_diff(
    toList([old]),
    empty5(),
    toList([new$10]),
    empty5(),
    empty5(),
    0,
    0,
    0,
    0,
    root2,
    empty_list,
    empty_list,
    identity2,
    tick(events)
  );
}

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var setTimeout = globalThis.setTimeout;
var clearTimeout = globalThis.clearTimeout;
var createElementNS = (ns, name) => document2().createElementNS(ns, name);
var createTextNode = (data) => document2().createTextNode(data);
var createDocumentFragment = () => document2().createDocumentFragment();
var insertBefore = (parent, node, reference2) => parent.insertBefore(node, reference2);
var moveBefore = SUPPORTS_MOVE_BEFORE ? (parent, node, reference2) => parent.moveBefore(node, reference2) : insertBefore;
var removeChild = (parent, child) => parent.removeChild(child);
var getAttribute = (node, name) => node.getAttribute(name);
var setAttribute = (node, name, value2) => node.setAttribute(name, value2);
var removeAttribute = (node, name) => node.removeAttribute(name);
var addEventListener = (node, name, handler, options) => node.addEventListener(name, handler, options);
var removeEventListener = (node, name, handler) => node.removeEventListener(name, handler);
var setInnerHtml = (node, innerHtml) => node.innerHTML = innerHtml;
var setData = (node, data) => node.data = data;
var meta = Symbol("lustre");
var MetadataNode = class {
  constructor(kind, parent, node, key3) {
    this.kind = kind;
    this.key = key3;
    this.parent = parent;
    this.children = [];
    this.node = node;
    this.handlers = /* @__PURE__ */ new Map();
    this.throttles = /* @__PURE__ */ new Map();
    this.debouncers = /* @__PURE__ */ new Map();
  }
  get parentNode() {
    return this.kind === fragment_kind ? this.node.parentNode : this.node;
  }
};
var insertMetadataChild = (kind, parent, node, index4, key3) => {
  const child = new MetadataNode(kind, parent, node, key3);
  node[meta] = child;
  parent?.children.splice(index4, 0, child);
  return child;
};
var getPath = (node) => {
  let path = "";
  for (let current = node[meta]; current.parent; current = current.parent) {
    if (current.key) {
      path = `${separator_element}${current.key}${path}`;
    } else {
      const index4 = current.parent.children.indexOf(current);
      path = `${separator_element}${index4}${path}`;
    }
  }
  return path.slice(1);
};
var Reconciler = class {
  #root = null;
  #dispatch = () => {
  };
  #useServerEvents = false;
  #exposeKeys = false;
  constructor(root3, dispatch2, { useServerEvents = false, exposeKeys = false } = {}) {
    this.#root = root3;
    this.#dispatch = dispatch2;
    this.#useServerEvents = useServerEvents;
    this.#exposeKeys = exposeKeys;
  }
  mount(vdom) {
    insertMetadataChild(element_kind, null, this.#root, 0, null);
    this.#insertChild(this.#root, null, this.#root[meta], 0, vdom);
  }
  push(patch) {
    this.#stack.push({ node: this.#root[meta], patch });
    this.#reconcile();
  }
  // PATCHING ------------------------------------------------------------------
  #stack = [];
  #reconcile() {
    const stack = this.#stack;
    while (stack.length) {
      const { node, patch } = stack.pop();
      const { children: childNodes } = node;
      const { changes, removed, children: childPatches } = patch;
      iterate(changes, (change) => this.#patch(node, change));
      if (removed) {
        this.#removeChildren(node, childNodes.length - removed, removed);
      }
      iterate(childPatches, (childPatch) => {
        const child = childNodes[childPatch.index | 0];
        this.#stack.push({ node: child, patch: childPatch });
      });
    }
  }
  #patch(node, change) {
    switch (change.kind) {
      case replace_text_kind:
        this.#replaceText(node, change);
        break;
      case replace_inner_html_kind:
        this.#replaceInnerHtml(node, change);
        break;
      case update_kind:
        this.#update(node, change);
        break;
      case move_kind:
        this.#move(node, change);
        break;
      case remove_kind:
        this.#remove(node, change);
        break;
      case replace_kind:
        this.#replace(node, change);
        break;
      case insert_kind:
        this.#insert(node, change);
        break;
    }
  }
  // CHANGES -------------------------------------------------------------------
  #insert(parent, { children: children2, before }) {
    const fragment3 = createDocumentFragment();
    const beforeEl = this.#getReference(parent, before);
    this.#insertChildren(fragment3, null, parent, before | 0, children2);
    insertBefore(parent.parentNode, fragment3, beforeEl);
  }
  #replace(parent, { index: index4, with: child }) {
    this.#removeChildren(parent, index4 | 0, 1);
    const beforeEl = this.#getReference(parent, index4);
    this.#insertChild(parent.parentNode, beforeEl, parent, index4 | 0, child);
  }
  #getReference(node, index4) {
    index4 = index4 | 0;
    const { children: children2 } = node;
    const childCount = children2.length;
    if (index4 < childCount) {
      return children2[index4].node;
    }
    let lastChild = children2[childCount - 1];
    if (!lastChild && node.kind !== fragment_kind) return null;
    if (!lastChild) lastChild = node;
    while (lastChild.kind === fragment_kind && lastChild.children.length) {
      lastChild = lastChild.children[lastChild.children.length - 1];
    }
    return lastChild.node.nextSibling;
  }
  #move(parent, { key: key3, before }) {
    before = before | 0;
    const { children: children2, parentNode } = parent;
    const beforeEl = children2[before].node;
    let prev = children2[before];
    for (let i = before + 1; i < children2.length; ++i) {
      const next2 = children2[i];
      children2[i] = prev;
      prev = next2;
      if (next2.key === key3) {
        children2[before] = next2;
        break;
      }
    }
    const { kind, node, children: prevChildren } = prev;
    moveBefore(parentNode, node, beforeEl);
    if (kind === fragment_kind) {
      this.#moveChildren(parentNode, prevChildren, beforeEl);
    }
  }
  #moveChildren(domParent, children2, beforeEl) {
    for (let i = 0; i < children2.length; ++i) {
      const { kind, node, children: nestedChildren } = children2[i];
      moveBefore(domParent, node, beforeEl);
      if (kind === fragment_kind) {
        this.#moveChildren(domParent, nestedChildren, beforeEl);
      }
    }
  }
  #remove(parent, { index: index4 }) {
    this.#removeChildren(parent, index4, 1);
  }
  #removeChildren(parent, index4, count) {
    const { children: children2, parentNode } = parent;
    const deleted = children2.splice(index4, count);
    for (let i = 0; i < deleted.length; ++i) {
      const { kind, node, children: nestedChildren } = deleted[i];
      removeChild(parentNode, node);
      this.#removeDebouncers(deleted[i]);
      if (kind === fragment_kind) {
        deleted.push(...nestedChildren);
      }
    }
  }
  #removeDebouncers(node) {
    const { debouncers, children: children2 } = node;
    for (const { timeout } of debouncers.values()) {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    debouncers.clear();
    iterate(children2, (child) => this.#removeDebouncers(child));
  }
  #update({ node, handlers, throttles, debouncers }, { added, removed }) {
    iterate(removed, ({ name }) => {
      if (handlers.delete(name)) {
        removeEventListener(node, name, handleEvent);
        this.#updateDebounceThrottle(throttles, name, 0);
        this.#updateDebounceThrottle(debouncers, name, 0);
      } else {
        removeAttribute(node, name);
        SYNCED_ATTRIBUTES[name]?.removed?.(node, name);
      }
    });
    iterate(added, (attribute4) => this.#createAttribute(node, attribute4));
  }
  #replaceText({ node }, { content }) {
    setData(node, content ?? "");
  }
  #replaceInnerHtml({ node }, { inner_html }) {
    setInnerHtml(node, inner_html ?? "");
  }
  // INSERT --------------------------------------------------------------------
  #insertChildren(domParent, beforeEl, metaParent, index4, children2) {
    iterate(
      children2,
      (child) => this.#insertChild(domParent, beforeEl, metaParent, index4++, child)
    );
  }
  #insertChild(domParent, beforeEl, metaParent, index4, vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = this.#createElement(metaParent, index4, vnode);
        this.#insertChildren(node, null, node[meta], 0, vnode.children);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case text_kind: {
        const node = this.#createTextNode(metaParent, index4, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case fragment_kind: {
        const head = this.#createTextNode(metaParent, index4, vnode);
        insertBefore(domParent, head, beforeEl);
        this.#insertChildren(
          domParent,
          beforeEl,
          head[meta],
          0,
          vnode.children
        );
        break;
      }
      case unsafe_inner_html_kind: {
        const node = this.#createElement(metaParent, index4, vnode);
        this.#replaceInnerHtml({ node }, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
    }
  }
  #createElement(parent, index4, { kind, key: key3, tag: tag2, namespace, attributes: attributes2 }) {
    const node = createElementNS(namespace || NAMESPACE_HTML, tag2);
    insertMetadataChild(kind, parent, node, index4, key3);
    if (this.#exposeKeys && key3) {
      setAttribute(node, "data-lustre-key", key3);
    }
    iterate(attributes2, (attribute4) => this.#createAttribute(node, attribute4));
    return node;
  }
  #createTextNode(parent, index4, { kind, key: key3, content }) {
    const node = createTextNode(content ?? "");
    insertMetadataChild(kind, parent, node, index4, key3);
    return node;
  }
  #createAttribute(node, attribute4) {
    const { debouncers, handlers, throttles } = node[meta];
    const {
      kind,
      name,
      value: value2,
      prevent_default: prevent,
      debounce: debounceDelay,
      throttle: throttleDelay
    } = attribute4;
    switch (kind) {
      case attribute_kind: {
        const valueOrDefault = value2 ?? "";
        if (name === "virtual:defaultValue") {
          node.defaultValue = valueOrDefault;
          return;
        }
        if (valueOrDefault !== getAttribute(node, name)) {
          setAttribute(node, name, valueOrDefault);
        }
        SYNCED_ATTRIBUTES[name]?.added?.(node, valueOrDefault);
        break;
      }
      case property_kind:
        node[name] = value2;
        break;
      case event_kind: {
        if (handlers.has(name)) {
          removeEventListener(node, name, handleEvent);
        }
        const passive = prevent.kind === never_kind;
        addEventListener(node, name, handleEvent, { passive });
        this.#updateDebounceThrottle(throttles, name, throttleDelay);
        this.#updateDebounceThrottle(debouncers, name, debounceDelay);
        handlers.set(name, (event4) => this.#handleEvent(attribute4, event4));
        break;
      }
    }
  }
  #updateDebounceThrottle(map10, name, delay) {
    const debounceOrThrottle = map10.get(name);
    if (delay > 0) {
      if (debounceOrThrottle) {
        debounceOrThrottle.delay = delay;
      } else {
        map10.set(name, { delay });
      }
    } else if (debounceOrThrottle) {
      const { timeout } = debounceOrThrottle;
      if (timeout) {
        clearTimeout(timeout);
      }
      map10.delete(name);
    }
  }
  #handleEvent(attribute4, event4) {
    const { currentTarget: currentTarget2, type } = event4;
    const { debouncers, throttles } = currentTarget2[meta];
    const path = getPath(currentTarget2);
    const {
      prevent_default: prevent,
      stop_propagation: stop,
      include,
      immediate
    } = attribute4;
    if (prevent.kind === always_kind) event4.preventDefault();
    if (stop.kind === always_kind) event4.stopPropagation();
    if (type === "submit") {
      event4.detail ??= {};
      event4.detail.formData = [
        ...new FormData(event4.target, event4.submitter).entries()
      ];
    }
    const data = this.#useServerEvents ? createServerEvent(event4, include ?? []) : event4;
    const throttle = throttles.get(type);
    if (throttle) {
      const now = Date.now();
      const last = throttle.last || 0;
      if (now > last + throttle.delay) {
        throttle.last = now;
        throttle.lastEvent = event4;
        this.#dispatch(data, path, type, immediate);
      }
    }
    const debounce = debouncers.get(type);
    if (debounce) {
      clearTimeout(debounce.timeout);
      debounce.timeout = setTimeout(() => {
        if (event4 === throttles.get(type)?.lastEvent) return;
        this.#dispatch(data, path, type, immediate);
      }, debounce.delay);
    }
    if (!throttle && !debounce) {
      this.#dispatch(data, path, type, immediate);
    }
  }
};
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0; i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4; list4.head; list4 = list4.tail) {
      callback(list4.head);
    }
  }
};
var handleEvent = (event4) => {
  const { currentTarget: currentTarget2, type } = event4;
  const handler = currentTarget2[meta].handlers.get(type);
  handler(event4);
};
var createServerEvent = (event4, include = []) => {
  const data = {};
  if (event4.type === "input" || event4.type === "change") {
    include.push("target.value");
  }
  if (event4.type === "submit") {
    include.push("detail.formData");
  }
  for (const property3 of include) {
    const path = property3.split(".");
    for (let i = 0, input2 = event4, output = data; i < path.length; i++) {
      if (i === path.length - 1) {
        output[path[i]] = input2[path[i]];
        break;
      }
      output = output[path[i]] ??= {};
      input2 = input2[path[i]];
    }
  }
  return data;
};
var syncedBooleanAttribute = /* @__NO_SIDE_EFFECTS__ */ (name) => {
  return {
    added(node) {
      node[name] = true;
    },
    removed(node) {
      node[name] = false;
    }
  };
};
var syncedAttribute = /* @__NO_SIDE_EFFECTS__ */ (name) => {
  return {
    added(node, value2) {
      node[name] = value2;
    }
  };
};
var SYNCED_ATTRIBUTES = {
  checked: /* @__PURE__ */ syncedBooleanAttribute("checked"),
  selected: /* @__PURE__ */ syncedBooleanAttribute("selected"),
  value: /* @__PURE__ */ syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => {
        node.focus?.();
      });
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

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
      let key3 = key_children_pairs.head[0];
      let element$1 = key_children_pairs.head[1];
      let keyed_element = to_keyed(key3, element$1);
      let _block;
      if (key3 === "") {
        _block = keyed_children;
      } else {
        _block = insert2(keyed_children, key3, keyed_element);
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
    empty5(),
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
function namespaced2(namespace, tag2, attributes2, children2) {
  let $ = extract_keyed_children(children2);
  let keyed_children = $[0];
  let children$1 = $[1];
  return element(
    "",
    identity2,
    namespace,
    tag2,
    attributes2,
    children$1,
    keyed_children,
    false,
    false
  );
}
function fragment2(children2) {
  let $ = extract_keyed_children(children2);
  let keyed_children = $[0];
  let children$1 = $[1];
  return fragment("", identity2, children$1, keyed_children);
}
function div2(attributes2, children2) {
  return element3("div", attributes2, children2);
}

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root3) => {
  const rootMeta = insertMetadataChild(element_kind, null, root3, 0, null);
  let virtualisableRootChildren = 0;
  for (let child = root3.firstChild; child; child = child.nextSibling) {
    if (canVirtualiseNode(child)) virtualisableRootChildren += 1;
  }
  if (virtualisableRootChildren === 0) {
    const placeholder = document2().createTextNode("");
    insertMetadataChild(text_kind, rootMeta, placeholder, 0, null);
    root3.replaceChildren(placeholder);
    return none2();
  }
  if (virtualisableRootChildren === 1) {
    const children3 = virtualiseChildNodes(rootMeta, root3);
    return children3.head[1];
  }
  const fragmentHead = document2().createTextNode("");
  const fragmentMeta = insertMetadataChild(fragment_kind, rootMeta, fragmentHead, 0, null);
  const children2 = virtualiseChildNodes(fragmentMeta, root3);
  root3.insertBefore(fragmentHead, root3.firstChild);
  return fragment2(children2);
};
var canVirtualiseNode = (node) => {
  switch (node.nodeType) {
    case ELEMENT_NODE:
      return true;
    case TEXT_NODE:
      return !!node.data;
    default:
      return false;
  }
};
var virtualiseNode = (meta2, node, key3, index4) => {
  if (!canVirtualiseNode(node)) {
    return null;
  }
  switch (node.nodeType) {
    case ELEMENT_NODE: {
      const childMeta = insertMetadataChild(element_kind, meta2, node, index4, key3);
      const tag2 = node.localName;
      const namespace = node.namespaceURI;
      const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
      if (isHtmlElement && INPUT_ELEMENTS.includes(tag2)) {
        virtualiseInputEvents(tag2, node);
      }
      const attributes2 = virtualiseAttributes(node);
      const children2 = virtualiseChildNodes(childMeta, node);
      const vnode = isHtmlElement ? element3(tag2, attributes2, children2) : namespaced2(namespace, tag2, attributes2, children2);
      return vnode;
    }
    case TEXT_NODE:
      insertMetadataChild(text_kind, meta2, node, index4, null);
      return text3(node.data);
    default:
      return null;
  }
};
var INPUT_ELEMENTS = ["input", "select", "textarea"];
var virtualiseInputEvents = (tag2, node) => {
  const value2 = node.value;
  const checked = node.checked;
  if (tag2 === "input" && node.type === "checkbox" && !checked) return;
  if (tag2 === "input" && node.type === "radio" && !checked) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value2) return;
  queueMicrotask(() => {
    node.value = value2;
    node.checked = checked;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (document2().activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var virtualiseChildNodes = (meta2, node) => {
  let children2 = null;
  let child = node.firstChild;
  let ptr = null;
  let index4 = 0;
  while (child) {
    const key3 = child.nodeType === ELEMENT_NODE ? child.getAttribute("data-lustre-key") : null;
    if (key3 != null) {
      child.removeAttribute("data-lustre-key");
    }
    const vnode = virtualiseNode(meta2, child, key3, index4);
    const next2 = child.nextSibling;
    if (vnode) {
      const list_node = new NonEmpty([key3 ?? "", vnode], null);
      if (ptr) {
        ptr = ptr.tail = list_node;
      } else {
        ptr = children2 = list_node;
      }
      index4 += 1;
    } else {
      node.removeChild(child);
    }
    child = next2;
  }
  if (!ptr) return empty_list;
  ptr.tail = empty_list;
  return children2;
};
var virtualiseAttributes = (node) => {
  let index4 = node.attributes.length;
  let attributes2 = empty_list;
  while (index4-- > 0) {
    const attr = node.attributes[index4];
    if (attr.name === "xmlns") {
      continue;
    }
    attributes2 = new NonEmpty(virtualiseAttribute(attr), attributes2);
  }
  return attributes2;
};
var virtualiseAttribute = (attr) => {
  const name = attr.localName;
  const value2 = attr.value;
  return attribute3(name, value2);
};

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!document2();
var Runtime = class {
  constructor(root3, [model, effects], view2, update4) {
    this.root = root3;
    this.#model = model;
    this.#view = view2;
    this.#update = update4;
    this.root.addEventListener("context-request", (event4) => {
      if (!(event4.context && event4.callback)) return;
      if (!this.#contexts.has(event4.context)) return;
      event4.stopImmediatePropagation();
      const context = this.#contexts.get(event4.context);
      if (event4.subscribe) {
        const callbackRef = new WeakRef(event4.callback);
        const unsubscribe = () => {
          context.subscribers = context.subscribers.filter(
            (subscriber) => subscriber !== callbackRef
          );
        };
        context.subscribers.push([callbackRef, unsubscribe]);
        event4.callback(context.value, unsubscribe);
      } else {
        event4.callback(context.value);
      }
    });
    this.#reconciler = new Reconciler(this.root, (event4, path, name) => {
      const [events, result] = handle(this.#events, path, name, event4);
      this.#events = events;
      if (result.isOk()) {
        const handler = result[0];
        if (handler.stop_propagation) event4.stopPropagation();
        if (handler.prevent_default) event4.preventDefault();
        this.dispatch(handler.message, false);
      }
    });
    this.#vdom = virtualise(this.root);
    this.#events = new$5();
    this.#shouldFlush = true;
    this.#tick(effects);
  }
  // PUBLIC API ----------------------------------------------------------------
  root = null;
  dispatch(msg, immediate = false) {
    this.#shouldFlush ||= immediate;
    if (this.#shouldQueue) {
      this.#queue.push(msg);
    } else {
      const [model, effects] = this.#update(this.#model, msg);
      this.#model = model;
      this.#tick(effects);
    }
  }
  emit(event4, data) {
    const target2 = this.root.host ?? this.root;
    target2.dispatchEvent(
      new CustomEvent(event4, {
        detail: data,
        bubbles: true,
        composed: true
      })
    );
  }
  // Provide a context value for any child nodes that request it using the given
  // key. If the key already exists, any existing subscribers will be notified
  // of the change. Otherwise, we store the value and wait for any `context-request`
  // events to come in.
  provide(key3, value2) {
    if (!this.#contexts.has(key3)) {
      this.#contexts.set(key3, { value: value2, subscribers: [] });
    } else {
      const context = this.#contexts.get(key3);
      context.value = value2;
      for (let i = context.subscribers.length - 1; i >= 0; i--) {
        const [subscriberRef, unsubscribe] = context.subscribers[i];
        const subscriber = subscriberRef.deref();
        if (!subscriber) {
          context.subscribers.splice(i, 1);
          continue;
        }
        subscriber(value2, unsubscribe);
      }
    }
  }
  // PRIVATE API ---------------------------------------------------------------
  #model;
  #view;
  #update;
  #vdom;
  #events;
  #reconciler;
  #contexts = /* @__PURE__ */ new Map();
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #shouldFlush = false;
  #actions = {
    dispatch: (msg, immediate) => this.dispatch(msg, immediate),
    emit: (event4, data) => this.emit(event4, data),
    select: () => {
    },
    root: () => this.root,
    provide: (key3, value2) => this.provide(key3, value2)
  };
  // A `#tick` is where we process effects and trigger any synchronous updates.
  // Once a tick has been processed a render will be scheduled if none is already.
  // p0
  #tick(effects) {
    this.#shouldQueue = true;
    while (true) {
      for (let list4 = effects.synchronous; list4.tail; list4 = list4.tail) {
        list4.head(this.#actions);
      }
      this.#beforePaint = listAppend(this.#beforePaint, effects.before_paint);
      this.#afterPaint = listAppend(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length) break;
      [this.#model, effects] = this.#update(this.#model, this.#queue.shift());
    }
    this.#shouldQueue = false;
    if (this.#shouldFlush) {
      cancelAnimationFrame(this.#renderTimer);
      this.#render();
    } else if (!this.#renderTimer) {
      this.#renderTimer = requestAnimationFrame(() => {
        this.#render();
      });
    }
  }
  #render() {
    this.#shouldFlush = false;
    this.#renderTimer = null;
    const next2 = this.#view(this.#model);
    const { patch, events } = diff(this.#events, this.#vdom, next2);
    this.#events = events;
    this.#vdom = next2;
    this.#reconciler.push(patch);
    if (this.#beforePaint instanceof NonEmpty) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
    if (this.#afterPaint instanceof NonEmpty) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      requestAnimationFrame(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
  }
};
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
function listAppend(a2, b) {
  if (a2 instanceof Empty) {
    return b;
  } else if (b instanceof Empty) {
    return a2;
  } else {
    return append2(a2, b);
  }
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
var EffectDispatchedMessage = class extends CustomType {
  constructor(message2) {
    super();
    this.message = message2;
  }
};
var EffectEmitEvent = class extends CustomType {
  constructor(name, data) {
    super();
    this.name = name;
    this.data = data;
  }
};
var SystemRequestedShutdown = class extends CustomType {
};

// build/dev/javascript/lustre/lustre/component.mjs
var Config2 = class extends CustomType {
  constructor(open_shadow_root, adopt_styles, delegates_focus, attributes2, properties, contexts, is_form_associated, on_form_autofill, on_form_reset, on_form_restore) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.delegates_focus = delegates_focus;
    this.attributes = attributes2;
    this.properties = properties;
    this.contexts = contexts;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
  }
};
function new$8(options) {
  let init2 = new Config2(
    true,
    true,
    false,
    empty_list,
    empty_list,
    empty_list,
    false,
    option_none,
    option_none,
    option_none
  );
  return fold2(
    options,
    init2,
    (config, option) => {
      return option.apply(config);
    }
  );
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
var Spa = class {
  #runtime;
  constructor(root3, [init2, effects], update4, view2) {
    this.#runtime = new Runtime(root3, [init2, effects], view2, update4);
  }
  send(message2) {
    switch (message2.constructor) {
      case EffectDispatchedMessage: {
        this.dispatch(message2.message, false);
        break;
      }
      case EffectEmitEvent: {
        this.emit(message2.name, message2.data);
        break;
      }
      case SystemRequestedShutdown:
        break;
    }
  }
  dispatch(msg, immediate) {
    this.#runtime.dispatch(msg, immediate);
  }
  emit(event4, data) {
    this.#runtime.emit(event4, data);
  }
};
var start = ({ init: init2, update: update4, view: view2 }, selector, flags) => {
  if (!is_browser()) return new Error(new NotABrowser());
  const root3 = selector instanceof HTMLElement ? selector : document2().querySelector(selector);
  if (!root3) return new Error(new ElementNotFound(selector));
  return new Ok(new Spa(root3, init2(flags), update4, view2));
};

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init2, update4, view2, config) {
    super();
    this.init = init2;
    this.update = update4;
    this.view = view2;
    this.config = config;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init2, update4, view2) {
  return new App(init2, update4, view2, new$8(empty_list));
}
function start3(app, selector, start_args) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, start_args);
    }
  );
}

// build/dev/javascript/lustre/lustre/event.mjs
function is_immediate_event(name) {
  if (name === "input") {
    return true;
  } else if (name === "change") {
    return true;
  } else if (name === "focus") {
    return true;
  } else if (name === "focusin") {
    return true;
  } else if (name === "focusout") {
    return true;
  } else if (name === "blur") {
    return true;
  } else if (name === "select") {
    return true;
  } else {
    return false;
  }
}
function on(name, handler) {
  return event(
    name,
    map3(handler, (msg) => {
      return new Handler(false, false, msg);
    }),
    empty_list,
    never,
    never,
    is_immediate_event(name),
    0,
    0
  );
}
function on_click(msg) {
  return on("click", success(msg));
}

// build/dev/javascript/plinth/console_ffi.mjs
function log2(value2) {
  console.log(value2);
}
function error(value2) {
  console.error(value2);
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
  } catch (error2) {
    return new Error(new NetworkError(error2.toString()));
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
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD") options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList) headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body2;
  try {
    body2 = await response.body.text();
  } catch (error2) {
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
function send2(request) {
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

// build/dev/javascript/rsvp/rsvp.mjs
var BadBody = class extends CustomType {
};
var BadUrl = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var HttpError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var JsonError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var NetworkError2 = class extends CustomType {
};
var UnhandledResponse = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Handler2 = class extends CustomType {
  constructor(run3) {
    super();
    this.run = run3;
  }
};
function expect_ok_response(handler) {
  return new Handler2(
    (result) => {
      return handler(
        try$(
          result,
          (response) => {
            let $ = response.status;
            let code2 = $;
            if (code2 >= 200 && code2 < 300) {
              return new Ok(response);
            } else {
              let code$1 = $;
              if (code$1 >= 400 && code$1 < 600) {
                return new Error(new HttpError(response));
              } else {
                return new Error(new UnhandledResponse(response));
              }
            }
          }
        )
      );
    }
  );
}
function do_send(request, handler) {
  return from(
    (dispatch2) => {
      let _pipe = send2(request);
      let _pipe$1 = try_await(_pipe, read_text_body);
      let _pipe$2 = map_promise(
        _pipe$1,
        (_capture) => {
          return map_error(
            _capture,
            (error2) => {
              if (error2 instanceof NetworkError) {
                return new NetworkError2();
              } else if (error2 instanceof UnableToReadBody) {
                return new BadBody();
              } else {
                return new BadBody();
              }
            }
          );
        }
      );
      let _pipe$3 = map_promise(_pipe$2, handler.run);
      tap(_pipe$3, dispatch2);
      return void 0;
    }
  );
}
function send3(request, handler) {
  return do_send(request, handler);
}

// build/dev/javascript/plinth/storage_ffi.mjs
function localStorage() {
  try {
    if (globalThis.Storage && globalThis.localStorage instanceof globalThis.Storage) {
      return new Ok(globalThis.localStorage);
    } else {
      return new Error(null);
    }
  } catch {
    return new Error(null);
  }
}
function getItem(storage, keyName) {
  return null_or(storage.getItem(keyName));
}
function setItem(storage, keyName, keyValue) {
  try {
    storage.setItem(keyName, keyValue);
    return new Ok(null);
  } catch {
    return new Error(null);
  }
}
function null_or(val) {
  if (val !== null) {
    return new Ok(val);
  } else {
    return new Error(null);
  }
}

// build/dev/javascript/rss_reader/rss_reader/feeds.mjs
function get4() {
  let $ = localStorage();
  if ($ instanceof Ok) {
    let store = $[0];
    let _pipe = getItem(store, "feed_urls");
    let _pipe$1 = unwrap2(_pipe, "");
    let _pipe$2 = split2(_pipe$1, ";");
    let _pipe$3 = unique(_pipe$2);
    let _pipe$4 = filter(_pipe$3, (s) => {
      return s !== "";
    });
    return new Ok(_pipe$4);
  } else {
    return new Error("Local storage not available");
  }
}
function set(urls) {
  let $ = localStorage();
  if ($ instanceof Ok) {
    let store = $[0];
    let _block;
    let _pipe = urls;
    let _pipe$1 = unique(_pipe);
    _block = join(_pipe$1, ";");
    let value2 = _block;
    let _pipe$2 = setItem(store, "feed_urls", value2);
    return replace_error(_pipe$2, "Failed to save feed URLs");
  } else {
    return new Error("Local storage not available");
  }
}

// build/dev/javascript/plinth/document_ffi.mjs
function getElementById(id2) {
  let found = document.getElementById(id2);
  if (!found) {
    return new Error();
  }
  return new Ok(found);
}

// build/dev/javascript/plinth/element_ffi.mjs
function value(element4) {
  let value2 = element4.value;
  if (value2 != void 0) {
    return new Ok(value2);
  }
  return new Error();
}

// build/dev/javascript/rss_reader/rss_reader/utils.mjs
function dispatch(msg) {
  return from((dispatch2) => {
    return dispatch2(msg);
  });
}
function get_value_from_id(id2) {
  return try$(
    getElementById(id2),
    (el) => {
      return try$(
        value(el),
        (v) => {
          let $ = trim(v);
          if ($ === "") {
            return new Error(void 0);
          } else {
            let value2 = $;
            return new Ok(value2);
          }
        }
      );
    }
  );
}

// build/dev/javascript/rss_reader/rss_reader.mjs
var FILEPATH2 = "src/rss_reader.gleam";
var Model = class extends CustomType {
  constructor(feed_urls, feed_items) {
    super();
    this.feed_urls = feed_urls;
    this.feed_items = feed_items;
  }
};
var FeedsLoaded = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var AddFeed = class extends CustomType {
};
var RemoveFeed = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var FetchFeed = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var FeedReceived = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var OnError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function init(init_state) {
  return [
    new Model(init_state, new_map()),
    from(
      (dispatch2) => {
        let $ = get4();
        if ($ instanceof Ok) {
          let urls = $[0];
          return dispatch2(new FeedsLoaded(urls));
        } else {
          let err = $[0];
          return dispatch2(new OnError(err));
        }
      }
    )
  ];
}
function view(model) {
  return div(
    toList([]),
    toList([
      div2(
        toList([]),
        map2(
          model.feed_urls,
          (url) => {
            let el = div(
              toList([on("load", success(new FetchFeed(url)))]),
              toList([
                h2(
                  toList([]),
                  toList([
                    text4(url),
                    button(
                      toList([on_click(new FetchFeed(url))]),
                      toList([text4("Reload")])
                    ),
                    button(
                      toList([on_click(new RemoveFeed(url))]),
                      toList([text4("Delete")])
                    )
                  ])
                ),
                ul(
                  toList([]),
                  (() => {
                    let _block;
                    let _pipe = map_get(model.feed_items, url);
                    _block = unwrap2(_pipe, toList([]));
                    let items = _block;
                    return map2(
                      items,
                      (item) => {
                        return li(
                          toList([]),
                          toList([
                            a(
                              (() => {
                                let _pipe$1 = map(
                                  item.link,
                                  (l) => {
                                    return toList([href(l)]);
                                  }
                                );
                                return unwrap(_pipe$1, toList([]));
                              })(),
                              toList([
                                text4(
                                  (() => {
                                    let _pipe$1 = item.title;
                                    return unwrap(_pipe$1, "No title");
                                  })()
                                )
                              ])
                            ),
                            p(
                              toList([]),
                              toList([
                                text4(
                                  (() => {
                                    let _pipe$1 = item.description;
                                    return unwrap(_pipe$1, "");
                                  })()
                                )
                              ])
                            )
                          ])
                        );
                      }
                    );
                  })()
                )
              ])
            );
            return [url, el];
          }
        )
      ),
      div(
        toList([]),
        toList([
          input(toList([id("feed-url")])),
          button(
            toList([on_click(new AddFeed())]),
            toList([text4("Add Feed")])
          )
        ])
      )
    ])
  );
}
function rsvp_error(error2) {
  if (error2 instanceof BadBody) {
    return "Bad response body";
  } else if (error2 instanceof BadUrl) {
    let url = error2[0];
    return "Bad URL: " + url;
  } else if (error2 instanceof HttpError) {
    return "HTTP error";
  } else if (error2 instanceof JsonError) {
    return "Json error";
  } else if (error2 instanceof NetworkError2) {
    return "Network error";
  } else {
    return "Response not handled";
  }
}
function fetch_feed(url, on_response) {
  let $ = to(url);
  if ($ instanceof Ok) {
    let req = $[0];
    let handler = expect_ok_response(
      (resp) => {
        let _pipe = resp;
        let _pipe$1 = map_error(_pipe, rsvp_error);
        let _pipe$2 = try$(
          _pipe$1,
          (resp2) => {
            return parse_rss(resp2.body);
          }
        );
        let _pipe$3 = map4(
          _pipe$2,
          (doc) => {
            return on_response(url, doc.channel.items);
          }
        );
        let _pipe$4 = map_error(
          _pipe$3,
          (var0) => {
            return new OnError(var0);
          }
        );
        return unwrap_both(_pipe$4);
      }
    );
    log2("Fetching feed from " + url);
    return send3(req, handler);
  } else {
    return from(
      (dispatch2) => {
        return dispatch2(new OnError("Invalid URL: " + url));
      }
    );
  }
}
function update3(model, msg) {
  if (msg instanceof FeedsLoaded) {
    let urls = msg[0];
    return [
      (() => {
        let _record = model;
        return new Model(urls, _record.feed_items);
      })(),
      batch(
        (() => {
          let _pipe = urls;
          return map2(
            _pipe,
            (url) => {
              return dispatch(new FetchFeed(url));
            }
          );
        })()
      )
    ];
  } else if (msg instanceof AddFeed) {
    let _pipe = get_value_from_id("feed-url");
    let _pipe$1 = map4(
      _pipe,
      (feed) => {
        let new_urls = prepend(feed, model.feed_urls);
        let effect = from(
          (dispatch2) => {
            let $ = set(new_urls);
            if ($ instanceof Ok) {
              return dispatch2(new FetchFeed(feed));
            } else {
              let err = $[0];
              return dispatch2(new OnError(err));
            }
          }
        );
        return [
          (() => {
            let _record = model;
            return new Model(new_urls, _record.feed_items);
          })(),
          effect
        ];
      }
    );
    return unwrap2(_pipe$1, [model, none()]);
  } else if (msg instanceof RemoveFeed) {
    let feed = msg[0];
    let _block;
    let _pipe = model.feed_urls;
    _block = filter(_pipe, (url) => {
      return url !== feed;
    });
    let urls = _block;
    let items = delete$(model.feed_items, feed);
    let effect = from(
      (dispatch2) => {
        let $ = set(urls);
        if ($ instanceof Ok) {
          return void 0;
        } else {
          let err = $[0];
          return dispatch2(new OnError(err));
        }
      }
    );
    return [new Model(urls, items), effect];
  } else if (msg instanceof FetchFeed) {
    let url = msg[0];
    return [
      model,
      fetch_feed(url, (var0, var1) => {
        return new FeedReceived(var0, var1);
      })
    ];
  } else if (msg instanceof FeedReceived) {
    let url = msg[0];
    let items = msg[1];
    return [
      (() => {
        let _record = model;
        return new Model(
          _record.feed_urls,
          insert(model.feed_items, url, items)
        );
      })(),
      none()
    ];
  } else {
    let err = msg[0];
    return [model, from((_) => {
      return error(err);
    })];
  }
}
var default_urls = /* @__PURE__ */ toList([]);
function main() {
  let app = application(init, update3, view);
  let $ = start3(app, "#app", default_urls);
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH2,
      "rss_reader",
      40,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $, start: 767, end: 825, pattern_start: 778, pattern_end: 783 }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();

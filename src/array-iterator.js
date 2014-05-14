// Copyright 2013 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


// This file relies on the fact that the following declaration has been made
// in runtime.js:
// var $Array = global.Array;


var arrayIteratorObjectSymbol = GLOBAL_PRIVATE("ArrayIterator#object");
var arrayIteratorNextIndexSymbol = GLOBAL_PRIVATE("ArrayIterator#next");
var arrayIterationKindSymbol = GLOBAL_PRIVATE("ArrayIterator#kind");


function ArrayIterator() {}


// 15.4.5.1 CreateArrayIterator Abstract Operation
function CreateArrayIterator(array, kind) {
  var object = ToObject(array);
  var iterator = new ArrayIterator;
  SET_PRIVATE(iterator, arrayIteratorObjectSymbol, object);
  SET_PRIVATE(iterator, arrayIteratorNextIndexSymbol, 0);
  SET_PRIVATE(iterator, arrayIterationKindSymbol, kind);
  return iterator;
}


// 15.19.4.3.4 CreateItrResultObject
function CreateIteratorResultObject(value, done) {
  return {value: value, done: done};
}


// 15.4.5.2.2 ArrayIterator.prototype.next( )
function ArrayIteratorNext() {
  var iterator = ToObject(this);
  var array = GET_PRIVATE(iterator, arrayIteratorObjectSymbol);
  if (!array) {
    throw MakeTypeError('incompatible_method_receiver',
                        ['Array Iterator.prototype.next']);
  }

  var index = GET_PRIVATE(iterator, arrayIteratorNextIndexSymbol);
  var itemKind = GET_PRIVATE(iterator, arrayIterationKindSymbol);
  var length = TO_UINT32(array.length);

  // "sparse" is never used.

  if (index >= length) {
    SET_PRIVATE(iterator, arrayIteratorNextIndexSymbol, INFINITY);
    return CreateIteratorResultObject(UNDEFINED, true);
  }

  SET_PRIVATE(iterator, arrayIteratorNextIndexSymbol, index + 1);

  if (itemKind == ITERATOR_KIND_VALUES)
    return CreateIteratorResultObject(array[index], false);

  if (itemKind == ITERATOR_KIND_ENTRIES)
    return CreateIteratorResultObject([index, array[index]], false);

  return CreateIteratorResultObject(index, false);
}


function ArrayEntries() {
  return CreateArrayIterator(this, ITERATOR_KIND_ENTRIES);
}


function ArrayValues() {
  return CreateArrayIterator(this, ITERATOR_KIND_VALUES);
}


function ArrayKeys() {
  return CreateArrayIterator(this, ITERATOR_KIND_KEYS);
}


function SetUpArrayIterator() {
  %CheckIsBootstrapping();

  %FunctionSetPrototype(ArrayIterator, new $Object());
  %FunctionSetInstanceClassName(ArrayIterator, 'Array Iterator');

  InstallFunctions(ArrayIterator.prototype, DONT_ENUM, $Array(
    'next', ArrayIteratorNext
  ));
}
SetUpArrayIterator();


function ExtendArrayPrototype() {
  %CheckIsBootstrapping();

  InstallFunctions($Array.prototype, DONT_ENUM, $Array(
    'entries', ArrayEntries,
    'values', ArrayValues,
    'keys', ArrayKeys
  ));
}
ExtendArrayPrototype();

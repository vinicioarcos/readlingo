'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const dictionary = require('../web/dictionary.js');

test('glosario original con al menos 400 entradas explícitas, inmutable y sin prototipo', () => {
  assert.ok(Object.keys(dictionary).length >= 400);
  assert.equal(Object.getPrototypeOf(dictionary), null);
  assert.equal(Object.isFrozen(dictionary), true);
  for (const [word, entry] of Object.entries(dictionary)) {
    assert.match(word, /^[a-z]+(?:[-'][a-z]+)?$/);
    assert.equal(entry.length, 2);
    assert.ok(entry[0].trim());
    assert.equal(entry[1], '');
    assert.equal(Object.isFrozen(entry), true);
    assert.doesNotMatch(entry[0], /[<>]/);
  }
});

test('ficción, formas verbales y plurales figuran expresamente', () => {
  for (const word of ['prince', 'rose', 'fox', 'sheep', 'desert', 'stars', 'sunset', 'tame', 'grown-ups', 'drew', 'drawing', 'boa', 'swallowed', 'elephant', 'pilot', 'planet', 'children', 'went', 'written']) {
    assert.ok(Object.hasOwn(dictionary, word), word);
  }
  assert.equal(dictionary.drew[0], 'dibujó; sacó');
  assert.equal(dictionary.stars[0], 'estrellas');
  assert.equal(dictionary["couldn't"][0], 'no podía; no podría (could not)');
});

test('polisemia visible sin fingir interpretación contextual', () => {
  assert.match(dictionary.rose[0], /rosa/);
  assert.match(dictionary.rose[0], /rise/);
  assert.match(dictionary.left[0], /izquierda/);
  assert.match(dictionary.left[0], /se fue/);
  assert.match(dictionary.saw[0], /vio/);
  assert.match(dictionary.saw[0], /sierra/);
  assert.match(dictionary.desert[0], /desierto/);
  assert.match(dictionary.desert[0], /abandonar/);
});

test('no adivina raíces ni admite propiedades heredadas como palabras', () => {
  for (const word of ['constructor', 'toString', '__proto__', 'rosewood', 'planetary', 'foxing', 'unlistedword']) {
    assert.equal(dictionary[word], undefined);
  }
});

test('el navegador recibe el mismo contrato sin módulos o red', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve('../web/dictionary.js'), 'utf8'), context);
  assert.equal(context.ReadLingoDictionary.prince[0], dictionary.prince[0]);
  assert.equal(Object.keys(context.ReadLingoDictionary).length, Object.keys(dictionary).length);
  assert.equal(Object.getPrototypeOf(context.ReadLingoDictionary), null);
});

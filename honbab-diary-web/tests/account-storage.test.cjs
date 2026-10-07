const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto').webcrypto;

// Fake transport for client tests only. Backend authentication/ownership has separate tests.
function setup(server = { carts: new Map(), diaries: new Map(), offline: false }) {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  const account = () => JSON.parse(Buffer.from(storage.getItem('accessToken').split('.')[1], 'base64url')).sub;
  const list = map => {
    const id = account();
    if (!map.has(id)) map.set(id, []);
    return map.get(id);
  };
  const snapshot = () => ({ entries: list(server.diaries), totalXp: 100 * list(server.diaries).length, lastLoginDate: null, loginStreak: 0, todayEarnedXp: 0 });
  const response = data => ({ data: JSON.parse(JSON.stringify(data)) });
  const api = {
    get: async url => {
      if (server.offline) throw new Error('offline');
      if (url === '/cart/ingredients') return response(list(server.carts));
      if (url === '/diaries') return response(snapshot());
      throw new Error('unsupported');
    },
    post: async (url, body) => {
      if (server.offline) throw new Error('offline');
      if (url === '/cart/ingredients' || url === '/cart/ingredients/import') {
        const cart = list(server.carts);
        body.forEach(item => {
          const previous = cart.find(entry => entry.id === item.id);
          if (!previous) cart.push({ ...item });
          else if (!url.endsWith('/import')) previous.quantity += item.quantity;
        });
        return response(cart);
      }
      if (url === '/diaries' || url === '/diaries/import') {
        const entries = list(server.diaries);
        const inputs = Array.isArray(body) ? body : [body];
        inputs.forEach(input => {
          if (!entries.some(entry => entry.id === input.id)) entries.push({
            ...input, isMyEntry: true, likedByMe: true, isLiked: true, likes: 1, streakDay: 1,
          });
        });
        return response(url.endsWith('/import') ? snapshot() :
          { snapshot: snapshot(), entryId: body.id, earnedXp: 100, rawEarnedXp: 100, streakBonus: 0 });
      }
      throw new Error('unsupported');
    },
    put: async () => { throw new Error('unsupported'); },
    patch: async () => { throw new Error('unsupported'); },
    delete: async () => { throw new Error('offline'); },
  };
  const cache = {};
  const context = vm.createContext({
    localStorage: storage, atob, Date, console, crypto,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    window: { dispatchEvent() {}, alert() {}, location: { assign() {} } },
  });
  function load(name) {
    if (name === './api') return { apiClient: api };
    if (cache[name]) return cache[name];
    if (name === './ingredientPricing') return {
      isFreeBasicIngredient: () => false,
      getIngredientPricing: () => ({ tiers: { value: { estimatedPrice: 100 } } }),
    };
    const file = path.resolve(__dirname, '../src/services', name.replace('./', '') + '.ts');
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const module = { exports: {} };
    vm.runInContext(`(function(require,module,exports){${source}\n})`, context)(load, module, module.exports);
    return cache[name] = module.exports;
  }
  function login(id, exp = Date.now() / 1000 + 3600) {
    storage.setItem('accessToken', 'header.' + Buffer.from(JSON.stringify({ sub: String(id), exp })).toString('base64url') + '.signature');
  }
  return { storage, load, login, api, server };
}
const recipe = { id: 10, title: 'recipe', ingredients: [{ ingredientId: 1, name: 'egg', amount: '1', unit: '' }] };

test('guest cart is merged once and another device reads the same account cart', async () => {
  const first = setup();
  const cart = first.load('./cartService').cartService;
  assert.equal(cart.getItems().length, 0);
  await cart.addFromRecipe(recipe);
  first.login(1);
  await cart.mergeGuestCart();
  await cart.mergeGuestCart();
  assert.equal(cart.getItems().length, 1);
  assert.equal(cart.getItems()[0].quantity, 1);
  const second = setup(first.server);
  second.login(1);
  const otherCart = second.load('./cartService').cartService;
  await otherCart.refresh();
  assert.equal(otherCart.getItems().length, 1);
  second.login(2);
  await otherCart.refresh();
  assert.equal(otherCart.getItems().length, 0);
});

test('failed cart migration keeps the original guest data for retry', async () => {
  const first = setup();
  const cart = first.load('./cartService').cartService;
  await cart.addFromRecipe(recipe);
  first.login(1);
  first.server.offline = true;
  await assert.rejects(cart.mergeGuestCart());
  assert.ok(first.storage.getItem('honbab_cart_ingredients:guest'));
  assert.equal(cart.getItems().length, 0);
  first.server.offline = false;
  await cart.mergeGuestCart();
  assert.equal(cart.getItems().length, 1);
  assert.equal(first.storage.getItem('honbab_cart_ingredients:guest'), null);
});

test('legacy unowned records are preserved and never assigned automatically', async () => {
  const first = setup();
  first.storage.setItem('honbab_cart_ingredients', '[{"id":"legacy"}]');
  first.login(1);
  const cart = first.load('./cartService').cartService;
  await cart.refresh();
  assert.equal(cart.getItems().length, 0);
  assert.equal(first.storage.getItem('honbab_cart_ingredients'), '[{"id":"legacy"}]');
});

test('guest diary writes fail; another device can read the owner diary but other accounts cannot', async () => {
  const first = setup();
  const diary = first.load('./diaryService').diaryService;
  const input = { recipeId: 1, recipeTitle: 'recipe', photoUrl: 'https://example.com/photo.jpg', rating: 5, comment: 'my dinner', privateDiary: 'secret' };
  await assert.rejects(diary.addDiaryEntry(input));
  first.login(1);
  await diary.addDiaryEntry(input);
  assert.equal(diary.getMyDiaries().length, 1);
  const second = setup(first.server);
  second.login(1);
  const otherDiary = second.load('./diaryService').diaryService;
  await otherDiary.refresh();
  assert.equal(otherDiary.getMyDiaries()[0].privateDiary, 'secret');
  second.login(2);
  await otherDiary.refresh();
  assert.equal(otherDiary.getMyDiaries().length, 0);
});

test('account-local diary migration is idempotent and preserves the browser backup', async () => {
  const first = setup();
  first.login(1);
  const key = 'honbab_cooking_diaries:user:1';
  first.storage.setItem(key, JSON.stringify([{ id: 'legacy_1', recipeId: 1, recipeTitle: 'recipe', photoUrl: 'https://example.com/photo.jpg', rating: 5, comment: 'dinner', createdAt: 1000 }]));
  const diary = first.load('./diaryService').diaryService;
  await diary.refresh();
  await diary.refresh();
  assert.equal(diary.getMyDiaries().length, 1);
  assert.ok(first.storage.getItem(key));
  assert.equal(first.storage.getItem(key + ':server-migrated-v2'), 'true');
});

test('failed server writes are not treated as local success', async () => {
  const first = setup();
  first.login(1);
  first.server.offline = true;
  await assert.rejects(first.load('./cartService').cartService.addFromRecipe(recipe));
  assert.equal(first.load('./cartService').cartService.getItems().length, 0);
  await assert.rejects(first.load('./diaryService').diaryService.addDiaryEntry({
    recipeId: 1, recipeTitle: 'recipe', photoUrl: 'https://example.com/photo.jpg', rating: 5, comment: 'dinner',
  }));
  assert.equal(first.load('./diaryService').diaryService.getMyDiaries().length, 0);
});

test('responses are discarded after an account switch', async () => {
  const first = setup();
  first.login(1);
  first.api.get = async () => {
    first.login(2);
    return { data: [{ id: 'private' }] };
  };
  const cart = first.load('./cartService').cartService;
  await assert.rejects(cart.refresh());
  assert.equal(cart.getItems().length, 0);
});

test('bookmarks never use old shared cache or accept failed saves', async () => {
  const first = setup();
  first.storage.setItem('honbab_local_bookmarks', '[{"id":999,"bookmarked":true}]');
  const shorts = first.load('./shortsApi').shortsApi;
  assert.equal((await shorts.getAllBookmarks()).length, 0);
  first.login(1);
  await assert.rejects(shorts.getAllBookmarks());
  assert.equal(await shorts.toggleBookmark(1, false), false);
  assert.equal(await shorts.toggleBookmark(1, true), true);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/App.js'), 'utf8');
function harness(storage = new Map(), fetcher = async () => ({ ok: true, json: async () => [] })) {
    let options; const calls = [];
    vm.runInNewContext(source, { Vue: function(value) { options = value; }, localStorage: {
        getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)
    }, crypto: webcrypto, URLSearchParams, console: { log() {}, error() {} }, fetch: async (url, init) => {
        calls.push({ url, ...init }); return fetcher(url, init);
    }});
    const app = structuredClone(options.data);
    for (const [name, method] of Object.entries(options.methods)) app[name] = method.bind(app);
    for (const [name, method] of Object.entries(options.computed)) Object.defineProperty(app, name, { get: method.bind(app) });
    const notifications = [];
    app.showNotification = (...args) => notifications.push(args); app.showSuccessModal = () => {};
    return { app, calls, storage, options, notifications };
}
const lesson = { _id: '000000000000000000000001', topic: 'Math', price: 10, spaces: 2 };
const valid = app => { app.name = 'Test Student'; app.phone = '07123456789'; };
test('cart changes never write stock and reload counts the saved cart exactly once', async () => {
    const { app, calls, storage } = harness(); app.products = [{ ...lesson }];
    app.addItem(app.products[0]); app.incrementItem(app.cart[0]);
    assert.equal(calls.length, 0, 'Cart click must not PUT stock');
    assert.equal(app.products[0].spaces, 2, 'Fetched inventory remains authoritative');
    assert.equal(app.remainingSpaces(app.products[0]), 0);
    app.decrementItem(app.cart[0]); assert.equal(app.remainingSpaces(app.products[0]), 1);
    const reloaded = harness(storage).app; reloaded.loadCartFromStorage(); reloaded.products = [{ ...lesson }];
    assert.equal(reloaded.remainingSpaces(reloaded.products[0]), 1);
    reloaded.clearCart(); assert.equal(reloaded.remainingSpaces(reloaded.products[0]), 2);
});
test('lost response and reload reuse one immutable checkout key, then clear it on success', async () => {
    const storage = new Map();
    const first = harness(storage, async (url, init) => {
        if (init?.method === 'POST') throw new Error('Response lost after commit');
        return { ok: true, json: async () => [] };
    });
    first.app.products = [{ ...lesson }]; first.app.addItem(first.app.products[0]); valid(first.app);
    await first.app.submitOrder();
    const submitted = first.calls.find(call => call.method === 'POST');
    assert.ok(submitted.headers['Idempotency-Key']);
    assert.equal(first.app.cart.length, 1);
    const second = harness(storage, async () => ({ ok: true, json: async () => ({ data: { confirmationNumber: 'ABC12345' } }) }));
    second.app.loadCartFromStorage(); valid(second.app); await second.app.submitOrder();
    assert.equal(second.calls.find(call => call.method === 'POST').headers['Idempotency-Key'], submitted.headers['Idempotency-Key']);
    assert.equal(second.app.cart.length, 0); assert.equal(storage.has('pendingCheckout'), false);
});
test('rejected checkout refreshes current availability and keeps cart available for correction', async () => {
    const { app, calls } = harness(new Map(), async (url, init) => init?.method === 'POST'
        ? { ok: false, status: 400, json: async () => ({ message: 'Not enough spaces' }) }
        : { ok: true, json: async () => [{ ...lesson, spaces: 0 }] });
    app.products = [{ ...lesson }]; app.addItem(app.products[0]); valid(app);
    await app.submitOrder();
    assert.ok(calls.some(call => call.url.includes('/api/lessons?')));
    assert.equal(app.cart.length, 1); assert.equal(app.products[0].spaces, 0);
    app.decrementItem(app.cart[0]); assert.equal(app.products[0].spaces, 0);
});
test('catalogue follows later server pages without dropping records or duplicating them', async () => {
    const all = Array.from({ length: 125 }, (_, i) => ({ ...lesson, _id: String(i), topic: `Math ${i}` }));
    const { app, calls } = harness(new Map(), async url => {
        const page = Number(new URL(url).searchParams.get('page') || 1);
        return { ok: true, json: async () => ({ status: 'success', data: { lessons: all.slice((page - 1) * 100, page * 100), pagination: { total: 125, pages: 2 } } }) };
    });
    await app.fetchProducts();
    assert.equal(app.products.length, 125); assert.equal(new Set(app.products.map(item => item._id)).size, 125);
    assert.equal(calls.length, 2); assert.match(calls[1].url, /page=2/); assert.equal(app.totalPages, 14);
});
test('superseded catalogue page two cannot overwrite a newer search', async () => {
    const pending = []; const { app } = harness(new Map(), url => new Promise(resolve => pending.push({ url, resolve })));
    const response = (topic, pages) => ({ ok: true, json: async () => ({ status: 'success', data: {
        lessons: [{ ...lesson, topic }], pagination: { total: pages * 100, pages }
    } }) });
    const old = app.fetchProducts(); pending[0].resolve(response('Old first page', 2));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(pending.length, 2);
    app.searchQuery = 'new'; const latest = app.fetchProducts(); pending[2].resolve(response('New result', 1)); await latest;
    pending[1].resolve(response('Old second page', 2)); await old;
    assert.equal(app.products[0].topic, 'New result'); assert.equal(app.loading, false);
});

test('oversized catalogues report a useful bounded-load error without committing a partial page', async () => {
    const { app, calls, notifications } = harness(new Map(), async () => ({ ok: true, json: async () => ({
        status: 'success', data: { lessons: [lesson], pagination: { total: 10200, pages: 102 } }
    }) }));
    await app.fetchProducts();
    assert.equal(calls.length, 1); assert.equal(app.products.length, 0); assert.equal(app.loading, false);
    assert.match(notifications[0][1], /narrow your search/);
});
test('a failing later catalogue page cannot commit a partial catalogue', async () => {
    const { app, calls } = harness(new Map(), async url => ({ ok: !url.includes('page=2'), json: async () => ({
        status: 'success', data: { lessons: [lesson], pagination: { total: 125, pages: 2 } }
    }) }));
    await app.fetchProducts();
    assert.equal(calls.length, 2); assert.equal(app.products.length, 0); assert.equal(app.loading, false);
});
test('changing checkout payload creates a new key after a rejected attempt', async () => {
    const { app, calls } = harness(new Map(), async (url, init) => init?.method === 'POST'
        ? { ok: false, json: async () => ({ message: 'Rejected' }) }
        : { ok: true, json: async () => [] });
    app.products = [{ ...lesson }]; app.addItem(app.products[0]); valid(app);
    await app.submitOrder(); app.name = 'Different Student'; await app.submitOrder();
    const posts = calls.filter(call => call.method === 'POST');
    assert.notEqual(posts[0].headers['Idempotency-Key'], posts[1].headers['Idempotency-Key']);
});

test('checkout never posts an in-memory key whose persistent write failed', async () => {
    class FullStorage extends Map {
        set(key, value) {
            if (key === 'pendingCheckout') throw new Error('QuotaExceededError');
            return super.set(key, value);
        }
    }
    const { app, calls } = harness(new FullStorage());
    app.products = [{ ...lesson }]; app.addItem(app.products[0]); valid(app);
    await app.submitOrder(); await app.submitOrder();
    assert.equal(calls.filter(call => call.method === 'POST').length, 0, 'Every attempt requires a durable key before POST');
    assert.equal(app.pendingCheckout, null);
});

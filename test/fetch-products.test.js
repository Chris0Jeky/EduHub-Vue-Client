const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function appHarness() {
    let options;
    const requests = [];
    const notifications = [];
    const context = {
        Vue: function (value) { options = value; },
        localStorage: { getItem: () => null },
        URLSearchParams,
        console: { log() {}, error() {} },
        fetch(url) {
            return new Promise((resolve, reject) => requests.push({ url, resolve, reject }));
        }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/App.js'), 'utf8'), context);
    const app = { ...options.data };
    for (const [name, method] of Object.entries(options.methods)) app[name] = method.bind(app);
    app.showNotification = (...args) => notifications.push(args);
    return { app, requests, notifications };
}

function respond(request, topic, total = 1) {
    request.resolve({ ok: true, json: async () => ({ status: 'success', data: {
        lessons: [{ _id: topic, topic, spaces: 2 }], pagination: { total }
    } }) });
}

test('newer search results survive an older request finishing last', async () => {
    const { app, requests } = appHarness();
    app.searchQuery = 'old';
    const old = app.fetchProducts();
    app.searchQuery = 'new';
    const latest = app.fetchProducts();
    respond(requests[1], 'New result', 5);
    await latest;
    respond(requests[0], 'Old result', 20);
    await old;
    assert.equal(app.products[0].topic, 'New result');
    assert.equal(app.stats.totalLessons, 5);
    assert.equal(app.loading, false);
});

test('obsolete completion cannot clear the current request loading state', async () => {
    const { app, requests } = appHarness();
    const old = app.fetchProducts();
    const latest = app.fetchProducts();
    respond(requests[0], 'Old result');
    await old;
    assert.equal(app.loading, true);
    assert.equal(app.products.length, 0);
    respond(requests[1], 'New result');
    await latest;
    assert.equal(app.loading, false);
});

test('obsolete failures stay silent while current failures notify and clear loading', async () => {
    const { app, requests, notifications } = appHarness();
    const old = app.fetchProducts();
    const latest = app.fetchProducts();
    requests[0].reject(new Error('old request failed'));
    await old;
    assert.equal(notifications.length, 0);
    assert.equal(app.loading, true);
    requests[1].reject(new Error('current request failed'));
    await latest;
    assert.equal(notifications.length, 1);
    assert.equal(app.loading, false);
});

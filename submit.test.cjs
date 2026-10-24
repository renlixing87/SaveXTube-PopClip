const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = new AsyncFunction('popclip', 'require', fs.readFileSync(
  path.join(__dirname, 'SXTDRemote.popclipext/submit.js'), 'utf8'));
async function execute(options = {}, outcome = { data: { job_id: 'job-123' } }) {
  const calls = [], messages = [];
  const popclip = {
    options: { serverAddress: 'http://127.0.0.1:8530', apiKey: 'test-key', ...options },
    input: { text: 'https://example.com/watch?v=1&token=a%2Bb' },
    showText: text => messages.push(text),
  };
  await run(popclip, name => {
    assert.equal(name, 'axios');
    return { post: async (...args) => {
      calls.push(args);
      if (outcome instanceof Error) throw outcome;
      return outcome;
    } };
  });
  return { calls, messages };
}
test('legacy options keep Desktop authentication and URL', async () => {
  const { calls, messages } = await execute();
  assert.equal(calls[0][0], 'http://127.0.0.1:8530/download');
  assert.equal(calls[0][2].headers.Authorization, 'Bearer test-key');
  assert.equal(calls[0][2].headers['X-Key'], undefined);
  assert.equal(calls[0][2].maxRedirects, 0);
  assert.equal(calls[0][1].url, 'https://example.com/watch?v=1&token=a%2Bb');
  assert.match(messages[0], /job-123/);
});
test('Server supports root, subpath and existing API suffix', async () => {
  for (const [address, endpoint] of [
    ['https://nas.example.com/', 'https://nas.example.com/api/download'],
    ['https://nas.example.com/sxt/', 'https://nas.example.com/sxt/api/download'],
    ['https://nas.example.com/sxt/api/', 'https://nas.example.com/sxt/api/download'],
  ]) {
    const { calls } = await execute({ connectionType: 'server', serverAddress: address });
    assert.equal(calls[0][0], endpoint);
    assert.equal(calls[0][2].headers['X-Key'], 'test-key');
    assert.equal(calls[0][2].headers.Authorization, undefined);
  }
});
test('invalid settings never send requests', async () => {
  for (const options of [
    { connectionType: 'other' }, { apiKey: '' }, { serverAddress: '' },
    { serverAddress: 'file:///tmp/x' }, { serverAddress: 'https://user:pass@example.com' },
    { serverAddress: 'https://example.com/?key=secret' },
    { serverAddress: 'https://example.com/#section' },
  ]) await assert.rejects(execute(options), /Settings error/);
});
test('missing job number is reported accurately', async () => {
  await assert.rejects(execute({}, { data: {} }), /没有返回任务编号/);
});
test('Server errors and timeouts retain useful messages', async () => {
  const unauthorized = Object.assign(new Error(), { response: { status: 401, data: {} } });
  await assert.rejects(execute({ connectionType: 'server' }, unauthorized), /访问密钥不正确/);
  const denied = Object.assign(new Error(), { response: { status: 403, data: { error: 'Permission denied' } } });
  await assert.rejects(execute({}, denied), /Permission denied/);
  const timeout = Object.assign(new Error(), { code: 'ECONNABORTED' });
  await assert.rejects(execute({}, timeout), /超时/);
});

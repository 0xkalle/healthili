/* global describe afterEach it */

const { expect } = require('chai');

const fetch = require('node-fetch');

const healthili = require('../src/index.js');

let healthEndpoint = null;

describe('health endpoint', () => {
  afterEach(async () => {
    if (healthEndpoint) {
      await healthEndpoint.close();
      healthEndpoint = null;
    }
  });

  it('returns fail f returns false', async () => {
    healthEndpoint = await healthili.createEndpoint(() => false);
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(500);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'fail',
    });
  });

  it('returns fail f returns and unspecified value', async () => {
    healthEndpoint = await healthili.createEndpoint(() => 1);
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(500);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'fail',
    });
  });

  it('returns pass if f returns true', async () => {
    healthEndpoint = await healthili.createEndpoint(() => true);
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'pass',
    });
  });
  it('returns 404 on path other then the configured', async () => {
    healthEndpoint = await healthili.createEndpoint(() => true, {
      path: '/abc',
    });
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(404);
  });
  it('uses the given path', async () => {
    healthEndpoint = await healthili.createEndpoint(() => true, {
      path: '/abc',
    });
    const res = await fetch('http://localhost:3000/abc');
    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'pass',
    });
  });
  it('returns pass if f returns pass', async () => {
    healthEndpoint = await healthili.createEndpoint(() => 'pass');
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'pass',
    });
  });
  it('returns warn if f returns warn', async () => {
    healthEndpoint = await healthili.createEndpoint(() => 'warn');
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'warn',
    });
  });
  it('returns fail if f returns fail', async () => {
    healthEndpoint = await healthili.createEndpoint(() => 'fail');
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(500);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'fail',
    });
  });
  it('returns fail if f throws an error and includes error by default', async () => {
    healthEndpoint = await healthili.createEndpoint(() => {
      throw new Error('OMG');
    });
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(500);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'fail',
      output: 'OMG',
    });
  });
  it('works with async functions', async () => {
    healthEndpoint = await healthili.createEndpoint(async () => new Promise((resolve) => {
      setTimeout(resolve.bind(null, true), 500);
    }));
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'pass',
    });
  });
  it('should listen on the given port', async () => {
    healthEndpoint = await healthili.createEndpoint(() => 'pass', {
      port: 1234,
    });
    const res = await fetch('http://localhost:1234/health');
    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'pass',
    });
  });
  it('should return additional information from options', async () => {
    healthEndpoint = await healthili.createEndpoint(() => 'pass', {
      serviceId: 'sid',
      description: 'desc',
      version: 1,
      releaseId: 'foo',
    });
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'pass',
      serviceId: 'sid',
      description: 'desc',
      version: 1,
      releaseId: 'foo',
    });
  });
  it('should fail if timeout is exceeded', async () => {
    healthEndpoint = await healthili.createEndpoint(async () => new Promise((resolve) => {
      setTimeout(resolve.bind(null, true), 500);
    }), {
      timeout: 200,
    });
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(500);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'fail',
      output: 'Health function timed out after 200 ms!',
    });
  });
  it('hides a error thrown by f if hideError is true', async () => {
    healthEndpoint = await healthili.createEndpoint(() => {
      throw new Error('OMG');
    }, {
      hideError: true,
    });
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).to.equal(500);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'fail',
    });
  });
  it('is shut down by the close() function', async () => {
    healthEndpoint = await healthili.createEndpoint(() => false);
    await healthEndpoint.close();
    try {
      await fetch('http://localhost:3000/health');
    } catch (e) {
      expect(e.code).to.equal('ECONNREFUSED');
    }
    healthEndpoint = null;
  });
  it('adds a "/" to a path given without a slash', async () => {
    healthEndpoint = await healthili.createEndpoint(() => true, {
      path: 'abc',
    });
    const res = await fetch('http://localhost:3000/abc');
    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json).to.deep.equal({
      status: 'pass',
    });
  });
});

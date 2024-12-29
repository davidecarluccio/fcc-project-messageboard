const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('mongoose');
const { Thread, Reply } = require('../models/Thread');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  let threadId; // Store thread ID for testing
  let replyId; // Store reply ID for testing

  suite('API ROUTES TESTS', function () {

    // Clean the database before running tests
    before(async function () {
      await Thread.deleteMany({});
    });

    // Test creating a new thread
    test('POST /api/threads/:board', function (done) {
      chai.request(server)
        .post('/api/threads/test')
        .send({ text: 'Test thread', delete_password: 'password123' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, '_id');
          threadId = res.body._id; // Save thread ID for further tests
          done();
        });
    });

    // Test viewing the 10 most recent threads with 3 replies each
    test('GET /api/threads/:board', function (done) {
      chai.request(server)
        .get('/api/threads/test')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtMost(res.body.length, 10);
          res.body.forEach(thread => {
            assert.property(thread, '_id');
            assert.property(thread, 'text');
            assert.property(thread, 'created_on');
            assert.property(thread, 'bumped_on');
            assert.property(thread, 'replies');
            assert.isArray(thread.replies);
            assert.isAtMost(thread.replies.length, 3);
          });
          done();
        });
    });

    // Test reporting a thread
    test('PUT /api/threads/:board', function (done) {
      chai.request(server)
        .put('/api/threads/test')
        .send({ thread_id: threadId })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    // Test creating a new reply
    test('POST /api/replies/:board', function (done) {
      chai.request(server)
        .post('/api/replies/test')
        .send({ text: 'Test reply', delete_password: 'replypassword', thread_id: threadId })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, '_id');
          replyId = res.body.replies[0]._id; // Save reply ID for further tests
          done();
        });
    });

    // Test viewing a single thread with all replies
    test('GET /api/replies/:board', function (done) {
      chai.request(server)
        .get(`/api/replies/test?thread_id=${threadId}`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          done();
        });
    });

    // Test reporting a reply
    test('PUT /api/replies/:board', function (done) {
      chai.request(server)
        .put('/api/replies/test')
        .send({ thread_id: threadId, reply_id: replyId })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    // Test deleting a reply with the incorrect password
    test('DELETE /api/replies/:board with incorrect password', function (done) {
      chai.request(server)
        .delete('/api/replies/test')
        .send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrongpassword' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    // Test deleting a reply with the correct password
    test('DELETE /api/replies/:board with correct password', function (done) {
      chai.request(server)
        .delete('/api/replies/test')
        .send({ thread_id: threadId, reply_id: replyId, delete_password: 'replypassword' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    // Test deleting a thread with the incorrect password
    test('DELETE /api/threads/:board with incorrect password', function (done) {
      chai.request(server)
        .delete('/api/threads/test')
        .send({ thread_id: threadId, delete_password: 'wrongpassword' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    // Test deleting a thread with the correct password
    test('DELETE /api/threads/:board with correct password', function (done) {
      chai.request(server)
        .delete('/api/threads/test')
        .send({ thread_id: threadId, delete_password: 'password123' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

  });

});


'use strict';
const { Thread, Reply } = require("../models/Thread.js");

module.exports = function (app) {

  // THREADS ROUTES
  app.route('/api/threads/:board')

    // Create a new thread
    .post(async (req, res) => {
      const { board } = req.params;
      const { text, delete_password } = req.body;

      try {
        const thread = await Thread.create({
          board,
          text,
          delete_password,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: []
        });
        res.status(200).json(thread);
      } catch (error) {
        console.error('Error creating thread:', error);
        res.status(500).json({ error: 'Could not create thread' });
      }
    })

    // Get threads with limited replies
    .get(async (req, res) => {
      const { board } = req.params;

      try {
        const threads = await Thread.find({ board })
          .sort('-bumped_on')
          .limit(10);

        const formattedThreads = threads.map(thread => ({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.slice(-3).map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
          }))
        }));

        res.status(200).json(formattedThreads);
      } catch (error) {
        console.error('Error retrieving threads:', error);
        res.status(500).json({ error: 'Could not retrieve threads' });
      }
    })

    // Delete a thread
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;

      try {
        const thread = await Thread.findById(thread_id);
        if (thread && thread.delete_password === delete_password) {
          await Thread.findByIdAndDelete(thread_id);
          res.status(200).send('success');
        } else if (!thread) {
          res.status(200).send('Thread not found');
        } else {
          res.status(200).send('incorrect password');
        }
      } catch (error) {
        console.error('Error deleting thread:', error);
        res.status(500).json({ error: 'Could not delete thread' });
      }
    })

    // Report a thread
    .put(async (req, res) => {
      const { thread_id } = req.body;

      try {
        const thread = await Thread.findById(thread_id);
        if (thread) {
          thread.reported = true;
          await thread.save();
          res.status(200).send('reported');
        } else {
          res.status(200).send('Thread not found');
        }
      } catch (error) {
        console.error('Error reporting thread:', error);
        res.status(500).json({ error: 'Could not report thread' });
      }
    });

  // REPLIES ROUTES
  app.route('/api/replies/:board')

    // Create a new reply
    .post(async (req, res) => {
      const { board } = req.params;
      const { text, delete_password, thread_id } = req.body;

      try {
        // Ensure the thread belongs to the specified board
        const thread = await Thread.findOne({ _id: thread_id, board: board });
        if (thread) {
          const now = new Date(); // Single Date instance for consistency

          const reply = new Reply({
            text,
            delete_password,
            created_on: now, // Assign the same date to both fields
            reported: false
          });

          thread.replies.push(reply);
          thread.bumped_on = now; // Synchronize bumped_on with reply's created_on
          await thread.save();

          // Respond with the thread, including the new reply
          res.status(200).json({
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: thread.replies.map(reply => ({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on,
              delete_password: reply.delete_password,
              reported: reply.reported
            }))
          });
        } else {
          res.status(200).send('Thread not found');
        }
      } catch (error) {
        console.error('Error creating reply:', error);
        res.status(500).json({ error: 'Could not create reply' });
      }
    })

    // Get a single thread with all replies
    .get(async (req, res) => {
      const { thread_id } = req.query;

      try {
        const thread = await Thread.findById(thread_id);
        if (thread) {
          res.status(200).json({
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: thread.replies.map(reply => ({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on
            }))
          });
        } else {
          res.status(200).send('Thread not found');
        }
      } catch (error) {
        console.error('Error retrieving thread replies:', error);
        res.status(500).json({ error: 'Could not retrieve replies' });
      }
    })

    // Delete a reply
    .delete(async (req, res) => {
      const { board } = req.params;
      const { thread_id, reply_id, delete_password } = req.body;

      try {
        const thread = await Thread.findOne({ _id: thread_id, board: board });
        if (thread) {
          const reply = thread.replies.id(reply_id);
          if (reply && reply.delete_password === delete_password) {
            reply.text = '[deleted]';
            await thread.save();
            res.status(200).send('success');
          } else if (!reply) {
            res.status(200).send('Reply not found');
          } else {
            res.status(200).send('incorrect password');
          }
        } else {
          res.status(200).send('Thread not found');
        }
      } catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).json({ error: 'Could not delete reply' });
      }
    })

    // Report a reply
    .put(async (req, res) => {
      const { board } = req.params;
      const { thread_id, reply_id } = req.body;

      try {
        const thread = await Thread.findOne({ _id: thread_id, board: board });
        if (thread) {
          const reply = thread.replies.id(reply_id);
          if (reply) {
            reply.reported = true;
            await thread.save();
            res.status(200).send('reported');
          } else {
            res.status(200).send('Reply not found');
          }
        } else {
          res.status(200).send('Thread not found');
        }
      } catch (error) {
        console.error('Error reporting reply:', error);
        res.status(500).json({ error: 'Could not report reply' });
      }
    });
};



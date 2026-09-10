import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { authenticateRequest, requireCoordinatorOrAdmin } from '../utils/auth';

/**
 * HTTP Endpoint: createCommunityTask
 * Creates a community restoration task (drive). Only Coordinators and Admins can create tasks.
 */
export const createCommunityTask = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    requireCoordinatorOrAdmin(auth);

    const {
      title,
      activityType,
      siteName,
      latitude,
      longitude,
      region,
      date,
      startTime,
      maxVolunteers,
      description,
      coverImageUrl,
    } = req.body;

    if (!title || !activityType || latitude == null || longitude == null || !date || !startTime || !description) {
      res.status(422).json({ error: 'Missing required community task fields.' });
      return;
    }

    const db = admin.firestore();
    const taskRef = db.collection('communityTasks').doc();
    const taskDate = new Date(date);

    const taskData = {
      taskId: taskRef.id,
      creatorId: auth.uid,
      creatorName: auth.name || auth.email,
      siteName: siteName || 'Islamabad Drive Location',
      latitude: Number(latitude),
      longitude: Number(longitude),
      region: region || 'Islamabad, Pakistan',
      title,
      activityType,
      date: admin.firestore.Timestamp.fromDate(taskDate),
      startTime,
      maxVolunteers: maxVolunteers ? parseInt(maxVolunteers, 10) : null,
      currentParticipantCount: 0,
      description,
      coverImageUrl: coverImageUrl || null,
      status: 'open',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await taskRef.set(taskData);

    // Automatically join creator as organizer
    await taskRef.collection('participants').doc(auth.uid).set({
      userId: auth.uid,
      userName: auth.name || auth.email,
      role: 'organizer',
      status: 'joined',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      success: true,
      message: 'Community restoration drive created successfully.',
      data: { id: taskRef.id, ...taskData },
    });
  } catch (error: any) {
    console.error('[createCommunityTask] Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * HTTP Endpoint: joinCommunityTask
 * Transactional volunteer registration enforcing capacity constraints atomically.
 */
export const joinCommunityTask = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    const { taskId } = req.body;

    if (!taskId) {
      res.status(422).json({ error: 'Missing taskId.' });
      return;
    }

    const db = admin.firestore();
    const taskRef = db.collection('communityTasks').doc(taskId);
    const participantRef = taskRef.collection('participants').doc(auth.uid);

    const result = await db.runTransaction(async transaction => {
      const [taskSnap, participantSnap] = await Promise.all([
        transaction.get(taskRef),
        transaction.get(participantRef),
      ]);

      if (!taskSnap.exists) {
        throw new Error('TASK_NOT_FOUND');
      }

      const task = taskSnap.data()!;
      if (task.status !== 'open') {
        throw new Error('TASK_NOT_OPEN');
      }

      const currentParticipants = task.currentParticipantCount || 0;

      // Idempotency: If already joined, return success without double-incrementing
      if (participantSnap.exists && participantSnap.data()?.status === 'joined') {
        return {
          alreadyJoined: true,
          currentParticipants,
          status: 'joined',
        };
      }

      // Check max capacity
      if (task.maxVolunteers && currentParticipants >= task.maxVolunteers) {
        throw new Error('CAPACITY_REACHED');
      }

      // Write participant subdocument
      transaction.set(participantRef, {
        userId: auth.uid,
        userName: auth.name || auth.email,
        role: 'participant',
        status: 'joined',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Atomically increment currentParticipantCount
      transaction.update(taskRef, {
        currentParticipantCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        alreadyJoined: false,
        currentParticipants: currentParticipants + 1,
        status: 'joined',
      };
    });

    res.status(200).json({
      success: true,
      message: result.alreadyJoined ? 'Already joined task (idempotent).' : 'Joined task successfully.',
      data: {
        taskId,
        status: 'joined',
        current_participants: result.currentParticipants,
      },
    });
  } catch (error: any) {
    console.error('[joinCommunityTask] Error:', error);
    if (error.message === 'CAPACITY_REACHED') {
      res.status(400).json({ error: 'Task capacity reached. Cannot join full task.' });
      return;
    }
    if (error.message === 'TASK_NOT_OPEN') {
      res.status(400).json({ error: 'Community task is not open for registration.' });
      return;
    }
    if (error.message === 'TASK_NOT_FOUND') {
      res.status(404).json({ error: 'Community task not found.' });
      return;
    }
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * HTTP Endpoint: leaveCommunityTask
 * Volunteer leaves a task and frees capacity atomically.
 */
export const leaveCommunityTask = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    const { taskId } = req.body;

    if (!taskId) {
      res.status(422).json({ error: 'Missing taskId.' });
      return;
    }

    const db = admin.firestore();
    const taskRef = db.collection('communityTasks').doc(taskId);
    const participantRef = taskRef.collection('participants').doc(auth.uid);

    await db.runTransaction(async transaction => {
      const [taskSnap, participantSnap] = await Promise.all([
        transaction.get(taskRef),
        transaction.get(participantRef),
      ]);

      if (!taskSnap.exists) {
        throw new Error('TASK_NOT_FOUND');
      }

      if (!participantSnap.exists || participantSnap.data()?.status !== 'joined') {
        throw new Error('NOT_JOINED');
      }

      transaction.update(participantRef, {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(taskRef, {
        currentParticipantCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(200).json({
      success: true,
      message: 'Left community drive successfully.',
      data: { taskId, status: 'cancelled' },
    });
  } catch (error: any) {
    console.error('[leaveCommunityTask] Error:', error);
    if (error.message === 'NOT_JOINED') {
      res.status(400).json({ error: 'You are not currently joined in this task.' });
      return;
    }
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

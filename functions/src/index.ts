
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const onTradeCreated = functions.firestore
  .document("trades/{tradeId}")
  .onCreate(async (snap, context) => {
    const trade = snap.data();

    // Basic validation
    if (!trade) {
      functions.logger.error("No data associated with the event");
      return;
    }

    const { participants, proposerId, proposerUsername, receiverItemName } = trade;

    if (!participants || !Array.isArray(participants) || !proposerId) {
      functions.logger.error("Trade document is missing required fields.", { trade });
      return;
    }

    // Find the receiver (the user who is NOT the proposer)
    const receiverId = participants.find((uid: string) => uid !== proposerId);

    if (!receiverId) {
      functions.logger.error("Could not determine the receiver from participants.", { participants, proposerId });
      return;
    }

    // Define the notification payload
    const notificationPayload = {
      userId: receiverId,
      title: "New Trade Request",
      description: `${proposerUsername} wants to trade for your ${receiverItemName}!`,
      link: `/inbox`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      // Add the new notification to the receiver's subcollection
      await db
        .collection("users")
        .doc(receiverId)
        .collection("notifications")
        .add(notificationPayload);

      functions.logger.log(`Notification sent successfully to user: ${receiverId}`);
    } catch (error) {
      functions.logger.error(
        `Error sending notification to user: ${receiverId}`,
        error
      );
    }
  });

export const handleTradeStatusChange = functions.firestore
  .document("trades/{tradeId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Exit if data is missing or status hasn't changed
    if (!before || !after || before.status === after.status) {
        return;
    }

    const { proposerItemId, receiverItemId, status, tradeType } = after;

    if (!proposerItemId || !receiverItemId) {
      functions.logger.error("Trade document is missing item IDs.", { tradeId: context.params.tradeId });
      return;
    }

    const proposerItemRef = db.doc(`items/${proposerItemId}`);
    const receiverItemRef = db.doc(`items/${receiverItemId}`);
    const batch = db.batch();

    // 🔒 ACCEPTED → lock items
    if (status === "accepted" && before.status === "pending") {
      if (tradeType === "permanent") {
        batch.update(proposerItemRef, { status: "traded" });
        batch.update(receiverItemRef, { status: "traded" });
        functions.logger.log(`Items ${proposerItemId} and ${receiverItemId} locked as 'traded'.`);
      } else if (tradeType === "temporary") {
        batch.update(proposerItemRef, { status: "on-loan" });
        batch.update(receiverItemRef, { status: "on-loan" });
        functions.logger.log(`Items ${proposerItemId} and ${receiverItemId} locked as 'on-loan'.`);
      }
    }

    // 🔓 CANCELLED / REJECTED → unlock items
    const stoppedStatuses = ["rejected", "cancelled"];
    if (stoppedStatuses.includes(status) && ["pending", "accepted", "on-loan"].includes(before.status)) {
      batch.update(proposerItemRef, { status: "available" });
      batch.update(receiverItemRef, { status: "available" });
      functions.logger.log(`Items ${proposerItemId} and ${receiverItemId} unlocked as 'available'.`);
    }

    // 🏁 COMPLETED (Temporary Swap) → unlock items
    if (status === "completed" && before.status === "return-pending" && tradeType === "temporary") {
        batch.update(proposerItemRef, { status: "available" });
        batch.update(receiverItemRef, { status: "available" });
        functions.logger.log(`Temporary swap completed. Items ${proposerItemId} and ${receiverItemId} are available again.`);
    }
    
    // For permanent swaps that are completed, the status remains 'traded', so no action is needed here.

    await batch.commit();
  });


export const onReviewCreated = functions.firestore
  .document("users/{userId}/reviews/{reviewId}")
  .onCreate(async (snap, context) => {
    const review = snap.data();
    if (!review) {
      functions.logger.error("No data associated with the review event");
      return;
    }

    const { toUserId, rating: newRating } = review;
    if (!toUserId || typeof newRating !== 'number') {
      functions.logger.error("Review is missing toUserId or a valid rating.", { review });
      return;
    }
    
    const userToReviewRef = db.collection("users").doc(toUserId);

    try {
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userToReviewRef);

        if (!userDoc.exists) {
          throw new Error(`User document ${toUserId} does not exist!`);
        }

        const userData = userDoc.data() || {};
        const currentRating = userData.rating || 0;
        const reviewCount = userData.reviewCount || 0;

        // Incremental average calculation
        const newReviewCount = reviewCount + 1;
        const newAverageRating = ((currentRating * reviewCount) + newRating) / newReviewCount;

        transaction.update(userToReviewRef, {
          rating: Number(newAverageRating.toFixed(2)), // Keep 2 decimal places
          reviewCount: newReviewCount,
        });
      });
      
      functions.logger.log(`Successfully updated rating for user ${toUserId}`);

    } catch (error) {
      functions.logger.error(`Error updating rating for user ${toUserId} in transaction:`, error);
    }
  });

export const onItemDeleted = functions.firestore
  .document("items/{itemId}")
  .onDelete(async (snap, context) => {
    const { itemId } = context.params;
    const tradesRef = db.collection("trades");

    const proposerTradesQuery = tradesRef.where("proposerItemId", "==", itemId);
    const receiverTradesQuery = tradesRef.where("receiverItemId", "==", itemId);

    const [proposerSnapshot, receiverSnapshot] = await Promise.all([
      proposerTradesQuery.get(),
      receiverTradesQuery.get(),
    ]);

    const batch = db.batch();

    proposerSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    receiverSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    try {
      await batch.commit();
      functions.logger.log(`Successfully deleted trades associated with item ${itemId}`);
    } catch (error) {
      functions.logger.error(`Error deleting trades for item ${itemId}:`, error);
    }
  });

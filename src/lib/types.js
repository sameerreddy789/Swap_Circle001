// Type definitions are documented here for reference.
// In JavaScript, these serve as documentation only.

/**
 * @typedef {Object} Item
 * @property {string} id
 * @property {string} name
 * @property {string} condition
 * @property {string} imageUrl
 * @property {string} [thumbnailUrl]
 * @property {string} imageHint
 * @property {string} category
 * @property {string} description
 * @property {string} ownerId
 * @property {string} ownerUsername
 * @property {*} createdAt
 * @property {'available'|'traded'|'on-loan'} status
 * @property {string} location
 * @property {string} landmark
 * @property {'permanent'|'temporary'} tradePreference
 * @property {number} [loanDurationDays]
 * @property {string} lookingFor
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} email
 * @property {string} username
 * @property {string} [bio]
 * @property {string} [location]
 * @property {string} [profilePictureUrl]
 * @property {string[]} [swapHistory]
 * @property {number} [rating]
 * @property {number} [reviewCount]
 * @property {*} [createdAt]
 * @property {string} [phoneNumber]
 * @property {boolean} [termsAccepted]
 * @property {*} [termsAcceptedAt]
 * @property {string[]} [savedItems]
 * @property {string[]} [blockedUsers]
 */

/**
 * @typedef {Object} Trade
 * @property {string} id
 * @property {string} proposerId
 * @property {string} proposerUsername
 * @property {string} proposerItemId
 * @property {string} proposerItemName
 * @property {string} proposerItemImageUrl
 * @property {string} receiverId
 * @property {string} receiverUsername
 * @property {string} receiverItemId
 * @property {string} receiverItemName
 * @property {string} receiverItemImageUrl
 * @property {'pending'|'accepted'|'rejected'|'completed'|'on-loan'|'return-pending'|'cancelled'} status
 * @property {*} createdAt
 * @property {*} updatedAt
 * @property {string} [cancelledBy]
 * @property {*} [cancelledAt]
 * @property {string} [message]
 * @property {boolean} reviewedByProposer
 * @property {boolean} reviewedByReceiver
 * @property {'permanent'|'temporary'} tradeType
 * @property {number} [durationDays]
 * @property {boolean} [proposerAgreedReturn]
 * @property {boolean} [receiverAgreedReturn]
 * @property {boolean} [proposerAgreedStart]
 * @property {boolean} [receiverAgreedStart]
 * @property {string[]} participants
 */

/**
 * @typedef {Object} Message
 * @property {string} [id]
 * @property {string} tradeId
 * @property {string} senderId
 * @property {string} text
 * @property {*} createdAt
 */

/**
 * @typedef {Object} Review
 * @property {string} [id]
 * @property {string} fromUserId
 * @property {string} fromUsername
 * @property {string} toUserId
 * @property {string} tradeId
 * @property {number} rating
 * @property {string} comment
 * @property {*} createdAt
 */

/**
 * @typedef {Object} Report
 * @property {string} [id]
 * @property {string} reporterId
 * @property {string} reportedId
 * @property {string} tradeId
 * @property {'spam'|'harassment'|'fraud'|'inappropriate-item'|'other'} reason
 * @property {string} [comment]
 * @property {*} createdAt
 * @property {'pending'|'resolved'} status
 */

/**
 * @typedef {Object} HeroSlide
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} bgImage
 * @property {string} primaryBtn
 * @property {string} [secondaryBtn]
 * @property {string} primaryBtnLink
 * @property {string} [secondaryBtnLink]
 * @property {number} order
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} description
 * @property {string} link
 * @property {boolean} read
 * @property {*} createdAt
 */

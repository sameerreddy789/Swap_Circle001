
# 💖 SwapCircle 🥇

**A futuristic, high-end P2P bartering platform for the modern circular economy.**

SwapCircle is a Next.js web application built with Firebase that allows users to swap items with others in their community. It provides a modern, secure, and user-friendly platform for bartering goods, replacing traditional currency with a direct item-exchange ecosystem.

---

## 🚀 Elevator Pitch

In a world of fast consumption, SwapCircle offers a refreshing alternative. We are a peer-to-peer bartering platform that empowers you to trade items you no longer need for something new and valuable, directly with others in your community. By removing currency from the equation, we foster a sustainable, community-driven circular economy where one person's clutter becomes another's treasure. Our platform is designed to be seamless, secure, and visually engaging, making the age-old practice of bartering feel futuristic and exciting.

---

## ✨ Key Functionalities

SwapCircle is more than just a listing site; it's a complete ecosystem for secure and enjoyable trading.

### 1. Secure User Authentication & Verification
- **Email Verification**: To enhance security and user trust, all new accounts must be verified via email. A verification link is automatically sent upon registration.
- **Login Protection**: Users cannot log in until their email address has been successfully verified, preventing unverified accounts from participating in trades.
- **Robust Providers**: Authentication is powered by Firebase Auth, supporting both traditional email/password and seamless Google OAuth sign-in.

### 2. Dynamic Item Discovery
- **Real-time Browsing**: Items are fetched in real-time from Firestore, allowing users to see the latest listings without a page refresh.
- **Advanced Filtering & Sorting**: Users can instantly filter items by category, condition, and location. They can also sort by newest items to find the most recent listings.
- **Wishlist / Saved Items**: Users can save items to a personal wishlist, which is stored in their user profile document.

> **Architectural Note:** The browse page (`/items`) fetches all available items and performs filtering and sorting on the client-side for a fast, interactive experience. For larger-scale applications, this would be transitioned to server-side filtering with Firestore queries.

### 3. The Secure Trade Pipeline
Our trade process is built on a robust security model using Firestore's `participants` array logic.

- **Proposal**: A user initiates a trade, creating a `trade` document in Firestore.
- **`participants` Array**: This document includes a `participants` array containing the UIDs of both the proposer and the receiver.
- **Security Rule Enforcement**: Our Firestore rules ensure that a `trade` document can only be created if the requesting user's UID is in the `participants` array. Furthermore, users can only read or update a trade if their UID is present in that same array. This elegantly solves the "Rules are not Filters" problem by ensuring every query is pre-authorized.
- **Status Flow**: The trade moves through statuses (`pending` -> `accepted` -> `completed`/`rejected`), with each user only able to perform actions appropriate for their role in the trade.

### 4. Live Negotiation Hub
- **Real-time Chat**: Once a trade is `accepted`, a secure, real-time chat is enabled between the two participants.
- **Sub-collection for Messages**: Messages are stored in a `messages` sub-collection within each `trade` document (`/trades/{tradeId}/messages/{messageId}`). This keeps conversations organized and ensures they can only be accessed by the trade participants, as the security rules for the sub-collection inherit from the parent document.

### 5. Reputation System
- **Peer-to-Peer Reviews**: After a trade is `completed`, both users are prompted to leave a review for each other, consisting of a star rating (1-5) and an optional comment.
- **Average Rating Calculation**: A user's public rating is a running average. When a new review is submitted, a Firestore Cloud Function atomically updates the user's profile with the new average rating and increments their total `reviewCount`.
  - **Formula:** `newAverage = ((currentRating * reviewCount) + newRating) / (reviewCount + 1)`

---

## 🛠️ Technical Stack & Architecture

SwapCircle is built on a modern, serverless architecture designed for scalability, security, and a rich user experience.

| Component             | Technology                               | Purpose                                                                       |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| **Frontend**          | [Next.js](https://nextjs.org/) (React)   | App Router, Server Components, and API Routes for a high-performance UI.      |
| **Styling**           | [Tailwind CSS](https://tailwindcss.com/) | A utility-first CSS framework for rapid, custom UI development.               |
| **Animation**         | [Framer Motion](https://www.framer.com/motion/) | Powers the fluid animations and interactive elements.                         |
| **UI Components**     | [ShadCN UI](https://ui.shadcn.com/)      | A collection of beautifully designed, accessible, and composable components.  |
| **Database**          | [Firestore](https://firebase.google.com/docs/firestore) | A NoSQL, real-time database for storing all user and item data.               |
| **Authentication**    | [Firebase Auth](https://firebase.google.com/docs/auth) | Secure user management with email/password and Google OAuth providers.        |
| **File Storage**      | ImgBB (via API)                          | Hosts all user-uploaded images for items and profiles.                        |
| **Hosting**           | [Firebase Hosting](https://firebase.google.com/docs/hosting) | Provides fast, secure, and reliable hosting for the Next.js application.    |

### Serverless Architecture
The entire application runs on Google's serverless infrastructure. This means we don't manage servers. Firebase automatically handles scaling, authentication, and database operations, allowing the development team to focus solely on building user-facing features.

### Security Rules Logic
Our security is centered on user ownership and participation.
> **Critical Rule:** `allow read, update: if request.auth.uid in resource.data.participants;`
> This rule on the `/trades/{tradeId}` collection is the cornerstone of our security model. It declaratively states that a user can only interact with a trade document if their unique ID is stored in the `participants` list within that document. This prevents any user from ever accessing a trade they are not a part of.

---

## 🌊 The User Journey (A Textual Flowchart)

`New User Signup` ➡️ `"Verification Email Sent" Message` ➡️ `User Clicks Verification Link in Email` ➡️ `User Clicks "I've Verified" & Logs In`
  - **Public View**: Can browse all items.
  - **Authenticated View**:
    1.  **List an Item**: User navigates to `/items/new`, fills out a form with item details, and uploads a picture. The new item is created in the `/items` collection with their `ownerId`.
    2.  **Propose a Trade**: User finds an item they want and clicks "Request a Trade."
    3.  **Select an Offer**: A dialog appears, showing only their own items that are available for trade.
    4.  **Send Request**: Upon selection, a new document is created in `/trades` with `status: 'pending'` and both user UIDs in the `participants` array. A notification is sent to the other user.
    5.  **Negotiation**: If the trade is accepted, the status becomes `accepted`, and the real-time chat is unlocked.
    6.  **Final Handshake**: Users arrange the physical swap. Once complete, they both mark the trade as `completed` in the app.
    7.  **Leave a Review**: Both users are prompted to leave a rating and review for each other, which updates their public profiles.

---

## 📦 Installation & Environment Setup

Follow these steps to get a local instance of SwapCircle running.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/swapcircle.git
    cd swapcircle
    ```

2.  **Install Dependencies**
    ```bash

    npm install
    ```

3.  **Configure Environment Variables**
    This project uses an external service (ImgBB) for image uploads. You will need an API key from them.
    Create a file named `.env.local` in the root of your project and add the following:
    ```env
    # Get your API key from https://api.imgbb.com/
    NEXT_PUBLIC_IMGBB_API_KEY="your_imgbb_api_key_here"
    ```
    > **Note:** The Firebase configuration is already included in `src/firebase/config.ts` and does not need to be in the `.env` file.

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Folder Structure

A high-level overview of the `src` directory.

```
src
├── app/                  # Next.js App Router: Pages and API routes
│   ├── (auth)/           # Route group for auth pages (login, signup)
│   ├── items/            # Pages for browsing, creating, and viewing items
│   ├── api/              # API routes (if any)
│   ├── layout.tsx        # Root layout for the entire application
│   └── page.tsx          # Homepage
├── components/           # Reusable React components
│   ├── ui/               # Core UI components from ShadCN
│   ├── layout/           # Header, Footer, etc.
│   └── ...               # Feature-specific components (ItemCard, etc.)
├── firebase/             # Firebase configuration and custom hooks
│   ├── auth/             # Authentication-related hooks (useUser)
│   ├── firestore/        # Firestore hooks (useCollection, useDoc)
│   ├── config.ts         # Firebase project configuration
│   └── provider.tsx      # Core Firebase context provider
├── hooks/                # Custom React hooks (useScrollDirection, etc.)
├── lib/                  # Libraries, utility functions, and type definitions
│   ├── types.ts          # TypeScript type definitions for Firestore documents
│   └── utils.ts          # Utility functions (e.g., cn for Tailwind)
└── styles/               # Global styles and Tailwind CSS configuration
    └── globals.css       # Base styles and Tailwind directives
```

---

## 🗺️ Future Roadmap

- **[ ] Automated Email Notifications**: Implement Firebase Cloud Functions to send transactional emails (e.g., "New Trade Request," "Trade Accepted") to users.
- **[ ] Mobile Optimization**: Further enhance the responsive design for a native-app-like experience on mobile devices.
- **[ ] Advanced Search**: Integrate a more powerful search solution like Algolia for instant, typo-tolerant searching of items.
- **[ ] User-to-User Blocking**: Allow users to block communication from others to enhance safety and control.
- **[ ] Location-Based Filtering**: Integrate a mapping API to allow users to filter items by distance (e.g., "within 10 miles").


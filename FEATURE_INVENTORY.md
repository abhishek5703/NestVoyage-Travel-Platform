# NestVoyage Original → MERN Feature Inventory

## Confirmed from the supplied original source

| Area | Original implementation | MERN migration |
|---|---|---|
| Signup | Passport Local + passport-local-mongoose | Preserved through same plugin and session auth |
| Login | Passport Local | Preserved |
| Logout | Passport session logout | Preserved |
| Sessions | express-session + connect-mongo | Preserved, API/React compatible |
| Redirect-after-login | `req.session.redirectUrl` | React `next` query flow + protected routes |
| Guest browsing | Listing routes public | Preserved |
| Listing create | Owner/authenticated, Cloudinary | Preserved + multi-image support |
| Listing read | Public listing detail | Preserved |
| Listing update | Owner only | Preserved |
| Listing delete | Owner only | Preserved |
| Listing image | `image.url`/`image.filename` | Legacy field retained |
| Listing categories | 12 existing values, array | Retained |
| Reviews | Create/delete | Preserved |
| Review permissions | Author or listing owner can delete | Enforced by API |
| Review cascade | Listing deletion deletes referenced reviews | Preserved |
| Search | title/location/country + separate keyword search includes description/category | Unified backend search |
| Filters | category/location/min/max price | Preserved + combined filtering |
| Flash messages | connect-flash | React toast notifications |
| Validation | Joi | Joi on backend |
| Cloudinary | multer-storage-cloudinary | Retained |
| Responsive UI | Bootstrap/custom CSS | Rebuilt in React |
| Footer/navbar | Existing branded UI | Rebuilt as React components |

## New features added after core parity

- React SPA routing
- premium UI system
- skeleton loaders
- reusable empty/error states
- multi-image listing gallery
- profile editing
- profile image gallery
- primary profile image
- MongoDB favorites/wishlist
- MongoDB recently viewed
- sort + pagination
- dashboard statistics computed from real data
- server-backed recommendation endpoint
- Helmet
- CORS configuration
- rate limiting
- safer API error handling
- admin-role architecture

## Intentionally not fabricated

The original source does not contain:
- booking transactions
- notification infrastructure
- saved-search persistence
- moderation workflows
- listing coordinates

Those areas are not represented as fake working UI. A real booking/inquiry system can be added later with an actual data model and workflow.

## Destructive-operation check

The original `init/index.js` contains `Listing.deleteMany({})`. The MERN migration deliberately does not include an automatic seed/reset operation.

No migration step drops collections, resets the database, deletes existing users, or rewrites legacy listings automatically.

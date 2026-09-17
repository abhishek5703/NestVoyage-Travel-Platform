# Migration Notes

## Data compatibility

Existing User documents created by `passport-local-mongoose` remain usable because the migrated User model continues to use the same plugin rather than replacing stored credentials with a different password format.

Existing Listing documents using:

```js
image: {
  url: "...",
  filename: "..."
}
```

continue to render through the `coverImage` / `imageItems` compatibility logic.

New listings also populate the new:

```js
images: [
  { url: "...", publicId: "..." }
]
```

and mirror the first image into the legacy `image` field. This makes the transition reversible at the application layer and avoids requiring an immediate database migration.

## Important production caution

The uploaded original `.env` contained live-looking MongoDB, Cloudinary, and session-secret values. Those values were not copied into the generated MERN project and are not included in `.env.example`.

Because those credentials were present in the supplied archive, rotate them before a production deployment if they are still active.

## Authentication

The React app uses Axios with credentials and the Express API maintains the session server-side in MongoDB. Passwords are never placed in browser localStorage.

## Images

Listing and profile images are uploaded through Multer + Cloudinary. The API validates file count and size. Cloudinary public IDs are retained for later deletion/replacement.

## User deletion

The implemented account deletion path removes the user's owned listings, associated listing reviews through the listing cascade, authored reviews, and the user document. This is a deliberate destructive action and is protected by a confirmation prompt in the UI.

## Coordinates / map

The original Listing schema has no latitude/longitude/GeoJSON field. The migration does not invent coordinates. Add a real coordinate model and geocoding workflow before enabling an interactive map.

## Testing status in this environment

- All server JavaScript files passed `node --check`.
- JSON package manifests parsed successfully.
- `npm install` could not complete within the execution window, so a full runtime/browser test was not possible in this environment.
- No claim is made that Cloudinary/MongoDB credentials or a live deployment were tested here.

## First local validation after installing dependencies

1. Start the server and call `GET /api/health`.
2. Confirm an existing user can log in.
3. Open a legacy listing and confirm its old `image.url` renders.
4. Create, edit, and delete a listing as its owner.
5. Test review author/owner deletion.
6. Upload/replace listing images.
7. Upload/remove/set-primary profile images.
8. Test combined search/filters and pagination.
9. Test favorites and recently viewed with two accounts.
10. Build the client and run production mode with HTTPS when deployed.

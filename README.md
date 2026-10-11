# FIT v3 — Blue + Purple Gradient Edition

Your original blue–purple gradient look combined with the newer, simpler workout workflow.

## What changed
- New gradient FIT Home Screen icon (192px and 512px).
- Blue-to-purple gradient hero cards, buttons, highlights and checked states.
- Keep the v2 execution-first experience: open today's plan, check off exercises, done.
- Optional weight/reps details, protein tracking and on-device workout history.
- Existing FIT records remain under the same localStorage key (`fit-personal-v1`).
- Offline service-worker cache bumped to `fit-app-v3-bluepurple`.

## Publish on GitHub → Netlify
Copy the six app files (`index.html`, `app.js`, `manifest.webmanifest`, `sw.js`, and both icon PNG files) into the **root** of your existing `fit-app` GitHub repository, then commit to `main`. Netlify deploys automatically; don't redeploy with Netlify Drop. `README.md` is optional.

If GitHub's website won't overwrite existing files with a bulk upload, use GitHub Desktop to replace/commit the files, or edit the text files individually and upload the icon files.

**Important:** Local fitness records are stored in Safari on your phone; updates on the same site should preserve them, but changing devices, deleting site data, or removing a Home Screen web app can put local records at risk. Use FIT's export/backup feature before reinstalling or clearing data. An iPhone may keep the old Home Screen icon even after a successful deployment; the website itself should show the new design after refresh.

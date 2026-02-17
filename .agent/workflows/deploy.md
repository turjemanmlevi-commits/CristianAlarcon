---
description: Push to GitHub and deploy to Vercel
---

## Deploy workflow

// turbo-all

1. Stage all changes:
```
git add -A
```

2. Check what changed:
```
git status
```

3. Commit with a descriptive message:
```
git commit -m "update: <describe changes>"
```

4. Push to GitHub (Vercel auto-deploys from main):
```
git push
```

Note: Vercel is connected to the GitHub repo and auto-deploys on push to `main`. No need for manual `vercel --prod`.

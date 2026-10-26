# Learn24

Animated, step-by-step lessons on GenAI, Agentic AI, AI Security and AI System Design.
Created by Ajeetkumar.

## Preview on your computer
Double-click `index.html`. Everything works offline except the web fonts.

## Folder layout
```
index.html               Home: topics, search, live lessons
assets/data.js           The list of topics and lessons (edit this to add lessons)
assets/site.css|js       Look and logic for home and topic pages
assets/lesson.js         Adds the Learn24 bar, breadcrumb, previous/next and "Mark as done" to lessons
<topic>/index.html       Topic page (genai, agentic-ai, ai-security, ai-system-design)
<topic>/<lesson>.html    One animated lesson
vercel.json              Clean URLs on Vercel (/genai/llm-training instead of .html)
```

## Add a new lesson
1. Save the lesson HTML as `<topic>/<lesson-id>.html`.
2. Just before `</body>` add:
   ```html
   <script src="../assets/data.js"></script>
   <script src="../assets/lesson.js" data-lesson="<topic>/<lesson-id>"></script>
   ```
3. In `assets/data.js`, add (or update) the lesson in that topic with `status: "live"`.
4. Push to GitHub. Vercel redeploys in under a minute.

## Deploy on Vercel
1. Create a GitHub repo (e.g. `learn24`) and push this folder:
   ```
   git init
   git add .
   git commit -m "Learn24 starter site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/learn24.git
   git push -u origin main
   ```
2. On vercel.com: Add New → Project → import the repo.
   Framework preset: **Other**. Build command: none. Output directory: `./`. Click Deploy.
3. Custom domain: Project → Settings → Domains → add `learn24.com` (and `www.learn24.com`).
   Vercel shows the DNS records (an A record for the root, a CNAME for www) to add at your domain registrar.

## Your links
Paste your LinkedIn and Telegram URLs into `site.links` at the top of `assets/data.js`; they appear in the footer.

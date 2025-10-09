🎨 Moodeight

A simple web app where users can create personal moodboards, upload images, and organize them in a clean, responsive interface. Built as a Vibe Coder test assignment, the focus was on functionality, clean UI, and a smooth user experience.

🛠️ Stack & Deployment

React + Vite → lightweight, fast, modern frontend stack

TailwindCSS → utility-first styling for responsive design and quick iteration

Supabase → Google authentication, database storage for moodboards, and file storage for images

Cloudflare Pages → chosen for deployment. I’ve worked with Vercel and Netlify, but prefer Cloudflare for its polished production experience and avoidance of vendor lock-in often associated with Vercel/Next.js.

This stack aligns with defaults in modern AI-powered coding tools (Replit, Lovable, Bolt.dev), making it a natural fit for my workflow.

🧑‍💻 My Workflow

I build in close collaboration with AI coding tools (Claude Code, OpenAI Codex, Gemini CLI, Cursor). With paid access to multiple providers, I rotate between them to bypass rate limits and leverage their strengths.

My role is orchestration and context engineering:

Plan & Spec → clarify the goal, co-develop a written spec (Spec.md), and generate a step-by-step implementation plan (PROMPT_PLAN.md).

Iterative Build → work in small, focused loops: issue a targeted prompt, test results, adjust context, repeat.

Context Engineering → when the AI stalls, I provide the missing signals (logs, API responses, schemas, configs) so it can resolve issues decisively.

Polish & Integration → while AI generates the bulk of the code, I handle backend wiring, refine drag-and-drop, and ensure the final UX is cohesive.

In short: AI writes the code, I design the architecture, provide context, and keep quality high.

⚡ Challenges

Balancing design polish with technical constraints:

Board layout + drag & drop → making the grid visually pleasant while keeping reordering smooth.

Waterfall homepage effect → Savee-style previews with 4-image thumbnails per moodboard.

Wide image handling → ensuring wide images span multiple columns without breaking drag & drop logic.

These required iterating through grid systems and fine-tuning drag-and-drop behaviors until the UX felt right.

🚀 Live Demo

👉 Cloudflare Pages Deployment link: https://a11-moodboard.pages.dev/

📂 Repository

👉 GitHub Repo: https://github.com/LadislavMokry/A11-Moodboard

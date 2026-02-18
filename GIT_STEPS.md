# First-time Git setup – step-by-step

Your project is already a Git repo with commits. Follow these steps to put it on GitHub and push your code.

---

## Step 1: Create a GitHub account (if you don’t have one)

1. Go to **https://github.com**
2. Click **Sign up**
3. Enter email, password, and username
4. Verify your email if asked

---

## Step 2: Create a new repository on GitHub

1. Log in to GitHub
2. Click the **+** in the top-right → **New repository**
3. Fill in:
   - **Repository name:** e.g. `travel-journal` or `quick-links`
   - **Description:** optional (e.g. “Quick links hub with Snow Rider 3D”)
   - **Public**
   - **Do not** check “Add a README” (you already have one)
4. Click **Create repository**

---

## Step 3: Connect your folder to GitHub

GitHub will show a page like “Quick setup”. You’ll add the remote and push from your computer.

Open **PowerShell** or **Command Prompt**, go to your project folder, then run (replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your real GitHub username and repo name):

```powershell
cd c:\Users\colby\travel-journal

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

Example: if your username is `colby` and repo name is `travel-journal`:

```powershell
git remote add origin https://github.com/colby/travel-journal.git
```

---

## Step 4: Push your code to GitHub

```powershell
git branch -M main
git push -u origin main
```

- **`git branch -M main`** – renames your branch to `main` (GitHub’s default).
- **`git push -u origin main`** – sends your commits to GitHub and sets `main` as the default branch.

The first time you push, a browser or prompt may ask you to **log in to GitHub** (or use a Personal Access Token). Do that when prompted.

---

## Step 5: Check that it worked

1. Refresh the repo page on GitHub
2. You should see your files and commits
3. Your shareable link is: **`https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`**

---

## Quick reference – Git commands you’ll use later

| What you want to do        | Command |
|----------------------------|--------|
| See status                 | `git status` |
| Stage all changes          | `git add -A` |
| Commit with a message      | `git commit -m "Your message"` |
| Push to GitHub             | `git push` |
| Pull latest from GitHub    | `git pull` |

---

## If something goes wrong

- **“remote origin already exists”**  
  Run: `git remote remove origin`  
  Then run the `git remote add origin ...` command again with the correct URL.

- **“failed to push” / “Authentication failed”**  
  GitHub may require a **Personal Access Token** instead of a password:  
  1. GitHub → **Settings** → **Developer settings** → **Personal access tokens**  
  2. Generate a new token, check **repo**, copy it  
  3. When Git asks for a password, paste the token

- **Wrong URL**  
  Fix it with:  
  `git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`

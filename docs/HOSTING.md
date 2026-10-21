# Running the Atelier from the atelier computer

The website and the admin run on one Windows computer and reach the internet through
**Cloudflare Tunnel**. Nothing is opened on the router; Cloudflare gives the address HTTPS.
Your data (database, photos) stays on this computer, with nightly backups.

| Piece | Where |
|---|---|
| App (production) | `http://localhost:3100`, started by `scripts\start-atelier.ps1` |
| Tunnel | `scripts\start-tunnel.ps1` (Cloudflare `cloudflared`) |
| Database | `prisma\dev.db` (path set by `DATABASE_URL` in `.env`) |
| Photos and files | `storage\` (`STORAGE_DIR`) |
| Backups | `backups\` or `BACKUP_DIR`, newest 30 kept |
| Logs | `logs\app.log`, `logs\backup.log` |

Development (`npm run dev`) keeps using port 3000 and can run at the same time.

## 1. One-time setup

1. **Keep the computer awake.** Windows Settings → System → Power → *Screen and sleep*: set
   "When plugged in, put my device to sleep after" to **Never**. Keep it plugged in.
   (Closing the lid may still sleep a laptop: Control Panel → Power Options → *Choose what
   closing the lid does* → "Do nothing" when plugged in.)
2. **Backups off this computer (recommended).** In `.env` add
   `BACKUP_DIR="C:\Users\HP\OneDrive\Atelier backups"` so every backup is also in OneDrive.
3. **Start automatically.** In PowerShell, from the project folder:
   ```
   powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
   ```
   This adds three Windows scheduled tasks: *Atelier app* and *Atelier tunnel* (at sign-in)
   and *Atelier backup* (23:00 nightly). `-Remove` takes them away again.

## 2. The address

### Temporary address (works now, no account)
`scripts\start-tunnel.ps1` without a named tunnel prints an address like
`https://something-random.trycloudflare.com`. It works for testing but **changes every time
the tunnel restarts**, and Cloudflare does not guarantee it. Do not print it on cards.
To find the current one, open `logs\tunnel.log` and search for `trycloudflare.com`.

### Permanent address (free tunnel, needs a domain)
You need a free Cloudflare account and a domain whose DNS is on Cloudflare (for example
`shadobadr.com`, about USD 10 a year; Cloudflare Registrar sells them at cost).

1. Sign in once (opens your browser; choose the domain):
   ```
   cloudflared tunnel login
   ```
2. Create the tunnel and point your addresses at it:
   ```
   cloudflared tunnel create atelier
   cloudflared tunnel route dns atelier shadobadr.com
   cloudflared tunnel route dns atelier www.shadobadr.com
   ```
3. Create `C:\Users\HP\.cloudflared\config.yml` (replace the ID with the one `create` printed):
   ```yaml
   tunnel: atelier
   credentials-file: C:\Users\HP\.cloudflared\<TUNNEL-ID>.json
   ingress:
     - hostname: shadobadr.com
       service: http://localhost:3100
     - hostname: www.shadobadr.com
       service: http://localhost:3100
     - service: http_status:404
   ```
4. Restart the tunnel (or sign out and in). The website is at `https://shadobadr.com`,
   the admin at `https://shadobadr.com/admin`.

## 3. Updating to new code

```
git pull
powershell -ExecutionPolicy Bypass -File scripts\start-atelier.ps1 -Build
```
Stop the running app first (Task Manager → end the *Node.js* process, or restart the
*Atelier app* task). New database migrations are applied automatically and never delete data.
If the build fails, the previous version keeps running.

## 4. Backups and restoring

- Run one any time: `npm run backup`.
- Each backup folder holds `atelier.db` (the whole database) and `storage\` (all photos).
- **Restore:** stop the app, copy `atelier.db` over `prisma\dev.db` and the `storage` folder
  over `storage\`, then start the app again.

## 5. Security notes

- The admin is protected by your password; after 5 wrong attempts from one address,
  logins are refused for 15 minutes.
- Keep `.env` private; it holds the password and the session secret. Changing `AUTH_SECRET`
  signs everyone out.
- Use a long, unique admin password once the site is public.

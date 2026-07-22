// The live KMS Banana Desk UI is served directly by the Cloudflare Worker
// fetch handler in `worker/index.ts` for every non-API route, so this Next
// page is never actually rendered in this project. It's kept only because
// the vinext/vite build expects an app router entry point to exist.
export default function Home() {
  return null;
}

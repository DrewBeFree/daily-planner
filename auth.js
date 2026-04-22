// Run in browser console to generate your hash:
// [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('yourpassword')))].map(b=>b.toString(16).padStart(2,'0')).join('')
// Then paste the output as the value below.
const PASSWORD_HASH = 'REPLACE_WITH_YOUR_HASH';
if (PASSWORD_HASH === 'REPLACE_WITH_YOUR_HASH') {
  console.warn('[auth] PASSWORD_HASH is not set — auth gate will never unlock');
}
const SESSION_KEY = 'dp_session';

window.authReady = (async () => {
  // Demo mode — skip gate entirely
  if (new URLSearchParams(window.location.search).get('demo') === '1') {
    window.isDemo = true;
    return;
  }

  // Already authenticated this session
  if (localStorage.getItem(SESSION_KEY)) return;

  // Show gate and wait for unlock
  await new Promise((resolve, reject) => {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-box">
        <h1>Daily Planner</h1>
        <form id="auth-form">
          <input id="auth-input" type="password" placeholder="Password"
                 autocomplete="current-password" autofocus>
          <button type="submit">Unlock</button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('auth-form').addEventListener('submit', async e => {
      e.preventDefault();
      try {
        const val = document.getElementById('auth-input').value;
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
        const hash = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

        if (hash === PASSWORD_HASH) {
          localStorage.setItem(SESSION_KEY, crypto.randomUUID());
          overlay.remove();
          resolve();
        } else {
          const input = document.getElementById('auth-input');
          input.classList.add('shake');
          input.value = '';
          setTimeout(() => input.classList.remove('shake'), 500);
        }
      } catch (err) {
        reject(err);
      }
    });
  });
})();

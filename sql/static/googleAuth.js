(function () {
  const STORAGE_KEY = 'google-auth-user';
  const CLIENT_ID = '1004167027939-km7u1lm13mlvkc0f3kocd1a1mb8n7erj.apps.googleusercontent.com';
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzrnmSXPFRiOErgWM2YkDu8xpCjPjw0sywY2cOuDcUUn0vxI74vAfMMvYOHP8e48NlAFQ/exec';

  function getStoredUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('[GoogleAuth] Unable to read saved user.', error);
      return null;
    }
  }

  function saveUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function decodeJwtPayload(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  }

  async function sendTokenToScript(user) {
    if (!user?.token) {
      return Promise.resolve(null);
    }

    const payload = new URLSearchParams({
      token: user.token,
      email: user.email || '',
      name: user.name || '',
      id: user.id || ''
    });

    try {
        // 1. Робимо запит і чекаємо на саму відповідь сервера
        const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'cors', // ДОЗВОЛЯЄМО читати відповідь
        keepalive: true,
        headers: {
            'Content-Type': 'text/plain' // Використовуємо plain text, щоб GAS не сварився на CORS
        },
        body: JSON.stringify(payload) // Якщо payload це об'єкт, перетворюємо його на рядок JSON
        });

        // Перевіряємо, чи сервер не повернув помилку типу 404 або 500
        if (!response.ok) {
        throw new Error(`Помилка сервера: ${response.status}`);
        }

        // 2. ЧЕКАЄМО, поки асинхронний метод .json() розпарсить дані
        const data = await response.json();
        
        console.log('[GoogleAuth] Дані успішно отримано від бекенду:', data);
        
        // Повертаємо реальні дані (наприклад, { success: true, taskContent: "..." })
        return data; 

    } catch (error) {
        console.error('[GoogleAuth] Не вдалося відправити токен або розпарсити відповідь:', error);
        return null;
    }
  }

  function handleCredentialResponse(response) {
    if (!response?.credential) {
      return;
    }

    const payload = decodeJwtPayload(response.credential);
    const user = {
      id: payload.sub,
      name: payload.name || payload.email,
      email: payload.email,
      picture: payload.picture || '',
      token: response.credential
    };

    saveUser(user);
    renderAuthUI();
    sendTokenToScript(user);
    document.dispatchEvent(new CustomEvent('google-auth-ready', { detail: user }));
  }

  function signOut() {
    clearUser();
    renderAuthUI();
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  function handleSignIn() {
    if (!isConfigured()) {
      alert('Додайте ваш Google client ID у файл sql/static/googleAuth.js');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      alert('Google SDK ще не готовий. Спробуйте трохи пізніше.');
    }
  }

  function isConfigured() {
    return CLIENT_ID && !CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');
  }

  function renderAuthUI() {
    const container = document.getElementById('googleAuthContainer');
    if (!container) {
      return;
    }

    const user = getStoredUser();

    if (!user) {
      container.innerHTML = `
        <div class="google-auth-widget">
          <button id="googleSignInBtn" type="button">Увійти через Google</button>
        </div>
      `;

      const button = document.getElementById('googleSignInBtn');
      if (button) {
        button.addEventListener('click', handleSignIn);
      }
      return;
    }

    container.innerHTML = `
      <div class="google-auth-widget">
        <img src="${user.picture || ''}" alt="${user.name}" style="width: 28px; height: 28px; border-radius: 50%; margin-right: 8px; vertical-align: middle; display: ${user.picture ? 'inline-block' : 'none'};" />
        <span>${user.name}</span>
        <button id="googleSignOutBtn" type="button" style="margin-left: 8px;">Вийти</button>
      </div>
    `;

    const signOutButton = document.getElementById('googleSignOutBtn');
    if (signOutButton) {
      signOutButton.addEventListener('click', signOut);
    }
  }

  function initializeGoogleAuth() {
    if (!isConfigured()) {
      renderAuthUI();
      return;
    }

    if (!window.google?.accounts?.id) {
      window.setTimeout(initializeGoogleAuth, 200);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      ux_mode: 'popup'
    });

    renderAuthUI();

    const signInButton = document.getElementById('googleSignInBtn');
    if (signInButton) {
      window.google.accounts.id.renderButton(signInButton, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill'
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderAuthUI();
    initializeGoogleAuth();
    window.googleAuth = {
      signIn: handleSignIn,
      signOut,
      getUser: getStoredUser,
      sendTokenToScript
    };
  });
})();

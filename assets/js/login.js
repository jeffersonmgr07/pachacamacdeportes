document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-fill]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.fill;
      document.getElementById('username').value = type === 'admin' ? 'admin' : 'guerreros';
      document.getElementById('password').value = type === 'admin' ? 'admin123' : 'demo123';
    });
  });

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const res = await MF.call('login', { username, password });
    if (!res.ok) return MF.toast(res.message || 'No se pudo ingresar.', 'error');
    MF.setSession(res.user);
    location.href = res.user.role === 'admin' ? 'admin.html' : 'entrenador.html';
  });
});

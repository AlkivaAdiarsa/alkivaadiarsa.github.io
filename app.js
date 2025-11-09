function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-bs-theme', newTheme);
}
  function setThemeByTime() {
    const hour = new Date().getHours();
    const theme = (hour >= 19 || hour < 7) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', theme);
  }



const toggleButton = document.getElementById('theme-toggle');
const html = document.documentElement;

// Check for saved user preference, if any, on load of the website
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    html.setAttribute('data-theme', currentTheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.setAttribute('data-theme', 'dark');
}

toggleButton.addEventListener('click', () => {
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
});
const themeManager = (() => {
    const STORAGE_KEY = 'blog_theme_preference';
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function getStoredTheme() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function getSystemTheme() {
        return mediaQuery.matches ? 'dark' : 'light';
    }

    function getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || getStoredTheme() || getSystemTheme();
    }

    function updateButtons() {
        const isDark = getCurrentTheme() === 'dark';
        const label = isDark ? '切换到浅色模式' : '切换到深色模式';

        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
            }
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
        });
    }

    function setTheme(theme, persist = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (persist) {
            localStorage.setItem(STORAGE_KEY, theme);
        }
        updateButtons();
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    function toggle() {
        setTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark');
    }

    function init() {
        const storedTheme = getStoredTheme();
        document.documentElement.setAttribute('data-theme', storedTheme || getSystemTheme());
        updateButtons();

        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            button.addEventListener('click', toggle);
        });

        mediaQuery.addEventListener('change', event => {
            if (!getStoredTheme()) {
                setTheme(event.matches ? 'dark' : 'light', false);
            }
        });
    }

    return {
        getCurrentTheme,
        init,
        setTheme,
        toggle
    };
})();

window.addEventListener('DOMContentLoaded', () => themeManager.init());

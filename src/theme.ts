export const addThemeSwitchEventListener = () => {
    const themeSwitch = document.querySelector('#theme-switch') as HTMLInputElement;
    const theme = localStorage.getItem('theme');
    if (theme) {
        document.body.dataset.bsTheme = theme;
        themeSwitch.checked = theme === 'dark';
    }
    themeSwitch.addEventListener('change', () => {
        const newTheme = themeSwitch.checked ? 'dark' : 'light';
        document.body.dataset.bsTheme = newTheme;
        localStorage.setItem('theme', newTheme);
    });
};
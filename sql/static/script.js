document.addEventListener('DOMContentLoaded', async () => {
  ThemeManager.initTheme();

  const renderer = new CourseRenderer({
    container: document.getElementById('content'),
    nav: document.querySelector('.course-nav')
  });

  await renderer.init();
});

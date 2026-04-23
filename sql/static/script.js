// script.js - Main SPA coordinator
class SQLMaterialsSPA {
  constructor() {
    ThemeManager.initTheme();
    DataLoader.loadAlaSQL()
      .then(() => this.init())
      .catch(err => Utils.showError(err.message));
  }

  async init() {
    try {
      const { data, dbData, problems } = await DataLoader.loadData();
      const dbMap = DataLoader.buildDbMap(dbData);

      this.courseRenderer = new CourseRenderer(data, problems, dbMap);
      this.exerciseManager = new ExerciseManager(problems, dbMap);

      this.courseRenderer.renderCourseList();

      const lastCourse = parseInt(localStorage.getItem('lastCourseIndex')) || 0;
      this.courseRenderer.loadCourse(lastCourse);

      this.setupEventListeners();
    } catch (error) {
      Utils.showError(error.message);
    }
  }

  setupEventListeners() {
    document.addEventListener('click', e => this.handleClick(e));
    document.addEventListener('keydown', e => this.handleKeydown(e));
    this.courseRenderer.bindTabHandlers();
  }

  handleClick(e) {
    if (e.target.matches('.course-btn')) {
      const index = e.target.dataset.courseIndex;
      this.courseRenderer.loadCourse(index);
      localStorage.setItem('lastCourseIndex', index);
      return;
    }

    if (e.target.matches('.section-link')) {
      e.preventDefault();
      Utils.scrollToSection(e.target.dataset.sectionId);
      return;
    }

    const exerciseId = e.target.dataset.exerciseId;
    if (!exerciseId) return;

    if (e.target.matches('.run-btn'))         this.exerciseManager.runExercise(exerciseId);
    if (e.target.matches('.reset-btn'))       this.exerciseManager.resetExercise(exerciseId);
    if (e.target.matches('.hint-btn'))        this.exerciseManager.toggleHint(exerciseId);
    if (e.target.matches('.show-answer-btn')) this.exerciseManager.showAnswer(exerciseId);
  }

  handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const textarea = document.activeElement;
      if (textarea?.matches('.sql-editor') && textarea.dataset.exerciseId) {
        this.exerciseManager.runExercise(textarea.dataset.exerciseId);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new SQLMaterialsSPA();
});
// script.js - Main SPA coordinator
class SQLMaterialsSPA {
  constructor() {
    this.data = null;
    this.dbData = null;
    this.problems = null;
    this.dbMap = {};
    this.currentCourse = null;

    ThemeManager.initTheme();
    DataLoader.loadAlaSQL().then(() => this.init());
  }

  async init() {
    try {
      const { data, dbData, problems } = await DataLoader.loadData();
      this.data = data;
      this.dbData = dbData;
      this.problems = problems;
      this.dbMap = DataLoader.buildDbMap(dbData);

      this.courseRenderer = new CourseRenderer(this.data, this.problems, this.dbMap);
      this.exerciseManager = new ExerciseManager(this.problems, this.dbMap);

      this.setupEventListeners();
      this.courseRenderer.renderCourseList();
      this.courseRenderer.loadCourse(0);
    } catch (error) {
      Utils.showError(error.message);
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.course-btn')) {
        const index = e.target.dataset.courseIndex;
        this.courseRenderer.loadCourse(index);
      }
      if (e.target.matches('.section-link')) {
        const sectionId = e.target.dataset.sectionId;
        Utils.scrollToSection(sectionId);
      }
      if (e.target.matches('.run-btn')) {
        const exerciseId = e.target.dataset.exerciseId;
        this.exerciseManager.runExercise(exerciseId);
      }
      if (e.target.matches('.reset-btn')) {
        const exerciseId = e.target.dataset.exerciseId;
        this.exerciseManager.resetExercise(exerciseId);
      }
      if (e.target.matches('.hint-btn')) {
        const exerciseId = e.target.dataset.exerciseId;
        this.exerciseManager.toggleHint(exerciseId);
      }
      if (e.target.matches('.show-answer-btn')) {
        const exerciseId = e.target.dataset.exerciseId;
        this.exerciseManager.showAnswer(exerciseId);
      }
    });

    // Ctrl+Enter to run SQL in focused editor
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const textarea = document.activeElement;
        if (textarea && textarea.matches('.sql-editor')) {
          const exerciseId = textarea.dataset.exerciseId;
          if (exerciseId) this.exerciseManager.runExercise(exerciseId);
        }
      }
    });

    this.courseRenderer.bindTabHandlers();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SQLMaterialsSPA();
});
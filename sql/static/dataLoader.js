// dataLoader.js - Data loading and initialization
class DataLoader {
  static loadAlaSQL() {
    return new Promise((resolve) => {
      if (window.alasql) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/alasql/4.2.0/alasql.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  static async loadData() {
    try {
      const [materialsResponse, dbsResponse, problemsResponse] = await Promise.all([
        fetch('./sql/data/materials_test.json'),
        fetch('./sql/data/dbs.json'),
        fetch('./sql/data/problems_test.json')
      ]);

      const data = await materialsResponse.json();
      const dbData = await dbsResponse.json();
      const problems = await problemsResponse.json();

      return { data, dbData, problems };
    } catch (error) {
      console.error('Error loading materials, dbs or problems:', error);
      throw new Error('Не вдалось завантажити матеріали');
    }
  }

  static buildDbMap(dbData) {
    if (!Array.isArray(dbData)) return {};
    return dbData.reduce((map, db) => {
      if (db && db.dbName && Array.isArray(db.tables)) {
        map[db.dbName] = db.tables;
      }
      return map;
    }, {});
  }
}
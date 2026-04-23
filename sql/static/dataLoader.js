// dataLoader.js - Data loading and initialization
class DataLoader {
  static loadAlaSQL() {
    return new Promise((resolve, reject) => {
      if (window.alasql) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/alasql/4.2.0/alasql.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Не вдалось завантажити AlaSQL'));
      document.head.appendChild(script);
    });
  }

  static async loadData() {
    try {
      const [data, dbData, problems] = await Promise.all([
        fetch('./sql/data/materials_test.json').then(r => {
          if (!r.ok) throw new Error(`materials: ${r.status}`);
          return r.json();
        }),
        fetch('./sql/data/dbs.json').then(r => {
          if (!r.ok) throw new Error(`dbs: ${r.status}`);
          return r.json();
        }),
        fetch('./sql/data/problems_test.json').then(r => {
          if (!r.ok) throw new Error(`problems: ${r.status}`);
          return r.json();
        })
      ]);

      return { data, dbData, problems };
    } catch (error) {
      console.error('Error loading data:', error);
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
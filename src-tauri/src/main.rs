// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use sqlx::{migrate::MigrateDatabase, FromRow, Sqlite, SqlitePool};
use tauri::Manager;
use tokio;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

#[derive(Clone, FromRow, Debug, Deserialize, Serialize)]
struct Event {
    _id:u32,
    full_date: u32,
    day_of_year: u16,
    project: String,
    note: String,
    qty: u32,
}
#[derive(Clone, FromRow, Debug, Deserialize, Serialize)]
struct Habit {
    _id: u32,
    title: String,
    color: String,
    measure: bool,
    unit: String,
    highest_qty: u32,
    median: u32,
    rank: u16,
}
#[derive(Clone, Serialize, Deserialize)]
struct HabitOrigin {
    _id: u32,
    title: String,
    color: String,
    measure: bool,
    unit: String,
    highest_qty: u32,
    median: u32,
    events: Vec<Event>,
    rank: u16,
}

#[tauri::command]
async fn find_habit(db: tauri::State<'_, SqlitePool>, oid: u32) -> Result<HabitOrigin, ()> {
    let result = one_habit(db, oid).await;
    Ok(result)
}
#[tauri::command]
async fn change_habit_rank(
    db: tauri::State<'_, SqlitePool>,
    oid1: u32,
    r1: u16,
    oid2: u32,
    r2: u16,
) -> Result<Vec<HabitOrigin>, ()> {
    sqlx::query("UPDATE habits SET rank=? WHERE _id = ?")
        .bind(r2)
        .bind(oid1)
        .execute(&*db)
        .await;
    sqlx::query("UPDATE habits SET rank=? WHERE _id = ?")
        .bind(r1)
        .bind(oid2)
        .execute(&*db)
        .await;

    let results = all_habits(db).await;
    Ok(results)
}
#[tauri::command]
async fn remove_habit(db: tauri::State<'_, SqlitePool>, oid: u32) -> Result<Vec<HabitOrigin>, ()> {
    sqlx::query("DELETE FROM events WHERE habit_id=?")
        .bind(oid)
        .execute(&*db)
        .await
        .unwrap();

    sqlx::query("DELETE FROM habits WHERE _id=?")
        .bind(oid)
        .execute(&*db)
        .await
        .unwrap();

    let results = all_habits(db).await;

    Ok(results)
}

#[tauri::command]
async fn add_habit(
    db: tauri::State<'_, SqlitePool>,
    obj: HabitOrigin,
) -> Result<Vec<HabitOrigin>, ()> {
    print!("{}", obj.measure);
    sqlx::query(
        "INSERT INTO habits (title, color, measure, unit, highest_qty,median,rank)VALUES (?, ?, ?, ?, ?,?,?)",
    )
    .bind(obj.title)
    .bind(obj.color)
    .bind(obj.measure)
    .bind(obj.unit)
    .bind(obj.highest_qty)
    .bind(obj.median)
    .bind(obj.rank)
    .execute(&*db)
    .await
    .unwrap();

    let results = all_habits(db).await;
    Ok(results)
}

#[tauri::command]
async fn find_all(db: tauri::State<'_, SqlitePool>) -> Result<Vec<HabitOrigin>, ()> {
    let habit_results = all_habits(db).await;
    Ok(habit_results)
}

#[tauri::command]
async fn add_event(
    db: tauri::State<'_, SqlitePool>,
    obj: Event,
    oid: u32,
) -> Result<HabitOrigin, ()> {
    match sqlx::query_as::<_, Event>("SELECT * FROM events WHERE (full_date=? AND habit_id=?)")
        .bind(obj.full_date)
        .bind(oid)
        .fetch_one(&*db)
        .await
    {
        Ok(res) => {
            sqlx::query("UPDATE events SET project=?, qty=?,note=? WHERE _id=?")
            .bind(obj.project)
            .bind(obj.qty)
            .bind(obj.note)
            .bind(res._id)
            .execute(&*db)
            .await;
        }
        Err(_e) => {
            sqlx::query("INSERT INTO events (habit_id, full_date,project, qty,note,day_of_year)VALUES (?,  ?, ?, ?, ?,?)")
            .bind(oid)
        .bind(obj.full_date)
        .bind(obj.project)
        .bind(obj.qty)
        .bind(obj.note)
        .bind(obj.day_of_year)
        .execute(&*db)
        .await;
        }
    }
    let mut habit = get_habit_with_updated_median(db.clone(), oid).await;

    if obj.qty > habit.highest_qty {
        habit.highest_qty = obj.qty;
        sqlx::query("UPDATE habits SET highest_qty = ? WHERE _id = ?")
            .bind(obj.qty)
            .bind(habit._id)
            .execute(&*db)
            .await;
    }

    Ok(habit)
}

#[tauri::command]
async fn remove_event(
    db: tauri::State<'_, SqlitePool>,
    id: u32,
    oid: u32,
) -> Result<HabitOrigin, ()> {
    let event = sqlx::query_as::<_, Event>("SELECT * FROM events WHERE _id=?")
        .bind(id)
        .fetch_one(&*db)
        .await
        .unwrap();

    let qty = event.qty;

    sqlx::query("DELETE FROM events WHERE _id=?")
        .bind(id)
        .execute(&*db)
        .await;

    let mut habit = get_habit_with_updated_median(db.clone(), oid).await;

    if habit.highest_qty == qty {
        habit.highest_qty = 0;
        let events = sqlx::query_as::<_, Event>("SELECT * FROM events WHERE habit_id=?")
            .bind(oid)
            .fetch_all(&*db)
            .await
            .unwrap();
        for item in events.iter() {
            if habit.highest_qty < item.qty {
                habit.highest_qty = item.qty;
            }
        }
        sqlx::query("UPDATE habits SET highest_qty = ? WHERE _id = ?")
            .bind(habit.highest_qty)
            .bind(habit._id)
            .execute(&*db)
            .await;
    }

    Ok(habit)
}

async fn all_habits(db: tauri::State<'_, SqlitePool>) -> Vec<HabitOrigin> {
    let result_habits = sqlx::query_as::<_, Habit>("SELECT * FROM habits ORDER BY rank DESC")
        .fetch_all(&*db)
        .await
        .unwrap();

    let mut results = Vec::new();
    for habit in result_habits.iter() {
        let result_events = sqlx::query_as::<_, Event>("SELECT * FROM events WHERE habit_id = ?")
            .bind(habit._id)
            .fetch_all(&*db)
            .await
            .unwrap();
        let result = HabitOrigin {
            _id: habit._id,
            title: habit.title.clone(),
            color: habit.color.clone(),
            measure: habit.measure,
            unit: habit.unit.clone(),
            highest_qty: habit.highest_qty,
            events: result_events,
            median: habit.median,
            rank: habit.rank,
        };
        results.push(result);
    }
    return results;
}

async fn one_habit(db: tauri::State<'_, SqlitePool>, oid: u32) -> HabitOrigin {
    let result_habit = sqlx::query_as::<_, Habit>("SELECT * FROM habits WHERE _id = ?")
        .bind(oid)
        .fetch_one(&*db)
        .await
        .unwrap();

    let result_events = sqlx::query_as::<_, Event>("SELECT * FROM events WHERE habit_id = ?")
        .bind(oid)
        .fetch_all(&*db)
        .await
        .unwrap();

    let result = HabitOrigin {
        _id: result_habit._id,
        title: result_habit.title,
        color: result_habit.color,
        measure: result_habit.measure,
        unit: result_habit.unit,
        highest_qty: result_habit.highest_qty,
        events: result_events,
        median: result_habit.median,
        rank: result_habit.rank,
    };

    return result;
}
async fn get_habit_with_updated_median(db: tauri::State<'_, SqlitePool>, oid: u32) -> HabitOrigin {
    let mut habit = one_habit(db.clone(), oid).await;
    if habit.measure {
        let median;
        if habit.events.len() > 0 {
            habit.events.sort_by(|a, b| b.qty.cmp(&a.qty));
            let arr_size = habit.events.len();

            if arr_size % 2 == 0 {
                median = habit.events[arr_size / 2].qty;
            } else {
                median = habit.events[(arr_size - 1) / 2].qty;
            }
        } else {
            median = 0;
        }
        sqlx::query("UPDATE habits SET median = ? WHERE _id = ?")
            .bind(median)
            .bind(oid)
            .execute(&*db)
            .await;
    }
    return habit;
}
#[tokio::main]
async fn main() {
    const DB_URL: &str = "sqlite://data.db";
    if !Sqlite::database_exists(DB_URL).await.unwrap_or(false) {
        println!("Creating database {}", DB_URL);
        match Sqlite::create_database(DB_URL).await {
            Ok(_) => println!("Create db success"),
            Err(error) => panic!("error: {}", error),
        }
    } else {
        println!("Database already exists");
    }

    let db = SqlitePool::connect(DB_URL).await.unwrap();
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS events (
        _id         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        habit_id    INTEGER,
        full_date   INTEGER,
        project     TEXT,
        qty         INTEGER,
        note        TEXT,
        day_of_year INTEGER,
        FOREIGN KEY (
            habit_id
        )
        REFERENCES habits (_id) );",
    )
    .execute(&db)
    .await
    .unwrap();
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS habits (
        _id         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title       TEXT,
        color       TEXT,
        measure     BOOL,
        unit        TEXT,
        highest_qty INTEGER,
        median      INTEGER,
        rank        INTEGER);",
    )
    .execute(&db)
    .await
    .unwrap();
    tauri::Builder::default()
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            find_all,
            find_habit,
            add_habit,
            add_event,
            remove_habit,
            remove_event,
            change_habit_rank,
        ])
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);
            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
        }))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

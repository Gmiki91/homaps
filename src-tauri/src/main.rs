// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use futures::TryStreamExt;
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use mongodb::options::ClientOptions;
use mongodb::options::FindOptions;
use mongodb::Client;
use mongodb::Collection;
use serde::{Deserialize, Serialize};
use tauri::{Manager, Window};

use tokio;

#[derive(Clone, Debug, Deserialize, Serialize)]
struct Event {
    fullDate: u32,
    dayOfYear: u16,
    project: String,
    note: String,
    qty: u16,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
struct Habit {
    _id: ObjectId,
    title: String,
    color: String,
    freq: String,
    events: Vec<Event>,
    measure: bool,
    unit: String,
    highestQty: u16,
}

#[tauri::command]
async fn close_splashscreen(window: Window) {
    // Close splashscreen
    window
        .get_window("splashscreen")
        .expect("no window labeled 'splashscreen' found")
        .close()
        .unwrap();
    // Show main window
    window
        .get_window("main")
        .expect("no window labeled 'main' found")
        .show()
        .unwrap();
}

#[tauri::command]
async fn find_habit(
    collection: tauri::State<'_, Collection<Habit>>,
    oid: ObjectId,
) -> Result<Habit, ()> {
    let result = one_habit(collection.clone(), oid).await;
    Ok(result)
}

#[tauri::command]
async fn remove_habit(
    collection: tauri::State<'_, Collection<Habit>>,
    oid: ObjectId,
) -> Result<Vec<Habit>, ()> {
    collection.delete_one(doc! {"_id":oid}, None).await;

    let results = all_habits(collection).await;
    Ok(results)
}

#[tauri::command]
async fn add_habit(
    collection: tauri::State<'_, Collection<Habit>>,
    obj: Habit,
) -> Result<Vec<Habit>, ()> {
    collection.insert_one(obj, None).await;

    let results = all_habits(collection).await;
    Ok(results)
}

#[tauri::command]
async fn find_all(collection: tauri::State<'_, Collection<Habit>>) -> Result<Vec<Habit>, ()> {
    let results = all_habits(collection).await;
    Ok(results)
}

#[tauri::command]
async fn add_event(
    collection: tauri::State<'_, Collection<Habit>>,
    obj: Event,
    oid: ObjectId,
) -> Result<Habit, ()> {
    let mut habit = one_habit(collection.clone(), oid).await;
    habit.events.insert(0, obj.clone());

    if obj.qty > habit.highestQty {
        habit.highestQty = obj.qty
    }

    let filter = doc! {"_id": habit._id };
    //let update = doc! {"$set":{"events":bson::to_bson(&habit.events).unwrap()},"highestQty":obj.qty};
    collection.replace_one(filter, habit.clone(), None).await;
    Ok(habit)
}

#[tauri::command]
async fn remove_event(
    collection: tauri::State<'_, Collection<Habit>>,
    fullDate: u32,
    oid: ObjectId,
) -> Result<Habit, ()> {
    let mut habit = one_habit(collection.clone(), oid).await;
    
    'outer: for event in habit.events.iter() {
        if event.fullDate == fullDate { // find the event to be removed
            println!("{}",event.qty );
            println!("{}",event.qty == habit.highestQty );
            println!("{}",habit.highestQty );
            if event.qty == habit.highestQty { // if event was top qty
                
                habit.highestQty = 0;
                for item in habit.events.iter() { // look for second
                    if habit.highestQty < item.qty && item.fullDate != fullDate {
                        habit.highestQty = item.qty;
                    }
                }
                break 'outer;
            }else{
                break 'outer; // else nothing changes
            }
        }
    }
    println!("{}",habit.highestQty );
    habit.events.retain(|event| event.fullDate != fullDate);
   
    let filter = doc! {"_id": habit._id };
    // let update = doc! {"events":habit.events,"highestQty":habit.highestQty};
    collection.replace_one(filter, habit.clone(), None).await;
    Ok(habit)
}

async fn all_habits(collection: tauri::State<'_, Collection<Habit>>) -> Vec<Habit> {
    let mut cursor = collection.find(None, FindOptions::default()).await.unwrap();

    let mut results = Vec::new();
    while let Some(result) = cursor.try_next().await.unwrap() {
        results.push(result);
    }
    return results;
}

async fn one_habit(collection: tauri::State<'_, Collection<Habit>>, oid: ObjectId) -> Habit {
    let result = collection
        .find_one(doc! {"_id": oid}, None)
        .await
        .expect("Failed to find habit");
    return result.unwrap();
}

#[tokio::main]
async fn main() {
    let db_url = "mongodb://127.0.0.1:27017/homap";

    let options = ClientOptions::parse(db_url)
        .await
        .expect("invalid database url");

    let client = Client::with_options(options).unwrap();
    let db = client.default_database().unwrap();
    let target_collection = db.collection::<Habit>("habits");
    tauri::Builder::default()
        // let's register `collection` as a state. We'll be able to access it from the function
        // with tauri::State<Collection<Habit>>
        .manage(target_collection)
        // register handler here
        .invoke_handler(tauri::generate_handler![
            find_all,
            find_habit,
            add_habit,
            add_event,
            remove_habit,
            remove_event,
            close_splashscreen
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

import { useEffect, useState } from "react";
import Heatmap from "./Heatmap";
import { Habit } from "./Models";
import axios from 'axios';
import HabitForm from "./HabitForm";
import { invoke } from '@tauri-apps/api/tauri'
function App() {
  const [habits, setHabits] = useState([] as Habit[]);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    axios.get('http://localhost:4040/')
      .then(response => {
        setHabits(response.data.result);
        invoke('close_splashscreen');
      })
      .catch(error => alert(error.message));
  }

  return (
    <div className="homepage">
      <h1>Welcome to Homap!</h1>
      <button className="refresh_btn" onClick={refresh}>&#10227;</button>
      <div className="container">
        {habits?.map((habit) => <><Heatmap key={habit.title} habitObj={habit} onRemoveHabit={refresh} ></Heatmap></>)}
      </div>
      <h4>New list</h4>
      <HabitForm onSubmit={refresh}></HabitForm>
    </div>
  )

}
export default App;

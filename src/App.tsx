import { useEffect, useState } from "react";
import Heatmap from "./Heatmap";
import { Habit } from "./Models";
import HabitForm from "./HabitForm";
import { invoke } from '@tauri-apps/api/tauri'
function App() {
  const [habits, setHabits] = useState([] as Habit[]);


  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    invoke<Habit[]>('find_all')
      .then(response => setHabits(response))
      .catch(error => alert(error));
  }

  const addHabit = async (habit: Habit) => {
    return invoke<Habit[]>('add_habit', { obj: habit }).then((response) => {
      setHabits(response);
      return Promise.resolve(true);
    }).catch(error => {
      alert(error);
      return Promise.resolve(false);
    })
  }

  const removeHabit = async (habitId: number) => {
    const confirmation = await confirm('Are you sure you wish to delete this habit?');
    if (confirmation) {
      invoke<Habit[]>('remove_habit', { oid: habitId }).then((response) => {
        setHabits(response);
      }).catch(error => console.log(error));
    }
  }

  return (
    <div className="homepage">
      <div className="container">
        {habits?.map((habit) => <Heatmap key={habit.title} habitObj={habit} onRemoveHabit={() => removeHabit(habit._id!)} ></Heatmap>)}
      </div>
      <button className="refresh_btn" onClick={refresh}>&#10227;</button>
      <h4>New list</h4>
      <HabitForm onSubmit={addHabit}></HabitForm>
    </div>
  )

}
export default App;

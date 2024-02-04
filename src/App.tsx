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
    habit.rank = habits.length + 1;
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
      }).catch(error => alert(error));
    }
  }
  const changeRank = (id1:number,rank1:number,id2:number,rank2:number) => {
    invoke<Habit[]>('change_habit_rank', { oid1: id1,r1:rank1, oid2:id2,r2:rank2 }).then((response) => {
      setHabits(response);
    }).catch(error => alert(error));
  }

  return (
    <div className="homepage">
      <HabitForm onSubmit={addHabit}></HabitForm>
      <button className="btn" onClick={refresh}>&#10227;</button>
      <div className="container">
        {habits?.map((habit, i) => <>
          <Heatmap key={habit.title} habitObj={habit} onRemoveHabit={() => removeHabit(habit._id!)} ></Heatmap>
          {i < habits.length - 1 ? <button className="btn" key={i} onClick={()=>changeRank(habit._id,habit.rank, habits[i+1]._id,habits[i+1].rank)} >&#x2195;</button> :null}
        </>
        )}
      </div>
    </div>
  )

}
export default App;

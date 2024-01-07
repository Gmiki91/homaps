import { useEffect, useState } from "react";
import Heatmap from "./Heatmap";
import { Habit } from "./Models";
import axios from 'axios';
import HabitForm from "./HabitForm";
function App() {
  const [habits, setHabits] = useState([] as Habit[]);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    axios.get('http://localhost:4040/')
      .then(response => {
        setHabits(response.data.result);
      })
      .catch(err => alert(err));
  }

  return (
    <div className="homepage">
      <h1>Welcome to Homap!</h1>
      <HabitForm onSubmit={refresh}></HabitForm>
      <div className="container">
        {habits?.map((habit) => <><Heatmap onSubmit={(refresh)} key={habit.title} habit={habit} ></Heatmap></>)}
      </div>
    </div>
  )

}
export default App;

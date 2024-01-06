import { useState } from "react";
import Heatmap  from "./Heatmap";
import { Habit, MyEvent } from "./Models";
import { Colors } from "./Colors";
import axios from 'axios';
import HabitForm from "./HabitForm";
function App() {
  const [habits,setHabits] = useState([]as Habit[]);
  
  const baszodjalmeg = async()=>{
    axios.get('http://localhost:4040/').then(response=>{
      setHabits(response.data.result);
    })
  }
  const year = new Date().getFullYear();
  const daysInYear = (year % 400 === 0 || year % 100 !== 0 && year % 4 === 0) ? 366 : 365;
  const daysOfYearArr = [];
  for (let i = 1; i <= daysInYear; i++) {
    daysOfYearArr.push(i);
  }

  return (
    <div className="homepage">
      <h1>Welcome to Taudri!</h1>
      <HabitForm></HabitForm>
      <div className="container">
      {habits?.map((habit)=><><Heatmap key={habit.title} habit={habit} daysInYear={habit.freq=="weekly"? 52:daysInYear}></Heatmap></>)}
      </div>
      <button onClick={baszodjalmeg}>click</button>
    </div>
  )

}
export default App;

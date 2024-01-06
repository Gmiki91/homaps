import { useState } from "react";
import axios from 'axios';
import { Habit } from "./Models";
import SwitchButton from "./SwitchButton";
export default function HabitForm() {
  const [formData, setFormData] = useState({} as FormData);
  type FormData = {
    title: string,
    color: string,
    freq: "daily" | "weekly";
    measure: boolean,
    unit?: string
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = (event.target);
    setFormData(prevData => ({ ...prevData, [name]: value }))
  }
  const handleCheckbox = () => {
    setFormData(prevData => ({ ...prevData, measure: !prevData.measure }));
  }
  const handleSwitch = () => {
    setFormData(prevData => ({ ...prevData, freq: formData.freq=="weekly" ? "daily" : "weekly"}));
  }

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    //http call
    const habit: Habit = {
      title: formData.title,
      color: formData.color,
      freq: formData.freq || "daily",
      measure: formData.measure,
      unit: formData.unit,
      highestQty: formData.measure ? 1 : 0,
      events: []
    }
    axios.post('http://localhost:4040/', habit).then(() => { })
  }

  return <form onSubmit={handleSubmit}>
    <label>
      Title:
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
      />
    </label>
    <label>
      Color:
      <input
        type="text"
        name="color"
        value={formData.color}
        onChange={handleChange}
      />
    </label>
    <div className="switch">
      <label>
        Daily
      </label>
      <SwitchButton onChange={handleSwitch}></SwitchButton>
      <label>
        Weekly
      </label>
    </div>
    <label> Measurement:
      <input type="checkbox" name="measure" onChange={handleCheckbox} checked={formData.measure} />
    </label>
    {formData.measure ? <label>
      Unit:
      <input
        type="text"
        name="unit"
        value={formData.unit}
        onChange={handleChange}
      />
    </label> : null}
    <input type="submit" value="Submit" />
  </form>

}
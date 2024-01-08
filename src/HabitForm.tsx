import { useState } from "react";
import axios from 'axios';
import { Habit } from "./Models";
//import SwitchButton from "./SwitchButton";

type Props = {
  onSubmit: () => void
}
export default function HabitForm({ onSubmit }: Props) {
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
  // const handleSwitch = () => {
  //   setFormData(prevData => ({ ...prevData, freq: formData.freq == "weekly" ? "daily" : "weekly" }));
  // }

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    const habit: Habit = {
      title: formData.title,
      color: formData.color,
      freq: formData.freq || "daily",
      measure: formData.measure,
      unit: formData.unit,
      highestQty: formData.measure ? 1 : 0,
      events: []
    }
    axios.post('http://localhost:4040/', habit).then(() => {
      setFormData({
        title: "",
        color: "",
        freq: "daily",
        measure: false,
        unit: ""
      } as FormData);
      onSubmit()
    })
  }

  return <form className="habit_form" onSubmit={handleSubmit}>
    <div className="flex_column">
      <div className="flex_row">
    <label>
      Title:
    </label>
    <input
      type="text"
      name="title"
      autoComplete="off"
      value={formData.title}
      onChange={handleChange}
    />
    </div>
    <div className="flex_row">
    <label>
      Color:
    </label>
    <input
      type="text"
      name="color"
      autoComplete="off"
      value={formData.color}
      onChange={handleChange}
    />
     </div>
    </div>
    {/* <div className="switch">
      <label>
        Daily
      </label>
      <SwitchButton onChange={handleSwitch}></SwitchButton>
      <label>
        Weekly
      </label>
    </div> */}
    <div className="flex_row">
      <label> Measurement:
      </label>
      <input autoComplete="off" type="checkbox" name="measure" onChange={handleCheckbox} checked={formData.measure} />
    </div>
    {formData.measure ? <div className="flex_row"> <label>
      Unit:
    </label>
      <input
        className="unit"
        type="text"
        name="unit"
        autoComplete="off"
        value={formData.unit}
        onChange={handleChange}
      />
    </div> : null}

    <input className="button_8" type="submit" value="Submit" />
  </form>

}
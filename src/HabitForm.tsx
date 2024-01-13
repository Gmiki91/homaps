import { useState } from "react";
import { Habit } from "./Models";
import { Color } from "./Colors";
import mongoose from "mongoose";
type Props = {
  onSubmit: (habit: Habit) => Promise<boolean>;
}
export default function HabitForm({ onSubmit }: Props) {
  const [formData, setFormData] = useState({} as FormData);
  type FormData = {
    _id: mongoose.Types.ObjectId
    title: string,
    color: Color,
    freq: "daily" | "weekly";
    measure: boolean,
    unit: string
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = (event.target);
    setFormData(prevData => ({ ...prevData, [name]: value }))
  }
  const handleCheckbox = () => {
    setFormData(prevData => ({ ...prevData, measure: !prevData.measure }));
  }

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    const habit: Habit = {
      _id: new mongoose.Types.ObjectId(),
      title: formData.title,
      color: formData.color || "blue",
      freq: formData.freq || "daily",
      measure: formData.measure || false,
      unit: formData.unit || "",
      highestQty: formData.measure ? 1 : 0,
      events: []
    }

    onSubmit(habit).then(success => {
      if (success) {
        setFormData({
          title: "",
          color: "blue",
          freq: "daily",
          measure: false,
          unit: ""
        } as FormData);
      }
    });

  }

  return <form className="habit_form" onSubmit={handleSubmit}>
    <div className="flex_column">
      <div className="flex_row">
        <label>
          Title:
        </label>
        <input
          required
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
        <select name="color" value={formData.color} onChange={handleChange} >
          <option value="blue">Blue</option>
          <option value="red">Red</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
        </select>
      </div>
    </div>
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
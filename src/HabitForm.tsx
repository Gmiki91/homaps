import { useState } from "react";
import { Habit } from "./Models";
import { Color } from "./Colors";
type Props = {
  onSubmit: (habit: Habit) => Promise<boolean>;
}
export default function HabitForm({ onSubmit }: Props) {
  const [formData, setFormData] = useState({color:"blue"} as FormData);
  type FormData = {
    _id: number
    title: string,
    color: Color,
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
      _id: 0,
      title: formData.title,
      color: formData.color,
      measure: formData.measure || false,
      unit: formData.unit || "",
      highest_qty: formData.measure ? 1 : 0,
      median: formData.measure ? 1 : 0,
      events: [],
      rank:0
    }

    onSubmit(habit).then(success => {
      if (success) {
        setFormData({
          title: "",
          color: "blue",
          measure: false,
          unit: ""
        } as FormData);
      }
    });
  }

  return <form className="habit_form" onSubmit={handleSubmit}>
    <div className="flex_column">
      <div className="flex_row">
        <input
          required
          type="text"
          name="title"
          className="title"
          autoComplete="off"
          value={formData.title}
          onChange={handleChange}
          placeholder="New list"
        />
      </div>
    </div>
    <div className="flex_row">
      <label> Measurement:
      </label>
      <input autoComplete="off" type="checkbox" className="measure_box" name="measure" onChange={handleCheckbox} checked={formData.measure} />
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
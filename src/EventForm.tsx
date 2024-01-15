import { useState } from "react";
import { Habit, MyEvent } from "./Models";
type Props = {
  habit: Habit;
  selectedDate: Date;
  onSubmit: (event: MyEvent) => Promise<boolean>;
}
export default function EventForm({ habit, selectedDate, onSubmit }: Props) {
  const [formData, setFormData] = useState({note:"", qty: 0, project: habit.events[habit.events.length - 1]?.project } as FormData);
  type FormData = {
    project: string,
    note: string,
    qty: number,
  }

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    let error = false;
    for (let i = 0; i < habit.events.length; i++) {
      if (habit.events[i].full_date === selectedDate.setHours(12, 0, 0, 0) / 100000) {
        alert("There is already an event on this date.");
        error = true;
        break;
      }
    }
    if (!error) {
      const year = selectedDate.getFullYear();
      const myEvent: MyEvent = {
        full_date: selectedDate.setHours(12, 0, 0, 0) / 100000,
        day_of_year: Math.floor((selectedDate.valueOf() - new Date(year, 0, 0).valueOf()) / (1000 * 60 * 60 * 24)),
        project: formData.project || "",
        note: formData.note || "",
        qty: parseInt('' + formData.qty) || 0,
      }
      onSubmit(myEvent).then(success => {
        if (success) {
          setFormData({
            full_date: Date.now(),
            day_of_year: 0,
            project: formData.project,
            note: "",
            qty: 0
          } as FormData);
        }
      });
    }
  }
  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = (event.target);
    setFormData(prevData => ({ ...prevData, [name]: value }))
  }

  return <div className="form_container">
    <form className="event_form" onSubmit={handleSubmit}>
      <label className="date">{selectedDate.toLocaleDateString("de-DE", { year: "2-digit", month: "long", day: "numeric", weekday: "long" })}</label>
      <input
        className="project"
        type="text"
        name="project"
        autoComplete="off"
        placeholder="project name"
        value={formData.project}
        onChange={handleChange} />
      <textarea
        name="note"
        value={formData.note}
        onChange={handleChange}
        placeholder="note"
      />
      <div className="flex_row">
        {habit.measure ? <div className="measurement">
          <input autoComplete="off" className="unit" type="number" name="qty" min="0" value={formData.qty} onChange={handleChange} />
          <label>
            {habit.unit}
          </label>
        </div> : null}
        <input className="button_8" type="submit" value="Submit" />
      </div>
    </form>
  </div>
}
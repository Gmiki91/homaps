import { useEffect, useState } from "react";
import { Habit, MyEvent, HeatMapItem } from "./Models";
type Props = {
  habit: Habit;
  selectedItem: HeatMapItem;
  onSubmit: (event: MyEvent) => void;
}
type FormData = {
  project: string,
  note: string,
  qty: number,
}
export default function EventForm({ habit, selectedItem, onSubmit }: Props) {
  const [formData, setFormData] = useState<FormData>({} as FormData);

  useEffect(() => {
    if (selectedItem.event) {
      setFormData({
        project: selectedItem.event.project,
        note: selectedItem.event.note,
        qty: selectedItem.event.qty
      })
    } else {
      setFormData({ note: "", project: habit.events[habit.events.length - 1]?.project, qty: 0 });
    }
  }, [selectedItem]);

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    const year = selectedItem.date.getFullYear();
    const myEvent: MyEvent = {
      _id:0,
      full_date: selectedItem.date.setHours(12, 0, 0, 0) / 100000,
      day_of_year: Math.floor((selectedItem.date.valueOf() - new Date(year, 0, 0).valueOf()) / (1000 * 60 * 60 * 24)),
      project: formData.project || "",
      note: formData.note || "",
      qty: parseInt('' + formData.qty) || 0,
    }
    onSubmit(myEvent);
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = (event.target);
    setFormData(prevData => ({ ...prevData, [name]: value }))
  }

  return <div className="form_container">
    <form className="event_form" onSubmit={handleSubmit}>
      <input
        className="project"
        type="text"
        name="project"
        autoComplete="off"
        placeholder="project name ..."
        value={formData.project}
        onChange={handleChange} />
      <textarea
        name="note"
        value={formData.note}
        onChange={handleChange}
        placeholder="note ..."
      />
      <label className="date">{selectedItem.date.toLocaleDateString("de-DE", { year: "2-digit", month: "short", day: "numeric", weekday: "long" })}</label>
      <div className="flex_row">
        {habit.measure ? <div className="measurement">
          <input autoComplete="off" className="unit" placeholder="0" type="number" name="qty" min="1" required value={formData.qty} onChange={handleChange} />
          <label>
            {habit.unit}
          </label>
        </div> : null}
      </div>
      <input className="button_8" type="submit" value={selectedItem.event ? "Update" : "Submit"} />
    </form>
  </div>
}
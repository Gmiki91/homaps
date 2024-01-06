import axios from "axios";
import { useState } from "react";
import { Habit, MyEvent } from "./Models";
import DatePicker  from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
type Props = {
  habit: Habit
}
export default function EventForm({ habit }: Props) {
  const [startDate, setStartDate] = useState(new Date());
  const [formData, setFormData] = useState({} as FormData);
  type FormData = {
    fullDate: number,
    dayOfYear: number,
    note: string,
    qty?: number;
  }
  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    const year= startDate.getFullYear();
    const myEvent: MyEvent = {
      fullDate: startDate.valueOf(),
      dayOfYear: Math.floor((startDate.valueOf() - new Date(year, 0, 0).valueOf()) / (1000 * 60 * 60 * 24)),
      note: formData.note,
      qty: formData.qty,
    }
    axios.post(`http://localhost:4040/${habit._id}`, myEvent).then(() => { })
  }
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>| React.ChangeEvent<HTMLTextAreaElement> ) => {
    const { name, value } = (event.target);
    setFormData(prevData => ({ ...prevData, [name]: value }))
  }
  const measurement = habit.measure ? <div className="measurement">
      <input type="text" name="qty" value={formData.qty} onChange={handleChange} />
    <label>
      {habit.unit}
    </label>
  </div> : null;

  return <div className="form">
    <form onSubmit={handleSubmit}>
    <DatePicker selected={startDate} onChange={(date:Date) => setStartDate(date)} />
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="note"
        />
      
      {measurement}
      <input className="button_8" type="submit" value="Submit" />
    </form>
  </div>
}